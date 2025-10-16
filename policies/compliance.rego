# Compliance Policy  
# OPA Rego policy for validating ATLAS compliance readiness

package atlas.compliance

import rego.v1

# SOC 2 Technical Control Requirements
soc2_technical_controls := {
    "encryption_at_rest": "CC6.1",
    "encryption_in_transit": "CC6.1", 
    "access_controls": "CC6.2",
    "monitoring_logging": "CC7.1",
    "change_management": "CC8.1",
    "logical_access": "A1.2",
    "network_security": "A1.3"
}

# ISO 27001 Technical Control Requirements  
iso27001_technical_controls := {
    "cryptographic_controls": "A.10.1.1",
    "network_security": "A.13.1.1",
    "development_security": "A.14.2.1", 
    "incident_management": "A.16.1.1",
    "privacy_protection": "A.18.1.4"
}

# SLSA Requirements (Can be ACHIEVED through technical implementation)
slsa_requirements := {
    "source_requirements": ["protected_branches", "signed_commits"],
    "build_requirements": ["isolated_builds", "provenance_generation"],
    "provenance_requirements": ["authenticated_provenance", "service_generated"],
    "common_requirements": ["security_policies", "access_controls"]
}

# NIST CSF Requirements (Can be ACHIEVED through technical implementation)
nist_csf_requirements := {
    "identify": ["asset_inventory", "risk_assessment", "governance"],
    "protect": ["access_controls", "encryption", "training"],
    "detect": ["monitoring", "alerting", "anomaly_detection"],
    "respond": ["incident_response", "communications", "analysis"],
    "recover": ["recovery_planning", "improvements", "communications"]
}

# Compliance Status Rules
soc2_technical_ready if {
    validate_encryption_controls
    validate_access_controls  
    validate_monitoring_controls
    validate_change_management
}

iso27001_technical_ready if {
    validate_cryptographic_controls
    validate_network_security_controls
    validate_development_security
    validate_incident_management
    validate_privacy_controls
}

slsa_level3_achieved if {
    validate_source_requirements
    validate_build_requirements
    validate_provenance_requirements  
    validate_common_requirements
}

nist_csf_mature if {
    validate_identify_function
    validate_protect_function
    validate_detect_function
    validate_respond_function
    validate_recover_function
}

# Technical Validation Rules
validate_encryption_controls if {
    input.security.e2ee_messaging == true
    input.security.field_encryption == true
    input.security.key_management == true
}

validate_access_controls if {
    input.security.dpop_binding == true
    input.security.passkey_auth == true
    input.security.mtls_services == true
}

validate_monitoring_controls if {
    input.monitoring.real_time_monitoring == true
    input.monitoring.security_alerts == true
    input.monitoring.performance_tracking == true
}

validate_change_management if {
    input.cicd.automated_deployment == true
    input.cicd.approval_gates == true
    input.cicd.rollback_capability == true
}

validate_cryptographic_controls if {
    input.crypto.pqc_ready == true
    input.crypto.hybrid_encryption == true
    input.crypto.key_rotation == true
}

validate_network_security_controls if {
    input.network.tls13_minimum == true
    input.network.mtls_services == true
    input.network.security_headers == true
}

validate_development_security if {
    input.supply_chain.sbom_generation == true
    input.supply_chain.signed_commits == true
    input.supply_chain.slsa_l3 == true
}

validate_incident_management if {
    input.incident_response.automated_detection == true
    input.incident_response.automated_response == true
    input.incident_response.evidence_collection == true
}

validate_privacy_controls if {
    input.privacy.e2ee_implementation == true
    input.privacy.field_encryption == true
    input.privacy.pii_protection == true
}

validate_source_requirements if {
    input.slsa.protected_branches == true
    input.slsa.signed_commits == true
}

validate_build_requirements if {
    input.slsa.isolated_builds == true
    input.slsa.provenance_generation == true
}

validate_provenance_requirements if {
    input.slsa.authenticated_provenance == true
    input.slsa.service_generated == true
}

validate_common_requirements if {
    input.slsa.security_policies == true
    input.slsa.access_controls == true
}

validate_identify_function if {
    input.nist.asset_inventory == true
    input.nist.risk_assessment == true
    input.nist.governance == true
}

validate_protect_function if {
    input.nist.access_controls == true
    input.nist.encryption == true
    input.nist.training_automation == true
}

validate_detect_function if {
    input.nist.monitoring == true
    input.nist.alerting == true
    input.nist.anomaly_detection == true
}

validate_respond_function if {
    input.nist.incident_response == true
    input.nist.communications == true
    input.nist.analysis == true
}

validate_recover_function if {
    input.nist.recovery_planning == true
    input.nist.improvements == true
    input.nist.recovery_communications == true
}

# Final Compliance Assessment
compliance_status := {
    "soc2_status": soc2_status,
    "iso27001_status": iso27001_status,
    "slsa_level": slsa_level,
    "nist_csf": nist_csf_level
}

soc2_status := "READY" if soc2_technical_ready
soc2_status := "NOT_READY" if not soc2_technical_ready

iso27001_status := "READY" if iso27001_technical_ready  
iso27001_status := "NOT_READY" if not iso27001_technical_ready

slsa_level := "L3_ACHIEVED" if slsa_level3_achieved
slsa_level := "NOT_ACHIEVED" if not slsa_level3_achieved

nist_csf_level := "MATURE" if nist_csf_mature
nist_csf_level := "DEVELOPING" if not nist_csf_mature

# Organizational Requirements (Cannot be achieved through technical implementation alone)
organizational_requirements := {
    "soc2_organizational": [
        "management_assertions",
        "policy_framework", 
        "risk_assessment_business",
        "incident_response_procedures",
        "vendor_management",
        "employee_training_program"
    ],
    "iso27001_organizational": [
        "isms_documentation",
        "management_review_process",
        "internal_audit_program", 
        "risk_treatment_plan",
        "continual_improvement",
        "corrective_actions"
    ]
}

# External Audit Requirements
external_audit_required := true

audit_requirements := {
    "soc2": [
        "minimum_6_month_operation",
        "qualified_cpa_firm",
        "management_description",
        "control_evidence",
        "gap_remediation"
    ],
    "iso27001": [
        "stage1_audit",
        "stage2_audit", 
        "surveillance_audits",
        "management_review_evidence",
        "internal_audit_evidence"
    ]
}