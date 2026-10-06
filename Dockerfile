FROM node:24.15.0-bookworm-slim AS base

WORKDIR /workspace

RUN apt-get update \
    && apt-get install --no-install-recommends --yes procps \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

FROM base AS development

COPY . .

FROM base AS e2e

RUN npx playwright install --with-deps chromium

COPY . .
