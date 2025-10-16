// Test Atlas Security Configuration Loading
const path = require('path');

console.log('🔧 Testing Atlas Security Configuration...');
console.log('Current working directory:', process.cwd());

// Set dev_portal context
process.env.ATLAS_APP_NAME = 'dev_portal';

try {
    // Test security config loading
    const atlasSecurityConfig = require('./libs/atlas-security.js');
    console.log('✅ Atlas security configuration loaded successfully');
    
    // Test feature flag checking
    const cspEnabled = atlasSecurityConfig.isSecurityFeatureEnabled('SECURITY_CSP_STRICT');
    console.log('🛡️  CSP Strict enabled:', cspEnabled);
    
    const trustedTypesEnabled = atlasSecurityConfig.isSecurityFeatureEnabled('SECURITY_TRUSTED_TYPES');
    console.log('🛡️  Trusted Types enabled:', trustedTypesEnabled);
    
    const sriEnabled = atlasSecurityConfig.isSecurityFeatureEnabled('SECURITY_SRI_REQUIRED');
    console.log('🛡️  SRI Required enabled:', sriEnabled);
    
    // Test header generation
    const headers = atlasSecurityConfig.getSecurityHeaders();
    console.log('📋 Generated', headers.length, 'security headers:');
    headers.forEach(header => {
        console.log(`  ${header.key}: ${header.value.substring(0, 80)}...`);
    });
    
    // Test canary targeting
    const isCanaryUser = atlasSecurityConfig.shouldApplySecurityFeature('SECURITY_CSP_STRICT', 'test-user-123');
    console.log('🎯 Canary targeting (test user):', isCanaryUser);
    
} catch (error) {
    console.error('❌ Failed to load Atlas security config:', error.message);
    console.error('Stack:', error.stack);
}