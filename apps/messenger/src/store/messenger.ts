import { create } from 'zustand';
import { MLSGroup, type MLSCredential, type MLSCommit } from '@atlas/mls-core';

interface User {
  id: string;
  username: string;
  displayName: string;
  isAuthenticated: boolean;
}

interface Conversation {
  id: string;
  name: string;
  type: '1to1' | 'group';
  participants: string[];
  lastMessage?: Message;
  mlsGroup?: MLSGroup;
  unreadCount: number;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  encrypted: boolean;
  verified: boolean;
  mlsCommit?: MLSCommit;
  receiptSignature?: string;
}

interface MessengerState {
  // User state
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  
  // Conversations
  conversations: Conversation[];
  activeConversationId: string | null;
  setActiveConversation: (conversationId: string | null) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  
  // Messages
  messages: Record<string, Message[]>; // conversationId -> messages
  addMessage: (message: Message) => void;
  getMessages: (conversationId: string) => Message[];
  
  // MLS Group Management
  createMLSGroup: (conversationId: string, creator: MLSCredential) => void;
  addMemberToGroup: (conversationId: string, member: MLSCredential, adder: string) => MLSCommit | null;
  removeMemberFromGroup: (conversationId: string, memberToRemove: string, remover: string) => MLSCommit | null;
  
  // WebSocket connection
  wsConnection: WebSocket | null;
  setWSConnection: (ws: WebSocket | null) => void;
  
  // UI state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  
  // Actions
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createConversation: (name: string, type: '1to1' | 'group', participantIds: string[]) => Promise<void>;
}

export const useMessengerStore = create<MessengerState>((set, get) => ({
  // Initial state
  currentUser: null,
  conversations: [],
  activeConversationId: null,
  messages: {},
  wsConnection: null,
  isConnected: false,
  
  // User management
  setCurrentUser: (user) => set({ currentUser: user }),
  
  // Conversation management
  setActiveConversation: (conversationId) => {
    set({ activeConversationId: conversationId });
    
    // Mark as read
    if (conversationId) {
      const state = get();
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation && conversation.unreadCount > 0) {
        state.updateConversation(conversationId, { unreadCount: 0 });
      }
    }
  },
  
  addConversation: (conversation) => set((state) => ({
    conversations: [...state.conversations, conversation]
  })),
  
  updateConversation: (conversationId, updates) => set((state) => ({
    conversations: state.conversations.map(c =>
      c.id === conversationId ? { ...c, ...updates } : c
    )
  })),
  
  // Message management  
  addMessage: (message) => set((state) => {
    const conversationMessages = state.messages[message.conversationId] || [];
    const updatedMessages = [...conversationMessages, message];
    
    // Update conversation with last message
    const updatedConversations = state.conversations.map(c =>
      c.id === message.conversationId 
        ? { 
            ...c, 
            lastMessage: message,
            unreadCount: c.id === state.activeConversationId ? 0 : c.unreadCount + 1
          }
        : c
    );
    
    return {
      messages: {
        ...state.messages,
        [message.conversationId]: updatedMessages
      },
      conversations: updatedConversations
    };
  }),
  
  getMessages: (conversationId) => get().messages[conversationId] || [],
  
  // MLS Group Management
  createMLSGroup: (conversationId, creator) => {
    const mlsGroup = new MLSGroup(conversationId);
    mlsGroup.initialize(creator);
    
    set((state) => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId ? { ...c, mlsGroup } : c
      )
    }));
  },
  
  addMemberToGroup: (conversationId, member, adder) => {
    const state = get();
    const conversation = state.conversations.find(c => c.id === conversationId);
    
    if (!conversation?.mlsGroup) {
      console.error('MLS group not found for conversation:', conversationId);
      return null;
    }
    
    try {
      const commit = conversation.mlsGroup.addMember(member, adder);
      
      // Update conversation participants
      state.updateConversation(conversationId, {
        participants: [...conversation.participants, member.identity]
      });
      
      return commit;
    } catch (error) {
      console.error('Failed to add member to MLS group:', error);
      return null;
    }
  },
  
  removeMemberFromGroup: (conversationId, memberToRemove, remover) => {
    const state = get();
    const conversation = state.conversations.find(c => c.id === conversationId);
    
    if (!conversation?.mlsGroup) {
      console.error('MLS group not found for conversation:', conversationId);
      return null;
    }
    
    try {
      const commit = conversation.mlsGroup.removeMember(memberToRemove, remover);
      
      // Update conversation participants
      state.updateConversation(conversationId, {
        participants: conversation.participants.filter(p => p !== memberToRemove)
      });
      
      return commit;
    } catch (error) {
      console.error('Failed to remove member from MLS group:', error);
      return null;
    }
  },
  
  // WebSocket management
  setWSConnection: (ws) => set({ wsConnection: ws }),
  setConnected: (connected) => set({ isConnected: connected }),
  
  // Actions
  sendMessage: async (conversationId, content) => {
    const state = get();
    
    if (!state.currentUser) {
      throw new Error('User not authenticated');
    }
    
    const conversation = state.conversations.find(c => c.id === conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    // Create message
    const message: Message = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: state.currentUser.id,
      senderName: state.currentUser.displayName,
      content,
      timestamp: Date.now(),
      encrypted: false,
      verified: false
    };
    
    // Encrypt if MLS group exists
    if (conversation.mlsGroup) {
      try {
        const encryptedContent = conversation.mlsGroup.encryptMessage(content, state.currentUser.id);
        message.content = Array.from(encryptedContent).map(b => b.toString(16).padStart(2, '0')).join('');
        message.encrypted = true;
      } catch (error) {
        console.error('Failed to encrypt message:', error);
      }
    }
    
    // Send via WebSocket
    if (state.wsConnection && state.isConnected) {
      state.wsConnection.send(JSON.stringify({
        type: 'message',
        data: message
      }));
    }
    
    // Add to local state
    state.addMessage(message);
  },
  
  createConversation: async (name, type, participantIds) => {
    const state = get();
    
    if (!state.currentUser) {
      throw new Error('User not authenticated');
    }
    
    const conversationId = crypto.randomUUID();
    const conversation: Conversation = {
      id: conversationId,
      name,
      type,
      participants: [state.currentUser.id, ...participantIds],
      unreadCount: 0
    };
    
    // Create MLS group if multi-party
    if (type === 'group' || participantIds.length > 1) {
      const creatorCredential: MLSCredential = {
        identity: state.currentUser.id,
        publicKey: new Uint8Array(32) // Would be real public key
      };
      
      state.createMLSGroup(conversationId, creatorCredential);
    }
    
    state.addConversation(conversation);
    state.setActiveConversation(conversationId);
  }
}));