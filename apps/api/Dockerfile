FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.29.3 --activate
WORKDIR /repo

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY apps/api apps/api
COPY packages/shared packages/shared
WORKDIR /repo/apps/api
RUN pnpm run build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=build /repo/apps/api/dist apps/api/dist

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3001/api/health || exit 1

WORKDIR /repo/apps/api
CMD ["node", "dist/main.js"]
