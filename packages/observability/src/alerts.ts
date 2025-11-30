/**
 * Alert Rules for Atlas
 * Prometheus alerting rules for crypto failures, auth anomalies
 */

export interface AlertRule {
  name: string;
  expr: string;
  for: string;
  severity: 'critical' | 'warning' | 'info';
  annotations: {
    summary: string;
    description: string;
  };
}

export const alertRules: AlertRule[] = [
  {
    name: 'HighCryptoFailureRate',
    expr: 'rate(atlas_crypto_operations_total{status="failure"}[5m]) > 0.1',
    for: '5m',
    severity: 'critical',
    annotations: {
      summary: 'High crypto operation failure rate',
      description: 'More than 10% of crypto operations are failing in the last 5 minutes',
    },
  },
  {
    name: 'AuthFailureSpike',
    expr: 'rate(atlas_auth_events_total{result="failure"}[5m]) > 5',
    for: '2m',
    severity: 'warning',
    annotations: {
      summary: 'Authentication failure spike detected',
      description: 'More than 5 auth failures per second in the last 2 minutes',
    },
  },
  {
    name: 'HighMessageLatency',
    expr: 'histogram_quantile(0.95, atlas_message_latency_ms) > 1000',
    for: '10m',
    severity: 'warning',
    annotations: {
      summary: 'High message processing latency',
      description: '95th percentile message latency is above 1 second',
    },
  },
  {
    name: 'NoKeyRotation',
    expr: 'increase(atlas_key_rotations_total[7d]) == 0',
    for: '1h',
    severity: 'warning',
    annotations: {
      summary: 'No key rotations in 7 days',
      description: 'Key rotation policy requires rotation every 7 days',
    },
  },
  {
    name: 'CryptoOperationsDown',
    expr: 'rate(atlas_crypto_operations_total[5m]) == 0',
    for: '5m',
    severity: 'critical',
    annotations: {
      summary: 'No crypto operations detected',
      description: 'Crypto operations have stopped, possible service outage',
    },
  },
];

/**
 * Generate Prometheus alert rules YAML
 */
export function generateAlertRulesYAML(): string {
  const yaml = `groups:
  - name: atlas_alerts
    interval: 30s
    rules:
${alertRules
  .map(
    (rule) => `      - alert: ${rule.name}
        expr: ${rule.expr}
        for: ${rule.for}
        labels:
          severity: ${rule.severity}
        annotations:
          summary: "${rule.annotations.summary}"
          description: "${rule.annotations.description}"`
  )
  .join('\n\n')}
`;
  return yaml;
}
