# Sandbox Web — standalone execution service.
# Deliberately small: no npm install at all, so a cold start is just "node server.mjs".
FROM node:22-alpine

# bash for shell commands, python3 for python / python-safe, the rest for
# commands a user is likely to reach for. Add go/rust/openjdk here (and they
# will be advertised by /health automatically) if you need those runtimes.
RUN apk add --no-cache bash coreutils git curl jq python3

WORKDIR /app
COPY package.json server.mjs ./
COPY lib ./lib
COPY public ./public

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8788

# Unprivileged: the service spawns user code, so it must not run as root.
USER node
EXPOSE 8788
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD curl -fsS http://127.0.0.1:8788/health || exit 1
CMD ["node", "server.mjs"]
