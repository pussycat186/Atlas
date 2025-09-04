/**
 * Atlas Admin Conflicts Page
 * Conflict detection and resolution dashboard
 */

'use client';

import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  ClockIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { adminService, type ConflictTicket } from '@/lib/admin-client';
import { format } from 'date-fns';

export default function ConflictsPage() {
  const [conflicts, setConflicts] = useState<ConflictTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConflict, setSelectedConflict] = useState<ConflictTicket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const fetchConflicts = async () => {
      try {
        const conflictsData = await adminService.getConflicts({
          status: 'open',
          limit: 50,
        });
        setConflicts(conflictsData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch conflicts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConflicts();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchConflicts, 30000);
    return () => clearInterval(interval);
  }, []);

  const getConflictStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'resolved':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'escalated':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getConflictStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'escalated':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewConflict = (conflict: ConflictTicket) => {
    setSelectedConflict(conflict);
    setIsModalOpen(true);
  };

  const handleResolveConflict = async (conflictId: string, method: 'quorum_override' | 'manual', chosenAttestationId: string, reason: string) => {
    try {
      const success = await adminService.resolveConflict(conflictId, method, chosenAttestationId, reason);
      if (success) {
        // Refresh conflicts list
        const updatedConflicts = await adminService.getConflicts({ status: 'open', limit: 50 });
        setConflicts(updatedConflicts);
        setIsModalOpen(false);
        setSelectedConflict(null);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const openConflicts = conflicts.filter(c => c.status === 'open');
  const resolvedConflicts = conflicts.filter(c => c.status === 'resolved');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Conflict Management</h1>
          <p className="text-gray-600 mt-1">
            Monitor and resolve witness conflicts in real-time
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {format(lastUpdated, 'HH:mm:ss')}
        </div>
      </div>

      {/* Conflict Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Open Conflicts</p>
              <p className="text-2xl font-semibold text-gray-900">{openConflicts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolved Today</p>
              <p className="text-2xl font-semibold text-gray-900">{resolvedConflicts.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Resolution Time</p>
              <p className="text-2xl font-semibold text-gray-900">2.3m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conflicts List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Active Conflicts</h3>
        </div>
        
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-atlas-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading conflicts...</p>
          </div>
        ) : conflicts.length === 0 ? (
          <div className="p-6 text-center">
            <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-500">No conflicts detected. System is healthy!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conflict ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Record ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disagreeing Witnesses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Detected At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conflicts.map((conflict) => (
                  <tr key={conflict.conflict_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {conflict.conflict_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">
                        {conflict.record_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConflictStatusColor(conflict.status)}`}>
                        {getConflictStatusIcon(conflict.status)}
                        <span className="ml-1">{conflict.status.toUpperCase()}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {conflict.disagreeing_witnesses.join(', ')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(conflict.detected_at), 'MMM dd, HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleViewConflict(conflict)}
                        className="text-atlas-600 hover:text-atlas-900 inline-flex items-center"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Conflict Details Modal */}
      {selectedConflict && (
        <ConflictDetailsModal
          conflict={selectedConflict}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedConflict(null);
          }}
          onResolve={handleResolveConflict}
        />
      )}
    </div>
  );
}

interface ConflictDetailsModalProps {
  conflict: ConflictTicket;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (conflictId: string, method: 'quorum_override' | 'manual', chosenAttestationId: string, reason: string) => void;
}

function ConflictDetailsModal({ conflict, isOpen, onClose, onResolve }: ConflictDetailsModalProps) {
  const [resolutionMethod, setResolutionMethod] = useState<'quorum_override' | 'manual'>('manual');
  const [chosenAttestationId, setChosenAttestationId] = useState('');
  const [reason, setReason] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  const handleSubmitResolution = async () => {
    if (!chosenAttestationId || !reason.trim()) {
      return;
    }

    setIsResolving(true);
    try {
      await onResolve(conflict.conflict_id, resolutionMethod, chosenAttestationId, reason);
    } finally {
      setIsResolving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Conflict Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Conflict Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Conflict ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{conflict.conflict_id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Record ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{conflict.record_id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <p className="mt-1 text-sm text-gray-900">{conflict.status}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Detected At</label>
              <p className="mt-1 text-sm text-gray-900">{format(new Date(conflict.detected_at), 'PPpp')}</p>
            </div>
          </div>

          {/* Disagreeing Witnesses */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Disagreeing Witnesses</label>
            <div className="flex flex-wrap gap-2">
              {conflict.disagreeing_witnesses.map((witnessId) => (
                <span
                  key={witnessId}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                >
                  {witnessId}
                </span>
              ))}
            </div>
          </div>

          {/* Attestations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attestations</label>
            <div className="space-y-2">
              {conflict.attestations.map((attestation, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    attestation.accept ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{attestation.witness_id}</span>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        attestation.accept ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {attestation.accept ? 'Accepted' : 'Rejected'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(attestation.ts), 'HH:mm:ss.SSS')}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Order: {attestation.state_view.order}, Size: {attestation.state_view.size} bytes
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Form */}
          {conflict.status === 'open' && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Resolve Conflict</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resolution Method</label>
                  <select
                    value={resolutionMethod}
                    onChange={(e) => setResolutionMethod(e.target.value as 'quorum_override' | 'manual')}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-atlas-500 focus:border-atlas-500"
                  >
                    <option value="manual">Manual Resolution</option>
                    <option value="quorum_override">Quorum Override</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Choose Correct Attestation</label>
                  <select
                    value={chosenAttestationId}
                    onChange={(e) => setChosenAttestationId(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-atlas-500 focus:border-atlas-500"
                  >
                    <option value="">Select witness...</option>
                    {conflict.attestations
                      .filter(a => a.accept)
                      .map((attestation) => (
                        <option key={attestation.witness_id} value={attestation.witness_id}>
                          {attestation.witness_id} - {format(new Date(attestation.ts), 'HH:mm:ss.SSS')}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Resolution Reason</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-atlas-500 focus:border-atlas-500"
                    placeholder="Explain why this attestation is correct..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Close
            </button>
            {conflict.status === 'open' && (
              <button
                onClick={handleSubmitResolution}
                disabled={!chosenAttestationId || !reason.trim() || isResolving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResolving ? 'Resolving...' : 'Resolve Conflict'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
