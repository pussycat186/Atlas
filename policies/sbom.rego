# OPA Policy: SBOM Validation
# Kiểm tra SBOM phải có đầy đủ metadata và không có vulnerabilities

package atlas.security.sbom

import future.keywords.contains
import future.keywords.if

# Deny nếu thiếu required SBOM fields
deny[msg] {
  not input.sbom.bomFormat
  msg := "SBOM missing bomFormat field"
}

deny[msg] {
  not input.sbom.specVersion
  msg := "SBOM missing specVersion field"
}

deny[msg] {
  not input.sbom.metadata
  msg := "SBOM missing metadata section"
}

deny[msg] {
  not input.sbom.components
  msg := "SBOM missing components array"
}

# Deny nếu SBOM format không phải CycloneDX 1.4+
deny[msg] {
  input.sbom.bomFormat != "CycloneDX"
  msg := "SBOM must use CycloneDX format"
}

deny[msg] {
  input.sbom.bomFormat == "CycloneDX"
  not startswith(input.sbom.specVersion, "1.4")
  not startswith(input.sbom.specVersion, "1.5")
  not startswith(input.sbom.specVersion, "1.6")
  msg := sprintf("SBOM specVersion must be 1.4 or higher, got %s", [input.sbom.specVersion])
}

# Deny nếu có components không có name hoặc version
deny[msg] {
  some comp in input.sbom.components
  not comp.name
  msg := "Component missing name field"
}

deny[msg] {
  some comp in input.sbom.components
  not comp.version
  msg := sprintf("Component '%s' missing version field", [comp.name])
}

# Deny nếu có vulnerabilities với severity CRITICAL
deny[msg] {
  some vuln in input.vulnerabilities
  vuln.severity == "CRITICAL"
  msg := sprintf("CRITICAL vulnerability found: %s in %s@%s", [vuln.id, vuln.package, vuln.version])
}

# Deny nếu có vulnerabilities với severity HIGH và có exploit available
deny[msg] {
  some vuln in input.vulnerabilities
  vuln.severity == "HIGH"
  vuln.exploitAvailable == true
  msg := sprintf("HIGH severity vulnerability with exploit available: %s in %s@%s", [vuln.id, vuln.package, vuln.version])
}

# Warn nếu có HIGH vulnerabilities (nhưng không có exploit)
warn[msg] {
  some vuln in input.vulnerabilities
  vuln.severity == "HIGH"
  not vuln.exploitAvailable
  msg := sprintf("HIGH severity vulnerability: %s in %s@%s (no exploit available yet)", [vuln.id, vuln.package, vuln.version])
}

# Warn nếu có MEDIUM vulnerabilities
warn[msg] {
  some vuln in input.vulnerabilities
  vuln.severity == "MEDIUM"
  msg := sprintf("MEDIUM severity vulnerability: %s in %s@%s", [vuln.id, vuln.package, vuln.version])
}

# Deny nếu có dependency với license không cho phép
forbidden_licenses := ["AGPL-3.0", "GPL-2.0", "GPL-3.0", "SSPL-1.0"]

deny[msg] {
  some comp in input.sbom.components
  some license in comp.licenses
  license.license.id in forbidden_licenses
  msg := sprintf("Forbidden license %s found in %s@%s", [license.license.id, comp.name, comp.version])
}

# Warn nếu có dependencies không có license
warn[msg] {
  some comp in input.sbom.components
  not comp.licenses
  msg := sprintf("Component %s@%s has no license information", [comp.name, comp.version])
}

# Helper function
startswith(str, prefix) {
  indexof(str, prefix) == 0
}
