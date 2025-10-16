'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CheckCircle, XCircle, Upload, FileText, Clock, User, Hash } from 'lucide-react';
import type { Receipt } from '@atlas/receipt';

interface VerificationResult {
  isValid: boolean;
  receipt: Receipt;
  timestamp: number;
  keyId: string;
  error?: string;
}

export default function VerifyPage() {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [receiptText, setReceiptText] = useState('');

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setReceiptText(text);
        verifyReceipt(text);
      };
      reader.readAsText(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/json': ['.json'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

  const verifyReceipt = async (receiptData: string) => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const receipt: Receipt = JSON.parse(receiptData);
      
      // Call verification API
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receipt }),
      });

      const result = await response.json();
      
      setVerificationResult({
        isValid: result.valid,
        receipt,
        timestamp: Date.now(),
        keyId: receipt.kid,
        error: result.error
      });

    } catch (error) {
      setVerificationResult({
        isValid: false,
        receipt: {} as Receipt,
        timestamp: Date.now(),
        keyId: 'unknown',
        error: 'Invalid receipt format'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (receiptText.trim()) {
      verifyReceipt(receiptText);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Atlas Receipt Verification
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verify the authenticity of Atlas receipts using RFC 9421 HTTP Message Signatures.
            Upload a receipt file or paste the JSON content to validate its cryptographic signature.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Submit Receipt for Verification
          </h2>

          {/* File Drop Zone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the receipt file here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag and drop a receipt file here, or click to select
                </p>
                <p className="text-sm text-gray-500">
                  Supports .json and .txt files
                </p>
              </div>
            )}
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or paste receipt JSON</span>
            </div>
          </div>

          {/* Text Input */}
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <textarea
              value={receiptText}
              onChange={(e) => setReceiptText(e.target.value)}
              placeholder="Paste your Atlas receipt JSON here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            />
            <button
              type="submit"
              disabled={!receiptText.trim() || isVerifying}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isVerifying ? 'Verifying...' : 'Verify Receipt'}
            </button>
          </form>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center mb-6">
              {verificationResult.isValid ? (
                <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500 mr-3" />
              )}
              <div>
                <h2 className="text-xl font-semibold">
                  {verificationResult.isValid ? 'Receipt Valid' : 'Receipt Invalid'}
                </h2>
                <p className="text-gray-600">
                  Verified at {formatTimestamp(verificationResult.timestamp)}
                </p>
              </div>
            </div>

            {verificationResult.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-800">{verificationResult.error}</p>
              </div>
            )}

            {verificationResult.isValid && verificationResult.receipt.id && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Receipt Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Receipt Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Receipt ID</p>
                        <p className="text-sm text-gray-600 font-mono">
                          {verificationResult.receipt.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <User className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Actor</p>
                        <p className="text-sm text-gray-600">
                          {verificationResult.receipt.actor}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Action</p>
                        <p className="text-sm text-gray-600">
                          {verificationResult.receipt.action}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Clock className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Timestamp</p>
                        <p className="text-sm text-gray-600">
                          {formatTimestamp(verificationResult.receipt.at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Cryptographic Details</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <Hash className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Algorithm</p>
                        <p className="text-sm text-gray-600">
                          {verificationResult.receipt.alg}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Hash className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Key ID</p>
                        <p className="text-sm text-gray-600 font-mono">
                          {verificationResult.receipt.kid}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Hash className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Content Digest</p>
                        <p className="text-sm text-gray-600 font-mono break-all">
                          {verificationResult.receipt.digest}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <Hash className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Subject</p>
                        <p className="text-sm text-gray-600">
                          {verificationResult.receipt.subject}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Context */}
            {verificationResult.receipt.ctx && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Context</h4>
                <pre className="text-xs text-gray-600 overflow-x-auto">
                  {JSON.stringify(verificationResult.receipt.ctx, null, 2)}
                </pre>
              </div>
            )}

            {/* Verification Status */}
            <div className="mt-6 p-4 border rounded-lg">
              {verificationResult.isValid ? (
                <div className="text-green-800 bg-green-50 border-green-200">
                  <p className="font-medium">✅ Signature Verification Passed</p>
                  <p className="text-sm mt-1">
                    This receipt has a valid cryptographic signature and can be trusted as authentic.
                    The signature was verified using key {verificationResult.keyId}.
                  </p>
                </div>
              ) : (
                <div className="text-red-800 bg-red-50 border-red-200">
                  <p className="font-medium">❌ Signature Verification Failed</p>
                  <p className="text-sm mt-1">
                    This receipt has an invalid or tampered signature and should not be trusted.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p className="text-sm">
            Atlas Receipt Verification uses RFC 9421 HTTP Message Signatures for cryptographic verification.
          </p>
          <p className="text-xs mt-1">
            For technical details, see the{' '}
            <a href="/docs/receipts" className="text-blue-600 hover:underline">
              Atlas Receipts Documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}