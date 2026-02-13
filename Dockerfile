# Stage 1: Build frontend
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Production server (Express + static files)
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Copy server code
COPY server ./server
# Copy built frontend
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=80
ENV DATA_DIR=/app/data

EXPOSE 80
VOLUME ["/app/data"]

CMD ["node", "server/index.js"]
