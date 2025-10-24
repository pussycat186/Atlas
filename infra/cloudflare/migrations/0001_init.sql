-- Atlas D1 Database Schema
-- Migration: 0001_init
-- Date: 2025-10-25
-- Description: Initial schema for Atlas Messenger

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at);

-- Devices table
CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  device_name TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  last_seen INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'direct', -- 'direct' or 'group'
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_conversations_created ON conversations(created_at);

-- Conversation members table
CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at INTEGER NOT NULL DEFAULT (unixepoch()),
  role TEXT NOT NULL DEFAULT 'member', -- 'member' or 'admin'
  PRIMARY KEY (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conv_members_user ON conversation_members(user_id);

-- Messages metadata table (encrypted payload stored in R2)
CREATE TABLE IF NOT EXISTS messages_meta (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  class TEXT NOT NULL DEFAULT 'text', -- 'text', 'media', 'file'
  r2_key TEXT, -- R2 object key for payload
  digest TEXT, -- SHA-256 for SRI
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages_meta(conversation_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages_meta(sender_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages_meta(timestamp DESC);

-- Receipts table (message delivery/read receipts)
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  message_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'delivered' or 'read'
  timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
  signature TEXT, -- RFC 9421 signature
  FOREIGN KEY (message_id) REFERENCES messages_meta(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_receipts_message ON receipts(message_id);
CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);

-- JWKS rotation log (for audit trail)
CREATE TABLE IF NOT EXISTS jwks_rotation (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kid TEXT NOT NULL,
  operation TEXT NOT NULL, -- 'create', 'rotate', 'revoke'
  timestamp INTEGER NOT NULL DEFAULT (unixepoch()),
  metadata TEXT -- JSON metadata
);

CREATE INDEX IF NOT EXISTS idx_jwks_rotation_kid ON jwks_rotation(kid);
CREATE INDEX IF NOT EXISTS idx_jwks_rotation_timestamp ON jwks_rotation(timestamp DESC);
