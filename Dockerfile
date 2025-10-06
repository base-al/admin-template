# Ultra-fast Dockerfile that skips slow postinstall
# ARM64 platform for server deployment
FROM --platform=linux/arm64 oven/bun:1.2.2-alpine AS build
WORKDIR /app

# Build arguments for API configuration
ARG API_BASE_URL=https://negenet-api.base.al/api
ARG SITE_URL=https://negenet.base.al/
ARG PAY_API_URL=https://pay-api.base.al

# Copy package files
COPY package*.json bun.lock* ./

# Install dependencies WITHOUT running postinstall (saves 1+ minutes)
RUN bun install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Set build environment variables with memory optimization
ENV NODE_ENV=production
ENV NUXT_PUBLIC_API_BASE_URL=${API_BASE_URL}
ENV NUXT_PUBLIC_SITE_URL=${SITE_URL}
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV GENERATE_SOURCEMAP=false

# Build directly - Nuxt build will handle type generation internally
RUN bun run build

# Production runtime stage
FROM --platform=linux/arm64 oven/bun:1.2.2-alpine AS production
WORKDIR /app

# Build arguments for runtime configuration
ARG API_BASE_URL=https://negenet-api.base.al
ARG SITE_URL=https://negenet.base.al/
ARG PAY_API_URL=https://pay-api.base.al

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && adduser -S nuxt -u 1001

# Copy production dependencies (no scripts needed for runtime)
COPY package*.json bun.lock* ./
RUN bun install --frozen-lockfile --production --ignore-scripts

# Copy built application from build stage
COPY --from=build --chown=nuxt:nodejs /app/.output ./.output

# Set runtime environment variables
ENV NODE_ENV=production
ENV PAY_API_URL=${PAY_API_URL}
ENV NUXT_PUBLIC_API_BASE_URL=${API_BASE_URL}
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

# Switch to non-root user
USER nuxt

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["bun", "run", ".output/server/index.mjs"]
