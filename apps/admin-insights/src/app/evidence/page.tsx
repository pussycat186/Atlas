'use client';

import { useState } from 'react';
import { Download, Package, Shield, Zap, FileText, CheckCircle, Clock } from 'lucide-react';

interface EvidencePackage {
  id: string;
  name: string;
  type: 'compliance' | 'security' | 'performance' | 'complete';
  size: string;
  items: string[];
  generatedAt: string;
  status: 'ready' | 'generating' | 'error';
}

export default function EvidenceExporter() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('complete');
  const [availablePackages, setAvailablePackages] = useState<EvidencePackage[]>([
    {
      id: 'complete',
      name: 'Complete Evidence Pack',
      type: 'complete',
      size: '~25MB',
      items: [
        'SBOM (CycloneDX format)',
        'SLSA Provenance',
        'Cosign verification logs',
        'Security headers report',
        'Lighthouse CI results',
        'k6 performance data',
        'Playwright test results',
        'RFC 9421 receipt samples',
        'Security flags configuration',
        'OPA policy validation'
      ],
      generatedAt: '2024-10-16T10:30:00Z',
      status: 'ready'
    },
    {
      id: 'compliance',
      name: 'Compliance Package',
      type: 'compliance',
      size: '~8MB',
      items: [
        'SOC 2 controls evidence',
        'ISO 27001 compliance matrix',
        'GDPR data protection audit',
        'Security policy documentation',
        'Audit logs and trails'
      ],
      generatedAt: '2024-10-16T09:15:00Z',
      status: 'ready'
    },
    {
      id: 'security',
      name: 'Security Assessment',
      type: 'security',
      size: '~12MB',
      items: [
        'Vulnerability scan reports',
        'Penetration test results',
        'Security headers validation',
        'Cryptographic implementation audit',
        'Access control verification'
      ],
      generatedAt: '2024-10-16T08:45:00Z',
      status: 'ready'
    },
    {
      id: 'performance',
      name: 'Performance Metrics',
      type: 'performance',
      size: '~6MB',
      items: [
        'Core Web Vitals data',
        'Load testing results (k6)',
        'Lighthouse performance scores',
        'Real User Monitoring data',
        'CDN performance analytics'
      ],
      generatedAt: '2024-10-16T07:20:00Z',
      status: 'ready'
    }
  ]);

  const generateEvidencePack = async (packageId: string) => {
    setIsGenerating(true);
    
    try {
      // Update status to generating
      setAvailablePackages(prev => 
        prev.map(pkg => 
          pkg.id === packageId 
            ? { ...pkg, status: 'generating' as const }
            : pkg
        )
      );

      // Simulate evidence collection process
      const response = await fetch('/api/admin/evidence/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: packageId,
          includeTimestamp: true,
          format: 'zip'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate evidence pack');
      }

      const result = await response.json();
      
      // Update status to ready and trigger download
      setAvailablePackages(prev => 
        prev.map(pkg => 
          pkg.id === packageId 
            ? { 
                ...pkg, 
                status: 'ready' as const,
                generatedAt: new Date().toISOString()
              }
            : pkg
        )
      );

      // Trigger download
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error('Evidence generation failed:', error);
      
      // Update status to error
      setAvailablePackages(prev => 
        prev.map(pkg => 
          pkg.id === packageId 
            ? { ...pkg, status: 'error' as const }
            : pkg
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const getPackageIcon = (type: EvidencePackage['type']) => {
    switch (type) {
      case 'compliance':
        return <Shield className="h-6 w-6 text-green-500" />;
      case 'security':
        return <Shield className="h-6 w-6 text-red-500" />;
      case 'performance':
        return <Zap className="h-6 w-6 text-yellow-500" />;
      default:
        return <Package className="h-6 w-6 text-blue-500" />;
    }
  };

  const getStatusIcon = (status: EvidencePackage['status']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'generating':
        return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'error':
        return <FileText className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Evidence Export Center</h1>
        <p className="text-gray-600">
          Generate and download comprehensive evidence packages for compliance, security, and performance audits.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {availablePackages.map((pkg) => (
          <div
            key={pkg.id}
            className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 ${
              selectedPackage === pkg.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setSelectedPackage(pkg.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getPackageIcon(pkg.type)}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                  <p className="text-sm text-gray-500">{pkg.size}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                {getStatusIcon(pkg.status)}
                <span className="text-sm text-gray-500 capitalize">{pkg.status}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm font-medium text-gray-700">Included items:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {pkg.items.slice(0, 4).map((item, index) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    {item}
                  </li>
                ))}
                {pkg.items.length > 4 && (
                  <li className="text-gray-500 text-xs">
                    +{pkg.items.length - 4} more items...
                  </li>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Generated: {new Date(pkg.generatedAt).toLocaleDateString()}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  generateEvidencePack(pkg.id);
                }}
                disabled={isGenerating || pkg.status === 'generating'}
                className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="h-3 w-3" />
                <span>Download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Generate New Package Section */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Generate Fresh Evidence</h2>
        <p className="text-gray-600 mb-4">
          Create a new evidence package with the latest security scans, compliance checks, and performance metrics.
        </p>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedPackage}
            onChange={(e) => setSelectedPackage(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availablePackages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => generateEvidencePack(selectedPackage)}
            disabled={isGenerating}
            className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Package className="h-4 w-4" />
                <span>Generate New</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Evidence Package Contents Preview */}
      {selectedPackage && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Package Contents Preview</h2>
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">
                {availablePackages.find(pkg => pkg.id === selectedPackage)?.name}
              </h3>
            </div>
            <div className="p-4">
              <ul className="space-y-2">
                {availablePackages.find(pkg => pkg.id === selectedPackage)?.items.map((item, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}