package atlas.quality.gates

import future.keywords.if

# Quality gate enforcement based on flags
violation[msg] {
    input.flags.SECURITY_CSP_STRICT == true
    lighthouse := input.quality.lighthouse
    lighthouse.best_practices < 95
    msg := sprintf("Lighthouse Best Practices score %d below required 95", [lighthouse.best_practices])
}

violation[msg] {
    input.flags.SECURITY_CONTAINER_SCANNING == true
    scan_results := input.quality.container_scan
    scan_results.high_vulns > 0
    msg := sprintf("Container scan found %d high severity vulnerabilities", [scan_results.high_vulns])
}

violation[msg] {
    input.flags.SUPPLY_CHAIN_SBOM_SLSA == true
    not input.quality.sbom_generated
    msg := "SBOM generation required for release"
}

violation[msg] {
    input.flags.SECURITY_SLSA_L3 == true
    not input.quality.slsa_l3_provenance
    msg := "SLSA Level 3 provenance required for release"
}

# Performance requirements
violation[msg] {
    input.quality.k6.p95_response_time > 200
    msg := sprintf("k6 p95 response time %dms exceeds 200ms threshold", [input.quality.k6.p95_response_time])
}

violation[msg] {
    input.quality.k6.error_rate > 0.01
    msg := sprintf("k6 error rate %.2f%% exceeds 1%% threshold", [input.quality.k6.error_rate * 100])
}

# Security test requirements
violation[msg] {
    input.flags.SECURITY_DPOP_ENFORCE == true
    not input.quality.playwright.auth_tests_pass
    msg := "Playwright authentication tests must pass when DPoP enforced"
}