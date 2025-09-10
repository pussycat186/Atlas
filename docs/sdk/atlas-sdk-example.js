/**
 * Atlas v12 SDK Example
 * 
 * This example demonstrates how to use the Atlas v12 API for secure,
 * multi-witness data integrity. The SDK provides a simple interface
 * for submitting messages and monitoring witness network health.
 */

class AtlasSDK {
  constructor(apiKey, baseUrl = 'http://localhost:3000/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Submit a message to the Atlas Gateway for witness attestation
   * @param {string} message - The message content
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Object>} - Message response with attestation details
   */
  async submitMessage(message, metadata = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.defaultHeaders,
        body: JSON.stringify({
          message,
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            source: 'atlas-sdk'
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to submit message:', error);
      throw error;
    }
  }

  /**
   * Retrieve a specific message by ID
   * @param {string} messageId - The message ID
   * @returns {Promise<Object>} - Message details with attestation information
   */
  async getMessage(messageId) {
    try {
      const response = await fetch(`${this.baseUrl}/messages/${messageId}`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get message:', error);
      throw error;
    }
  }

  /**
   * List messages with optional filtering
   * @param {Object} options - Query options (limit, offset, status, etc.)
   * @returns {Promise<Object>} - Paginated list of messages
   */
  async listMessages(options = {}) {
    try {
      const params = new URLSearchParams();
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`${this.baseUrl}/messages?${params}`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to list messages:', error);
      throw error;
    }
  }

  /**
   * Get witness network status
   * @returns {Promise<Object>} - Witness network health and quorum status
   */
  async getWitnessStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/witnesses`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get witness status:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific witness
   * @param {string} witnessId - The witness ID (w1, w2, w3, w4, w5)
   * @returns {Promise<Object>} - Detailed witness information
   */
  async getWitnessDetails(witnessId) {
    try {
      const response = await fetch(`${this.baseUrl}/witnesses/${witnessId}`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get witness details:', error);
      throw error;
    }
  }

  /**
   * Get system metrics
   * @param {string} timeRange - Time range for metrics (1h, 6h, 24h, 7d, 30d)
   * @param {string} metricType - Type of metrics (system, application, witness, business)
   * @returns {Promise<Object>} - Metrics data
   */
  async getMetrics(timeRange = '1h', metricType = 'application') {
    try {
      const response = await fetch(`${this.baseUrl}/metrics?time_range=${timeRange}&metric_type=${metricType}`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get metrics:', error);
      throw error;
    }
  }

  /**
   * Check system health
   * @returns {Promise<Object>} - System health status
   */
  async getHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get health status:', error);
      throw error;
    }
  }

  /**
   * Get quorum status
   * @returns {Promise<Object>} - Detailed quorum information
   */
  async getQuorumStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/admin/quorum`, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`API Error: ${error.error.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get quorum status:', error);
      throw error;
    }
  }
}

// Example usage
async function example() {
  // Initialize the SDK
  const atlas = new AtlasSDK('sk_live_demo_key_123456789');

  try {
    console.log('🚀 Atlas v12 SDK Example');
    console.log('========================');

    // 1. Check system health
    console.log('\n1. Checking system health...');
    const health = await atlas.getHealth();
    console.log('Health Status:', health.status);
    console.log('Witness Quorum:', health.witnesses.quorum ? '✅ Achieved' : '❌ Lost');
    console.log('Healthy Witnesses:', `${health.witnesses.healthy}/${health.witnesses.total}`);

    // 2. Submit a message
    console.log('\n2. Submitting a message...');
    const messageResponse = await atlas.submitMessage(
      'Hello from Atlas v12 SDK!',
      {
        userId: 'demo_user_123',
        source: 'sdk_example',
        tags: ['demo', 'sdk', 'javascript']
      }
    );
    console.log('Message ID:', messageResponse.id);
    console.log('Status:', messageResponse.status);
    console.log('Quorum Achieved:', messageResponse.quorum ? '✅ Yes' : '❌ No');
    console.log('Attestations:', messageResponse.attestations);

    // 3. Get message details
    console.log('\n3. Retrieving message details...');
    const messageDetails = await atlas.getMessage(messageResponse.id);
    console.log('Message:', messageDetails.data.message);
    console.log('Witnesses:', messageDetails.witnesses.join(', '));
    console.log('Trace ID:', messageDetails.traceId);

    // 4. Check witness network status
    console.log('\n4. Checking witness network...');
    const witnessStatus = await atlas.getWitnessStatus();
    console.log('Witness Network Status:');
    witnessStatus.witnesses.forEach(witness => {
      const status = witness.status === 'healthy' ? '✅' : 
                   witness.status === 'degraded' ? '⚠️' : '❌';
      console.log(`  ${status} ${witness.id}: ${witness.status} (${witness.region}) - ${witness.attestations} attestations`);
    });

    // 5. Get metrics
    console.log('\n5. Retrieving metrics...');
    const metrics = await atlas.getMetrics('1h', 'application');
    console.log('Application Metrics (1h):');
    console.log(`  Message Rate: ${metrics.metrics.messageRate}/hour`);
    console.log(`  Latency P50: ${metrics.metrics.latencyP50}ms`);
    console.log(`  Latency P95: ${metrics.metrics.latencyP95}ms`);
    console.log(`  Error Rate: ${metrics.metrics.errorRate}%`);
    console.log(`  Throughput: ${metrics.metrics.throughput} req/s`);

    // 6. List recent messages
    console.log('\n6. Listing recent messages...');
    const recentMessages = await atlas.listMessages({
      limit: 5,
      status: 'success'
    });
    console.log(`Found ${recentMessages.pagination.total} total messages`);
    console.log('Recent messages:');
    recentMessages.messages.forEach(msg => {
      console.log(`  - ${msg.id}: ${msg.status} (${msg.attestations} attestations)`);
    });

    console.log('\n✅ Example completed successfully!');

  } catch (error) {
    console.error('❌ Example failed:', error.message);
  }
}

// Node.js usage example
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AtlasSDK;
  
  // Run example if this file is executed directly
  if (require.main === module) {
    example();
  }
}

// Browser usage example
if (typeof window !== 'undefined') {
  window.AtlasSDK = AtlasSDK;
  
  // Auto-run example in browser
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', example);
  } else {
    example();
  }
}

// Additional utility functions
class AtlasUtils {
  /**
   * Validate API key format
   * @param {string} apiKey - The API key to validate
   * @returns {boolean} - Whether the API key format is valid
   */
  static validateApiKey(apiKey) {
    return /^sk_live_[a-zA-Z0-9]{32}$/.test(apiKey);
  }

  /**
   * Generate a demo API key (for testing only)
   * @returns {string} - A demo API key
   */
  static generateDemoApiKey() {
    const randomPart = Math.random().toString(36).substring(2, 34);
    return `sk_live_${randomPart}`;
  }

  /**
   * Format timestamp for display
   * @param {string} timestamp - ISO timestamp
   * @returns {string} - Formatted timestamp
   */
  static formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  /**
   * Calculate quorum percentage
   * @param {number} healthy - Number of healthy witnesses
   * @param {number} total - Total number of witnesses
   * @returns {number} - Quorum percentage
   */
  static calculateQuorumPercentage(healthy, total) {
    return Math.round((healthy / total) * 100);
  }
}

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports.AtlasUtils = AtlasUtils;
}

if (typeof window !== 'undefined') {
  window.AtlasUtils = AtlasUtils;
}
