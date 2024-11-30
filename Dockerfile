FROM node:18-alpine as builder

WORKDIR /app

# Install build dependencies for WASM
RUN apk add --no-cache python3 make g++ curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy only necessary files
COPY app ./app
COPY public ./public
COPY next.config.js .
COPY tailwind.config.js .
COPY postcss.config.js .

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Install only production dependencies
RUN npm install --only=production --legacy-peer-deps

# Enable WASM features
ENV NODE_OPTIONS=--experimental-wasm-threads
ENV NODE_OPTIONS=--experimental-wasm-bulk-memory

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
