# Microservices E-commerce Platform

A minimalist e-commerce platform using Node.js microservices with different communication protocols:

- Product Service (REST)
- User Service (GraphQL)
- Order Service (gRPC)
- Notification Service (Kafka)
- API Gateway (using direct fetch requests)

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Docker and Docker Compose (for Kafka)

## Setup Instructions

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   cd product-service && npm install
   cd user-service && npm install
   cd order-service && npm install
   cd notification-service && npm install
   cd api-gateway && npm install
   ```

3. Start Kafka using Docker Compose:

   ```bash
   docker-compose up -d
   ```

## Running the Services

### Production Mode

Start all services:

```bash
npm run start:all
```

Or start individual services:

```bash
npm run start:product
npm run start:user
npm run start:order
npm run start:notification
npm run start:gateway
```

### Development Mode

Start all services with hot-reload:

```bash
npm run dev:all
```

Or start individual services in development mode:

```bash
npm run dev:product
npm run dev:user
npm run dev:order
npm run dev:notification
npm run dev:gateway
```

## Communication Patterns

This project demonstrates different communication patterns between microservices:

1. **REST API** - Product Service exposes a REST API, consumed by the API Gateway using fetch
2. **GraphQL** - User Service exposes a GraphQL API, consumed by the API Gateway using fetch
3. **gRPC** - Order Service exposes a gRPC API, consumed by the API Gateway using gRPC client
4. **Event-Driven** - Order Service publishes events to Kafka, consumed by the Notification Service

## API Endpoints

### Product Service (REST) - http://localhost:3001

- `GET /products` - List all products
- `GET /products/:id` - Get product by ID
- `POST /products` - Create new product

### User Service (GraphQL) - http://localhost:3002/graphql

```graphql
# Get user by ID
query {
  user(id: "1") {
    id
    name
    email
  }
}

# List all users
query {
  users {
    id
    name
    email
  }
}

# Create user
mutation {
  createUser(name: "John Doe", email: "john@example.com") {
    id
    name
    email
  }
}
```

### Order Service (gRPC) - localhost:3003

- Called through API Gateway or directly using a gRPC client

### API Gateway - http://localhost:3000

- `/products/*` - Routes to Product Service
- `/graphql` - Routes to User Service
- `/orders/*` - Routes to Order Service

## Example Requests

### Create a product

```bash
curl -X POST http://localhost:3000/products -H "Content-Type: application/json" -d '{"name": "Tablet", "price": 299.99, "quantity": 50}'
```

### Create a user

```bash
curl -X POST http://localhost:3000/graphql -H "Content-Type: application/json" -d '{"query": "mutation { createUser(name: \"Jane Smith\", email: \"jane@example.com\") { id name email } }"}'
```

### Create an order

```bash
curl -X POST http://localhost:3000/orders -H "Content-Type: application/json" -d '{"userId": "1", "items": [{"productId": "1", "quantity": 2}]}'
```

## API Testing with Bruno

This project includes API collections for [Bruno](https://www.usebruno.com/), an open-source API client that can be used to test all the services:

1. Install Bruno from https://www.usebruno.com/downloads
2. Open Bruno and select "Open Collection"
3. Navigate to the Bruno directory in this project
4. Use the provided requests to test each service:
   - Product Service: REST API requests
   - User Service: GraphQL queries and mutations
   - Order Service: gRPC requests through the API Gateway
   - API Gateway: Combined endpoints for all services
