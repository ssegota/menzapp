# Multi-stage build: compile the React client, then run the Express server
# which also serves the built static assets.

# ---- Build the React client ----
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
# VITE_API_BASE_URL defaults to "" so the bundled app uses same-origin /api.
# Override at build time with: docker build --build-arg VITE_API_BASE_URL=https://api.example.com
ARG VITE_API_BASE_URL=""
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# ---- Server runtime ----
FROM node:20-alpine
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=client-build /app/client/dist /app/client/dist

ENV NODE_ENV=production
ENV PORT=3000
# DATA_DIR should point to a mounted persistent volume in production
# so data.json survives restarts and redeploys.
ENV DATA_DIR=/data

EXPOSE 3000
CMD ["node", "index.js"]
