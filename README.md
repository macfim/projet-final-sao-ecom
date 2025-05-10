# Microservices E-commerce Platform

A minimalist e-commerce platform using Node.js microservices with different communication protocols:

- Product Service (gRPC)
- User Service (gRPC)
- Order Service (gRPC + Kafka event publishing)
- Notification Service (Kafka consumer)
- API Gateway (REST + GraphQL interfaces)

## Architecture

![Microservices Architecture](architecture.png)

This architecture diagram was generated using:

```bash
MSYS_NO_PATHCONV=1 docker run --rm -it --name dcv -v "$(pwd):/input" pmsipilot/docker-compose-viz render -m image docker-compose.yml -o architecture.png --no-volumes -r
```

## Prerequisites

- Node.js (v14+)
- npm or yarn
- Docker and Docker Compose

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

## Running with Docker

The easiest way to run all services is using Docker Compose:

```bash
docker-compose up
```

This will build and start all services:

- API Gateway: http://localhost:3000
- Notification Service: (internal Kafka consumer)
- Order Service: (internal gRPC server on port 3003)
- User Service: (internal gRPC server on port 3004)
- Product Service: (internal gRPC server on port 3005)
- Kafka: (internal on port 9092)
- Zookeeper: (internal on port 2181)

To rebuild the services after making changes:

```bash
docker-compose up --build
```

To stop all services:

```bash
docker-compose down
```

## Running Services Locally

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

1. **gRPC** - All services (Product, User, Order) implement gRPC servers and are consumed by the API Gateway via gRPC clients
2. **REST API** - API Gateway exposes REST endpoints that internally call the gRPC services
3. **GraphQL** - API Gateway also provides a GraphQL interface for accessing the same services
4. **Event-Driven** - Order Service publishes events to Kafka, consumed by the Notification Service

## API Gateway Access

You can interact with all three main services (Product, User, and Order) through the API Gateway using either:

1. **REST API Endpoints**:

   - Products: `GET/POST /products`, `GET /products/:id`
   - Users: `GET/POST /users`, `GET /users/:id`
   - Orders: `GET/POST /orders`, `GET /orders/:id`

2. **GraphQL Interface**:
   - Access via `/graphql` endpoint on the API Gateway
   - Query products, users, and orders
   - Perform mutations for creating products, users, and orders

The API Gateway translates these REST and GraphQL requests into gRPC calls to the appropriate microservice.

## Service Details

- **Product Service**: Manages product catalog (name, price, inventory)
- **User Service**: Manages user accounts
- **Order Service**: Handles order creation and triggers notifications via Kafka
- **Notification Service**: Consumes Kafka events from the Order Service
- **API Gateway**: Unified entry point that provides both REST and GraphQL interfaces

## API Testing with Bruno

This project includes API collections for [Bruno](https://www.usebruno.com/), an open-source API client that can be used to test all the services:

1. Install Bruno from https://www.usebruno.com/downloads
2. Open Bruno and select "Open Collection"
3. Navigate to the Bruno directory in this project
4. Use the provided requests to test each service:
   - Product Service: Access via REST and GraphQL through the API Gateway
   - User Service: Access via REST and GraphQL through the API Gateway
   - Order Service: Access via REST and GraphQL through the API Gateway
   - Examples for all available endpoints and queries
