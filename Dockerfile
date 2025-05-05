# Stage 1: Build the application
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Add build argument for DATABASE_URL
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Install OpenSSL
RUN apk add --no-cache openssl

# Install pnpm
RUN npm install -g pnpm

# Copy dependency definition files
COPY package.json pnpm-lock.yaml ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build the Next.js application
# Ensure necessary build-time env vars are available if needed
# ARG DATABASE_URL
# ARG NEXTAUTH_URL
# ARG NEXTAUTH_SECRET
# ENV DATABASE_URL=${DATABASE_URL}
# ENV NEXTAUTH_URL=${NEXTAUTH_URL}
# ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
RUN pnpm build

# Stage 2: Production image
FROM node:18-alpine AS runner

WORKDIR /app

# Install OpenSSL
RUN apk add --no-cache openssl

# Install pnpm (needed for start command if using pnpm start)
# Alternatively, you could use `node server.js` if standalone output is enabled
RUN npm install -g pnpm

# Copy necessary files from the builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
# Copy pnpm-lock.yaml if `pnpm start` is used
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
# Copy the prisma directory from the build context
COPY prisma ./prisma

# Expose the port the app runs on
EXPOSE 3000

# Copy and make the entrypoint script executable
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Set NODE_ENV to production
ENV NODE_ENV=production

# Command to run the application
# Use `pnpm start` or `node server.js` if using standalone output
CMD ["pnpm", "start"]
