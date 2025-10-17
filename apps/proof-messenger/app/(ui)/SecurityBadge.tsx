// Security Badge Component - Shows E2EE, DPoP Bound, PQC status
import React from 'react';

interface SecurityBadgeProps {
  e2ee?: boolean;
  bound?: boolean;
  pqcPercentage?: number;
  className?: string;
}

export function SecurityBadge({ 
  e2ee = true, 
  bound = true, 
  pqcPercentage = 0,
  className = ''
}: SecurityBadgeProps) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-sm ${className}`}>
      {e2ee && (
        <span className="flex items-center gap-1 text-green-700 dark:text-green-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="font-medium">E2EE</span>
        </span>
      )}
      
      {bound && (
        <span className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-medium">Bound</span>
        </span>
      )}
      
      {pqcPercentage > 0 && (
        <span className="flex items-center gap-1 text-purple-700 dark:text-purple-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-medium">PQC {pqcPercentage}%</span>
        </span>
      )}
    </div>
  );
}
