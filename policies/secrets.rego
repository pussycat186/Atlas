# OPA Policy: Secrets Detection
# Kiểm tra không được commit secrets vào source code

package atlas.security.secrets

import future.keywords.contains
import future.keywords.if

# Patterns nguy hiểm
dangerous_patterns := [
  "-----BEGIN PRIVATE KEY-----",
  "-----BEGIN RSA PRIVATE KEY-----",
  "-----BEGIN EC PRIVATE KEY-----",
  "AKIA[0-9A-Z]{16}",  # AWS Access Key
  "AIza[0-9A-Za-z_-]{35}",  # Google API Key
  "sk_live_[0-9a-zA-Z]{24}",  # Stripe Secret Key
  "ghp_[0-9a-zA-Z]{36}",  # GitHub Personal Access Token
  "xoxb-[0-9]{11}-[0-9]{11}-[0-9a-zA-Z]{24}",  # Slack Bot Token
  "postgres://.*:.*@",  # Database connection string
  "mongodb://.*:.*@",
  "redis://.*:.*@",
  "mysql://.*:.*@"
]

# File extensions to check
source_extensions := {".ts", ".js", ".tsx", ".jsx", ".json", ".yaml", ".yml", ".env"}

# Deny nếu tìm thấy secrets trong source files
deny[msg] {
  some file in input.files
  some ext in source_extensions
  endswith(file.path, ext)
  some pattern in dangerous_patterns
  regex.match(pattern, file.content)
  msg := sprintf("Potential secret found in %s: matches pattern %s", [file.path, pattern])
}

# Deny nếu có .env file trong source (không nên commit)
deny[msg] {
  some file in input.files
  endswith(file.path, ".env")
  not endswith(file.path, ".env.example")
  not endswith(file.path, ".env.template")
  msg := sprintf(".env file should not be committed: %s", [file.path])
}

# Warn nếu có TODO/FIXME chứa "secret", "password", "key"
warn[msg] {
  some file in input.files
  contains(lower(file.content), "todo")
  contains(lower(file.content), "secret")
  msg := sprintf("TODO comment mentioning 'secret' in %s", [file.path])
}

warn[msg] {
  some file in input.files
  contains(lower(file.content), "fixme")
  contains(lower(file.content), "password")
  msg := sprintf("FIXME comment mentioning 'password' in %s", [file.path])
}
