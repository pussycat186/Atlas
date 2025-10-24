# OPA Policy: Build Provenance (SLSA)
# Kiểm tra build provenance phải đạt SLSA Level 3

package atlas.security.provenance

import future.keywords.contains
import future.keywords.if

# Deny nếu thiếu required provenance fields
deny[msg] {
  not input.provenance._type
  msg := "Provenance missing _type field"
}

deny[msg] {
  not input.provenance.subject
  msg := "Provenance missing subject (artifact)"
}

deny[msg] {
  not input.provenance.predicate
  msg := "Provenance missing predicate"
}

# Deny nếu không phải SLSA Provenance v1
deny[msg] {
  input.provenance._type != "https://in-toto.io/Statement/v1"
  input.provenance._type != "https://slsa.dev/provenance/v1"
  msg := sprintf("Provenance must be in-toto Statement v1 or SLSA v1, got %s", [input.provenance._type])
}

# Deny nếu predicateType không phải SLSA
deny[msg] {
  not startswith(input.provenance.predicateType, "https://slsa.dev/provenance/")
  msg := sprintf("predicateType must be SLSA provenance, got %s", [input.provenance.predicateType])
}

# Deny nếu thiếu builder.id (SLSA requirement)
deny[msg] {
  not input.provenance.predicate.builder.id
  msg := "Provenance missing builder.id (required for SLSA)"
}

# Deny nếu builder không phải trusted CI (GitHub Actions)
trusted_builders := [
  "https://github.com/actions/runner",
  "https://github.com/slsa-framework/slsa-github-generator"
]

deny[msg] {
  builder_id := input.provenance.predicate.builder.id
  not any([startswith(builder_id, tb) | tb := trusted_builders[_]])
  msg := sprintf("Builder must be from trusted CI: %s", [builder_id])
}

# Deny nếu thiếu invocation (SLSA L3 requires)
deny[msg] {
  not input.provenance.predicate.invocation
  msg := "Provenance missing invocation (required for SLSA L3)"
}

# Deny nếu thiếu buildConfig
deny[msg] {
  not input.provenance.predicate.buildConfig
  msg := "Provenance missing buildConfig"
}

# Deny nếu thiếu materials (dependencies)
deny[msg] {
  not input.provenance.predicate.materials
  msg := "Provenance missing materials (build inputs)"
}

deny[msg] {
  count(input.provenance.predicate.materials) == 0
  msg := "Provenance materials array is empty"
}

# Deny nếu materials không có digest
deny[msg] {
  some material in input.provenance.predicate.materials
  not material.digest
  msg := sprintf("Material missing digest: %s", [material.uri])
}

# Deny nếu subject không có digest
deny[msg] {
  some subj in input.provenance.subject
  not subj.digest
  msg := sprintf("Subject missing digest: %s", [subj.name])
}

# Deny nếu subject digest không phải SHA-256
deny[msg] {
  some subj in input.provenance.subject
  subj.digest
  not subj.digest.sha256
  msg := sprintf("Subject must have SHA-256 digest: %s", [subj.name])
}

# Warn nếu không có metadata.buildStartedOn
warn[msg] {
  not input.provenance.predicate.metadata.buildStartedOn
  msg := "Provenance missing buildStartedOn timestamp"
}

# Warn nếu không có metadata.buildFinishedOn
warn[msg] {
  not input.provenance.predicate.metadata.buildFinishedOn
  msg := "Provenance missing buildFinishedOn timestamp"
}

# Helper function
startswith(str, prefix) {
  indexof(str, prefix) == 0
}

any(arr) {
  arr[_] == true
}
