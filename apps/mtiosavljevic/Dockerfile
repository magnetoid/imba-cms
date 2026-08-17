# ── Stage 1: Build the pilot app from the pnpm monorepo ──────────────
# Build context is the repo ROOT (so the whole workspace is available).
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /repo

COPY . .
RUN pnpm install --frozen-lockfile

# Vite build args (baked into the bundle).
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

RUN pnpm --filter mtiosavljevic build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────
FROM nginx:1.25-alpine AS runner
RUN rm /etc/nginx/conf.d/default.conf
COPY apps/mtiosavljevic/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /repo/apps/mtiosavljevic/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
