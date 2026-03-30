## Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app

# Install deps first (cacheable layer)
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy source and build
COPY . .
RUN npm run build

## Stage 2: Production server
FROM nginx:1.27-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 -S ennie && adduser -u 1001 -S ennie -G ennie

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config with compression, caching, security headers
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:${PORT:-3000}/favicon.svg || exit 1

EXPOSE 3000

# Use envsubst to inject PORT at runtime
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/default.conf.tmp && mv /etc/nginx/conf.d/default.conf.tmp /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"
