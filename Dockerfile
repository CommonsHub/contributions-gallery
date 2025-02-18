# Build stage
FROM node:20.11.1-slim as builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM denoland/deno:latest

WORKDIR /app

# Copy the built files and server
COPY --from=builder /app/dist ./dist
COPY deno.json ./
COPY server ./server

# Compile the Deno application
RUN deno cache server/main.ts

EXPOSE 8000

CMD ["deno", "task", "start"] 