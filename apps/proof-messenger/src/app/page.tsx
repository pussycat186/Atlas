// Force static generation
export const dynamic = 'force-static';
export const revalidate = 60; // Revalidate every 60 seconds

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900" data-testid="pm-header-title">Atlas Proof Messenger</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="send-message-card">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900" data-testid="send-message-title">Send Message</h2>
              <p className="text-gray-600" data-testid="send-message-description">
                Send a verifiable message with integrity timeline
              </p>
            </div>
            <div className="space-y-4">
              <textarea 
                placeholder="Enter your message here..."
                className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md"
                data-testid="message-input"
              />
              <div className="flex gap-2">
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  data-testid="send-message-button"
                >
                  Send Message
                </button>
                <button 
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  data-testid="draft-message-button"
                >
                  Draft
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6" data-testid="recent-messages-card">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900" data-testid="recent-messages-title">Recent Messages</h2>
              <p className="text-gray-600" data-testid="recent-messages-description">
                View your message history and verification status
              </p>
            </div>
            <div className="space-y-3" data-testid="message-list">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg" data-testid="message-item-verified">
                <div>
                  <p className="font-medium text-gray-900" data-testid="message-content">Hello World</p>
                  <p className="text-sm text-gray-500" data-testid="message-timestamp">2 minutes ago</p>
                </div>
                <span 
                  className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                  data-testid="message-status-verified"
                >
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg" data-testid="message-item-pending">
                <div>
                  <p className="font-medium text-gray-900" data-testid="message-content">Test Message</p>
                  <p className="text-sm text-gray-500" data-testid="message-timestamp">1 hour ago</p>
                </div>
                <span 
                  className="px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded-full"
                  data-testid="message-status-pending"
                >
                  Pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}