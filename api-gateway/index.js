const express = require("express");
const fetch = require("node-fetch");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const app = express();
const PORT = 3000;

// Service URLs from environment variables or defaults
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "localhost:3001";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "localhost:3002";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "localhost:3003";

// Parse JSON bodies
app.use(express.json());

// Product Service endpoints (using fetch instead of proxy)
app.get("/products", async (req, res) => {
  try {
    const response = await fetch(`http://${PRODUCT_SERVICE_URL}/products`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const response = await fetch(
      `http://${PRODUCT_SERVICE_URL}/products/${req.params.id}`
    );
    if (!response.ok) {
      return res.status(response.status).json({ error: "Product not found" });
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

app.post("/products", async (req, res) => {
  try {
    const response = await fetch(`http://${PRODUCT_SERVICE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// User Service endpoints (GraphQL using fetch)
app.post("/users/graphql", async (req, res) => {
  try {
    const response = await fetch(`http://${USER_SERVICE_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error with GraphQL request:", error);
    res.status(500).json({ error: "Failed to process GraphQL request" });
  }
});

// Setup gRPC client for Order Service
// Use the proto file that's mounted directly in the container
const PROTO_PATH = path.resolve(__dirname, "./order.proto");
console.log(`Loading proto file from: ${PROTO_PATH}`);

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const orderProto = grpc.loadPackageDefinition(packageDefinition).order;
const orderClient = new orderProto.OrderService(
  ORDER_SERVICE_URL,
  grpc.credentials.createInsecure()
);

// Order endpoints that forward to gRPC
app.post("/orders", (req, res) => {
  orderClient.createOrder(req.body, (error, order) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(order);
  });
});

app.get("/orders/:id", (req, res) => {
  orderClient.getOrder({ orderId: req.params.id }, (error, order) => {
    if (error) {
      if (error.code === grpc.status.NOT_FOUND) {
        return res.status(404).json({ error: "Order not found" });
      }
      return res.status(500).json({ error: error.message });
    }
    res.json(order);
  });
});

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "E-commerce Microservices API Gateway",
    endpoints: {
      products: "/products",
      users: "/graphql",
      orders: "/orders",
    },
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on http://localhost:${PORT}`);
  console.log(`Connected to Product Service at ${PRODUCT_SERVICE_URL}`);
  console.log(`Connected to User Service at ${USER_SERVICE_URL}`);
  console.log(`Connected to Order Service at ${ORDER_SERVICE_URL}`);
});
