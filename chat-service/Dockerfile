FROM --platform=linux/amd64 node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "server.js"]