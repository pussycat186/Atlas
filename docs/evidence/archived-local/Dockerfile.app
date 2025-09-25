# ATLAS v14 App Dockerfile
# Exposes port 3000 for Cloud Run

FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY apps/web/package.json package.json
COPY apps/web/next.config.js next.config.js

# Copy built application
COPY apps/web/.next .next
COPY apps/web/public public

# Install production dependencies
RUN npm install --production

# Expose port 3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["npm", "start"]
