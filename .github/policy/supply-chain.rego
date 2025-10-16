package atlas.supply.chain

import future.keywords.if

# SBOM must be present when supply chain flags enabled
violation[msg] {
    input.flags.SUPPLY_CHAIN_SBOM_SLSA == true
    not input.artifacts.sbom
    msg := "SBOM artifact required when SUPPLY_CHAIN_SBOM_SLSA enabled"
}

violation[msg] {
    input.flags.SECURITY_SLSA_L3 == true
    not input.artifacts.slsa_provenance
    msg := "SLSA provenance required when SECURITY_SLSA_L3 enabled"
}

violation[msg] {
    input.flags.SECURITY_COSIGN_REQUIRED == true
    not input.artifacts.cosign_signature
    msg := "Cosign signature required when SECURITY_COSIGN_REQUIRED enabled"
}

# SLSA Level 3 requirements
violation[msg] {
    input.flags.SECURITY_SLSA_L3 == true
    input.build.builder != "github-actions"
    msg := "SLSA L3 requires GitHub Actions builder"
}

violation[msg] {
    input.flags.SECURITY_SLSA_L3 == true
    not input.build.hermetic
    msg := "SLSA L3 requires hermetic builds"
}

# Container security requirements
violation[msg] {
    input.flags.SECURITY_CONTAINER_SCANNING == true
    not input.artifacts.container_scan
    msg := "Container scan results required when flag enabled"
}

violation[msg] {
    input.flags.SECURITY_CONTAINER_SCANNING == true
    input.artifacts.container_scan.critical_vulns > 0
    msg := sprintf("Container has %d critical vulnerabilities", [input.artifacts.container_scan.critical_vulns])
}