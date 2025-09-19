/**
 * Anti-Replay Protection for Atlas Gateway
 * 
 * Implements server-side anti-replay protection with:
 * - Per-device monotonic counters
 * - Nonce uniqueness validation
 * - Timestamp freshness checks
 * - Configurable time windows
 */

// import { createHash } from 'crypto'; // Not used in current implementation

export interface ReplayCheck {
  nonce: string;
  counter: number;
  deviceId: string;
  timestamp: string;
  senderId: string;
}

export interface ReplayViolation {
  type: 'duplicate_nonce' | 'counter_regression' | 'timestamp_skew' | 'invalid_device';
  message: string;
  details: any;
}

export class AntiReplayProtection {
  private seenNonces: Map<string, number> = new Map();
  private deviceCounters: Map<string, number> = new Map();
  private deviceTimestamps: Map<string, number> = new Map();
  private timeWindow: number;
  private maxNonces: number;
  private violationCounts: Map<string, number> = new Map();

  constructor(
    timeWindowMs: number = 5 * 60 * 1000, // 5 minutes
    maxNonces: number = 100000
  ) {
    this.timeWindow = timeWindowMs;
    this.maxNonces = maxNonces;
  }

  /**
   * Validate message for replay attacks
   */
  validateMessage(check: ReplayCheck): { valid: boolean; violation?: ReplayViolation } {
    const now = Date.now();
    const messageTime = new Date(check.timestamp).getTime();
    const timeDiff = Math.abs(now - messageTime);

    // Check timestamp freshness
    if (timeDiff > this.timeWindow) {
      const violation: ReplayViolation = {
        type: 'timestamp_skew',
        message: `Message timestamp outside time window (${timeDiff}ms > ${this.timeWindow}ms)`,
        details: {
          messageTime,
          currentTime: now,
          timeDiff,
          timeWindow: this.timeWindow
        }
      };
      this.recordViolation('timestamp_skew');
      return { valid: false, violation };
    }

    // Check nonce uniqueness
    const nonceKey = `${check.senderId}:${check.deviceId}:${check.nonce}`;
    if (this.seenNonces.has(nonceKey)) {
      const violation: ReplayViolation = {
        type: 'duplicate_nonce',
        message: 'Nonce already seen for this device',
        details: {
          nonce: check.nonce,
          deviceId: check.deviceId,
          senderId: check.senderId,
          firstSeen: this.seenNonces.get(nonceKey)
        }
      };
      this.recordViolation('duplicate_nonce');
      return { valid: false, violation };
    }

    // Check counter monotonicity
    const counterKey = `${check.senderId}:${check.deviceId}`;
    const lastCounter = this.deviceCounters.get(counterKey) || 0;
    if (check.counter <= lastCounter) {
      const violation: ReplayViolation = {
        type: 'counter_regression',
        message: 'Counter must be greater than last seen counter',
        details: {
          currentCounter: check.counter,
          lastCounter,
          deviceId: check.deviceId,
          senderId: check.senderId
        }
      };
      this.recordViolation('counter_regression');
      return { valid: false, violation };
    }

    // Check device timestamp monotonicity (prevent old messages)
    const lastTimestamp = this.deviceTimestamps.get(counterKey) || 0;
    if (messageTime < lastTimestamp) {
      const violation: ReplayViolation = {
        type: 'timestamp_skew',
        message: 'Message timestamp is older than last seen message',
        details: {
          messageTime,
          lastTimestamp,
          deviceId: check.deviceId,
          senderId: check.senderId
        }
      };
      this.recordViolation('timestamp_skew');
      return { valid: false, violation };
    }

    // Update state
    this.seenNonces.set(nonceKey, now);
    this.deviceCounters.set(counterKey, check.counter);
    this.deviceTimestamps.set(counterKey, messageTime);

    // Cleanup if needed
    this.cleanup();

    return { valid: true };
  }

  /**
   * Record violation for monitoring
   */
  private recordViolation(type: string): void {
    const count = this.violationCounts.get(type) || 0;
    this.violationCounts.set(type, count + 1);
  }

  /**
   * Cleanup old nonces to prevent memory leaks
   */
  private cleanup(): void {
    if (this.seenNonces.size > this.maxNonces) {
      // Remove oldest 25% of nonces
      const entries = Array.from(this.seenNonces.entries());
      entries.sort((a, b) => a[1] - b[1]);
      const toRemove = Math.floor(entries.length * 0.25);
      
      for (let i = 0; i < toRemove; i++) {
        const entry = entries[i];
        if (entry) {
          this.seenNonces.delete(entry[0]);
        }
      }
    }
  }

  /**
   * Get violation statistics
   */
  getViolationStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [type, count] of this.violationCounts.entries()) {
      stats[type] = count;
    }
    return stats;
  }

  /**
   * Get device statistics
   */
  getDeviceStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    for (const [key, counter] of this.deviceCounters.entries()) {
      const parts = key.split(':');
      const senderId = parts[0];
      const deviceId = parts[1];
      const lastTimestamp = this.deviceTimestamps.get(key) || 0;
      
      if (senderId && deviceId) {
        if (!stats[senderId]) {
          stats[senderId] = {};
        }
        
        stats[senderId][deviceId] = {
          lastCounter: counter,
          lastTimestamp: new Date(lastTimestamp).toISOString(),
          messageCount: counter
        };
      }
    }
    
    return stats;
  }

  /**
   * Reset device state (for testing or device revocation)
   */
  resetDevice(senderId: string, deviceId: string): void {
    const counterKey = `${senderId}:${deviceId}`;
    this.deviceCounters.delete(counterKey);
    this.deviceTimestamps.delete(counterKey);
    
    // Remove all nonces for this device
    const nonceKeys = Array.from(this.seenNonces.keys())
      .filter(key => key.startsWith(`${senderId}:${deviceId}:`));
    
    for (const key of nonceKeys) {
      this.seenNonces.delete(key);
    }
  }

  /**
   * Get metrics for Prometheus
   */
  getMetrics(): string {
    const stats = this.getViolationStats();
    const deviceCount = this.deviceCounters.size;
    const nonceCount = this.seenNonces.size;
    
    return `# HELP atlas_anti_replay_violations_total Total number of anti-replay violations by type
# TYPE atlas_anti_replay_violations_total counter
atlas_anti_replay_violations_total{type="duplicate_nonce"} ${stats.duplicate_nonce || 0}
atlas_anti_replay_violations_total{type="counter_regression"} ${stats.counter_regression || 0}
atlas_anti_replay_violations_total{type="timestamp_skew"} ${stats.timestamp_skew || 0}
atlas_anti_replay_violations_total{type="invalid_device"} ${stats.invalid_device || 0}

# HELP atlas_anti_replay_devices_total Total number of tracked devices
# TYPE atlas_anti_replay_devices_total gauge
atlas_anti_replay_devices_total ${deviceCount}

# HELP atlas_anti_replay_nonces_total Total number of tracked nonces
# TYPE atlas_anti_replay_nonces_total gauge
atlas_anti_replay_nonces_total ${nonceCount}

# HELP atlas_anti_replay_time_window_seconds Anti-replay time window in seconds
# TYPE atlas_anti_replay_time_window_seconds gauge
atlas_anti_replay_time_window_seconds ${this.timeWindow / 1000}
`;
  }
}

// Export singleton instance
export const antiReplayProtection = new AntiReplayProtection();
