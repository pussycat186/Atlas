FROM mcr.microsoft.com/devcontainers/typescript-node:20-bullseye

# Install additional tools for Atlas development
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
        curl \
        wget \
        gpg \
        ca-certificates \
        python3-pip \
        python3-yaml \
    && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Install k6 for performance testing
RUN gpg -k && gpg --no-default-keyring \
    --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
    --keyserver hkp://keyserver.ubuntu.com:80 \
    --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69 \
    && echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
    | tee /etc/apt/sources.list.d/k6.list \
    && apt-get update && apt-get install -y k6

# Install Conftest for policy checking
RUN wget -q https://github.com/open-policy-agent/conftest/releases/download/v0.46.0/conftest_0.46.0_Linux_x86_64.tar.gz \
    && tar xzf conftest_0.46.0_Linux_x86_64.tar.gz \
    && mv conftest /usr/local/bin/ \
    && rm conftest_0.46.0_Linux_x86_64.tar.gz

# Set up pnpm and Node environment
RUN npm install -g pnpm@9 vercel@latest

# Create workspace directories
RUN mkdir -p /workspace/docs/evidence \
    && mkdir -p /workspace/tools/net-diagnose \
    && chown -R node:node /workspace

USER node