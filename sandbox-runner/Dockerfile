FROM node:22-alpine
RUN apk add --no-cache bash coreutils git curl python3 py3-pip build-base musl-dev make go rust cargo openjdk21-jre-headless zip unzip jq openssh-client
WORKDIR /app
COPY package.json server.mjs sync.mjs ./
USER node
EXPOSE 8787
CMD ["npm","start"]
