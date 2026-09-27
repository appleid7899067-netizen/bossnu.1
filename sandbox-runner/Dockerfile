FROM node:22-alpine
RUN apk add --no-cache bash coreutils git curl python3
WORKDIR /app
COPY package.json server.mjs ./
USER node
EXPOSE 8787
CMD ["npm","start"]
