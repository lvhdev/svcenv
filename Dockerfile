FROM node:8-alpine

ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN apk --update add --no-cache bash && \
  npm install --production

COPY index.js .

# ENTRYPOINT ["node", "index.js"]
