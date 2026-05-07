FROM node:22-alpine

WORKDIR /app

# Install bash for startup script
RUN apk add --no-cache bash

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma Client during build
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Make startup script executable
RUN chmod +x /app/scripts/start.sh

EXPOSE 3000

# Use startup script to handle migrations, seeding, and app launch
CMD ["/bin/sh", "/app/scripts/start.sh"]
