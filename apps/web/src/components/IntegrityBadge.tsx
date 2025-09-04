/**
 * Integrity Badge Component
 * Shows the integrity status of Atlas records
 */

import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { formatQuorumResult } from '@atlas/fabric-client';
import type { QuorumResult } from '@atlas/fabric-protocol';

interface IntegrityBadgeProps {
  status: 'verified' | 'conflict' | 'pending';
  quorumResult?: QuorumResult;
  showDetails?: boolean;
  className?: string;
}

export function IntegrityBadge({ 
  status, 
  quorumResult, 
  showDetails = false, 
  className = '' 
}: IntegrityBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircleIcon,
          text: 'Verified',
          className: 'integrity-verified',
          color: 'text-green-600',
        };
      case 'conflict':
        return {
          icon: ExclamationTriangleIcon,
          text: 'Conflict',
          className: 'integrity-conflict',
          color: 'text-red-600',
        };
      case 'pending':
        return {
          icon: ClockIcon,
          text: 'Pending',
          className: 'integrity-pending',
          color: 'text-yellow-600',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`integrity-badge ${config.className} ${className}`}>
      <Icon className={`w-3 h-3 mr-1 ${config.color}`} />
      <span className="text-xs font-medium">{config.text}</span>
      {showDetails && quorumResult && (
        <span className="ml-1 text-xs opacity-75">
          ({formatQuorumResult(quorumResult)})
        </span>
      )}
    </div>
  );
}

interface IntegrityDetailsProps {
  quorumResult: QuorumResult;
  className?: string;
}

export function IntegrityDetails({ quorumResult, className = '' }: IntegrityDetailsProps) {
  return (
    <div className={`bg-gray-50 rounded-lg p-3 ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-2">Integrity Details</div>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Quorum:</span>
          <span className="font-mono">
            {quorumResult.quorum_count}/{quorumResult.required_quorum}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Timestamp Skew:</span>
          <span className="font-mono">
            {quorumResult.max_skew_ms}ms
            {!quorumResult.skew_ok && <span className="text-red-600 ml-1">⚠</span>}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Witnesses:</span>
          <span className="font-mono">{quorumResult.total_witnesses}</span>
        </div>
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={`font-medium ${quorumResult.ok ? 'text-green-600' : 'text-red-600'}`}>
            {quorumResult.ok ? 'VERIFIED' : 'CONFLICT'}
          </span>
        </div>
      </div>
      
      {quorumResult.conflicting_attestations.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-red-600 font-medium">Conflicting Witnesses:</div>
          <div className="text-xs text-red-600 mt-1">
            {quorumResult.conflicting_attestations.map(a => a.witness_id).join(', ')}
          </div>
        </div>
      )}
    </div>
  );
}
