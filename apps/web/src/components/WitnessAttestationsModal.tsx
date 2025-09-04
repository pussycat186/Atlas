/**
 * Witness Attestations Modal Component
 * Displays detailed witness attestation information for a record
 */

import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import type { WitnessAttestation, QuorumResult } from '@atlas/fabric-protocol';

interface WitnessAttestationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string;
  attestations: WitnessAttestation[];
  quorumResult: QuorumResult;
}

export function WitnessAttestationsModal({
  isOpen,
  onClose,
  recordId,
  attestations,
  quorumResult
}: WitnessAttestationsModalProps) {
  const formatTimestamp = (timestamp: string) => {
    return format(new Date(timestamp), 'HH:mm:ss.SSS');
  };

  const getWitnessStatusIcon = (attestation: WitnessAttestation) => {
    if (attestation.accept) {
      return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    } else {
      return <XCircleIcon className="w-5 h-5 text-red-500" />;
    }
  };

  const getWitnessStatusText = (attestation: WitnessAttestation) => {
    if (attestation.accept) {
      return 'Accepted';
    } else {
      return 'Rejected';
    }
  };

  const getWitnessStatusColor = (attestation: WitnessAttestation) => {
    if (attestation.accept) {
      return 'text-green-700 bg-green-100';
    } else {
      return 'text-red-700 bg-red-100';
    }
  };

  const isConsistentAttestation = (attestation: WitnessAttestation) => {
    return quorumResult.consistent_attestations.some(
      ca => ca.witness_id === attestation.witness_id
    );
  };

  const getRegionColor = (witnessId: string) => {
    const regionColors: Record<string, string> = {
      'w1': 'bg-blue-100 text-blue-800',
      'w2': 'bg-purple-100 text-purple-800',
      'w3': 'bg-green-100 text-green-800',
      'w4': 'bg-yellow-100 text-yellow-800',
      'w5': 'bg-pink-100 text-pink-800',
    };
    return regionColors[witnessId] || 'bg-gray-100 text-gray-800';
  };

  const getRegionName = (witnessId: string) => {
    const regionNames: Record<string, string> = {
      'w1': 'US East',
      'w2': 'US West',
      'w3': 'EU West',
      'w4': 'AP Southeast',
      'w5': 'AP Northeast',
    };
    return regionNames[witnessId] || 'Unknown';
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Witness Attestations
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-md p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-atlas-500"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Record Information */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Record ID</h4>
                      <p className="text-sm text-gray-600 font-mono">{recordId}</p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-medium text-gray-900">Quorum Status</h4>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        quorumResult.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {quorumResult.ok ? 'VERIFIED' : 'CONFLICT'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quorum Summary */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-blue-900">Quorum Count</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {quorumResult.quorum_count}/{quorumResult.required_quorum}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-yellow-900">Timestamp Skew</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {quorumResult.max_skew_ms}ms
                    </div>
                    {!quorumResult.skew_ok && (
                      <div className="text-xs text-red-600 mt-1">⚠ Exceeded limit</div>
                    )}
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-purple-900">Total Witnesses</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {quorumResult.total_witnesses}
                    </div>
                  </div>
                </div>

                {/* Witness Attestations */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Witness Attestations</h4>
                  
                  {attestations.map((attestation, index) => (
                    <div
                      key={attestation.witness_id}
                      className={`border rounded-lg p-4 ${
                        isConsistentAttestation(attestation)
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getWitnessStatusIcon(attestation)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">
                                {attestation.witness_id}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getRegionColor(attestation.witness_id)}`}>
                                {getRegionName(attestation.witness_id)}
                              </span>
                            </div>
                            <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getWitnessStatusColor(attestation)}`}>
                              {getWitnessStatusText(attestation)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div className="flex items-center">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {formatTimestamp(attestation.ts)}
                          </div>
                        </div>
                      </div>

                      {/* State View Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-gray-700 mb-1">State View</div>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Order:</span>
                              <span className="font-mono">{attestation.state_view.order}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Size:</span>
                              <span className="font-mono">{attestation.state_view.size} bytes</span>
                            </div>
                            {attestation.state_view.state_hash && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Hash:</span>
                                <span className="font-mono text-xs">{attestation.state_view.state_hash}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <div className="font-medium text-gray-700 mb-1">Additional Info</div>
                          <div className="space-y-1">
                            {attestation.conflict_ref && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Conflict Ref:</span>
                                <span className="font-mono text-xs text-red-600">{attestation.conflict_ref}</span>
                              </div>
                            )}
                            {attestation.signature && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Signature:</span>
                                <span className="font-mono text-xs">{attestation.signature}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Conflict Information */}
                {quorumResult.conflicting_attestations.length > 0 && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="text-sm font-medium text-red-900 mb-2">Conflicting Attestations</h4>
                    <div className="text-sm text-red-700">
                      <p>
                        {quorumResult.conflicting_attestations.length} witness(es) provided conflicting or rejected attestations:
                      </p>
                      <ul className="mt-2 list-disc list-inside">
                        {quorumResult.conflicting_attestations.map(attestation => (
                          <li key={attestation.witness_id}>
                            {attestation.witness_id} - {attestation.accept ? 'Conflicting state view' : 'Rejected'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      // Could add refresh functionality here
                      window.location.reload();
                    }}
                    className="btn-primary"
                  >
                    Refresh
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
