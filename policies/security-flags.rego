# Security Flags Policy
# OPA Rego policy for validating ATLAS security implementation

package atlas.security.flags

import rego.v1

# S0: Remote-only Infrastructure
remote_only_required := {
    "github_codespaces": true,
    "github_actions": true,
    "vercel_deployment": true,
    "no_localhost": true
}

# S1: Security Flags
security_flags_required := {
    "strict_csp": true,
    "trusted_types": true,
    "coop_coep": true,
    "hsts_preload": true,
    "dpop_binding": true,
    "mtls_services": true
}

# S2: Chat Core
chat_core_required := {
    "mls_protocol": true,
    "e2ee_messaging": true,
    "key_transparency": true,
    "perfect_forward_secrecy": true
}

# S3: Receipts
receipts_required := {
    "rfc9421_implementation": true,
    "non_repudiation": true,
    "transparency_logs": true,
    "signature_verification": true
}

# S4: Transport Security
transport_security_required := {
    "tls13_minimum": true,
    "cert_pinning": true,
    "http3_websocket": true,
    "security_headers": true
}

# S5: Supply Chain
supply_chain_required := {
    "sbom_generation": true,
    "signed_commits": true,
    "slsa_l3": true,
    "cosign_signing": true
}

# S6: Dev/Admin Experience
dev_admin_required := {
    "admin_dashboard": true,
    "dev_portal": true,
    "monitoring_integration": true,
    "automated_deployment": true
}

# S7: Canary Deployment
canary_required := {
    "gradual_rollout": true,
    "automated_rollback": true,
    "health_monitoring": true,
    "traffic_splitting": true
}

# Policy Rules
allow_deployment if {
    validate_remote_only
    validate_security_flags
    validate_chat_core
    validate_receipts
    validate_transport_security
    validate_supply_chain
    validate_dev_admin
    validate_canary
}

validate_remote_only if {
    every flag, required in remote_only_required {
        input.implementation[flag] == required
    }
}

validate_security_flags if {
    every flag, required in security_flags_required {
        input.implementation[flag] == required
    }
}

validate_chat_core if {
    every flag, required in chat_core_required {
        input.implementation[flag] == required
    }
}

validate_receipts if {
    every flag, required in receipts_required {
        input.implementation[flag] == required
    }
}

validate_transport_security if {
    every flag, required in transport_security_required {
        input.implementation[flag] == required
    }
}

validate_supply_chain if {
    every flag, required in supply_chain_required {
        input.implementation[flag] == required
    }
}

validate_dev_admin if {
    every flag, required in dev_admin_required {
        input.implementation[flag] == required
    }
}

validate_canary if {
    every flag, required in canary_required {
        input.implementation[flag] == required
    }
}

# Compliance validation
compliance_ready if {
    allow_deployment
    validate_evidence_collection
    validate_organizational_readiness
}

validate_evidence_collection if {
    input.evidence.sbom_present == true
    input.evidence.provenance_present == true
    input.evidence.cosign_verified == true
    input.evidence.security_scans_passed == true
}

validate_organizational_readiness if {
    # Technical readiness only - organizational audit required
    input.compliance.soc2_status == "READY"
    input.compliance.iso27001_status == "READY"
    input.compliance.external_audit_required == true
}