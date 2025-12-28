FROM node:18-alpine

WORKDIR /app

# Install procps for pgrep (healthcheck)
RUN apk add --no-cache procps

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3003

CMD ["node", "index.js"] 