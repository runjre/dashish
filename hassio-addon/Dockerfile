# ── Stage 1: Build from source ────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache git

ARG BUILD_REPO=https://github.com/oyvhov/Tunet.git
ARG BUILD_BRANCH=addon-support

WORKDIR /src
RUN git clone --depth 1 --branch ${BUILD_BRANCH} ${BUILD_REPO} .
RUN npm ci
RUN npm run build

# ── Stage 2: Production image ────────────────────────────────────────
ARG BUILD_FROM
FROM ${BUILD_FROM:-ghcr.io/hassio-addons/base:16.3.2}

RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy only what's needed for production
COPY --from=builder /src/dist ./dist
COPY --from=builder /src/server ./server
COPY --from=builder /src/package.json .
COPY --from=builder /src/package-lock.json .

# Install production dependencies only
RUN npm ci --omit=dev

# Copy run script from build context (hassio-addon/)
COPY run.sh /run.sh
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
