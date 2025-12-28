FROM node:18-alpine

WORKDIR /app

# Install procps for pgrep (healthcheck)
RUN apk add --no-cache procps

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "index.js"] 