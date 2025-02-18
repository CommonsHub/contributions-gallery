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
ARG VITE_PRIMARY_COLOR
ARG VITE_DISCORD_CHANNEL_ID
ARG VITE_REFETCH_INTERVAL

# Build with environment variables passed directly to the build command
RUN VITE_PRIMARY_COLOR=${VITE_PRIMARY_COLOR} \
  VITE_DISCORD_CHANNEL_ID=${VITE_DISCORD_CHANNEL_ID} \
  VITE_REFETCH_INTERVAL=${VITE_REFETCH_INTERVAL} \
  npm run build

# Runtime environment variable
ENV DISCORD_BOT_TOKEN=""

# Production stage
FROM denoland/deno:2.1.10

WORKDIR /app

# Copy the built files and server
COPY --from=builder /app/dist ./dist
COPY deno.json ./
COPY server ./server

# Compile the Deno application
RUN deno cache server/main.ts

EXPOSE 3003

CMD ["deno", "task", "start"] 