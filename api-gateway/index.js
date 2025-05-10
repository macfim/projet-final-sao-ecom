const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const app = express();
const PORT = 3000;

// Parse JSON bodies
app.use(express.json());

// GRPC Service URLs from environment variables or defaults
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || "localhost:3005";
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || "localhost:3004";
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || "localhost:3003";

// Setup gRPC clients for all services
const setupGrpcClient = (protoPath, packageName, serviceName, serviceUrl) => {
  const packageDefinition = protoLoader.loadSync(protoPath, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });
  const proto = grpc.loadPackageDefinition(packageDefinition)[packageName];
  return new proto[serviceName](serviceUrl, grpc.credentials.createInsecure());
};

// Load proto files
const USER_PROTO = path.resolve(__dirname, "./user.proto");
const PRODUCT_PROTO = path.resolve(__dirname, "./product.proto");
const ORDER_PROTO = path.resolve(__dirname, "./order.proto");

// Create gRPC clients
const userClient = setupGrpcClient(
  USER_PROTO,
  "user",
  "UserService",
  USER_SERVICE_URL
);
const productClient = setupGrpcClient(
  PRODUCT_PROTO,
  "product",
  "ProductService",
  PRODUCT_SERVICE_URL
);
const orderClient = setupGrpcClient(
  ORDER_PROTO,
  "order",
  "OrderService",
  ORDER_SERVICE_URL
);

// REST API endpoints for User Service
app.get("/users", (req, res) => {
  userClient.getUsers({}, (error, response) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(response.users);
  });
});

app.get("/users/:id", (req, res) => {
  userClient.getUser({ id: req.params.id }, (error, user) => {
    if (error) {
      if (error.code === grpc.status.NOT_FOUND) {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(500).json({ error: error.message });
    }
    res.json(user);
  });
});

app.post("/users", (req, res) => {
  userClient.createUser(req.body, (error, user) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(user);
  });
});

// REST API endpoints for Product Service
app.get("/products", (req, res) => {
  productClient.getProducts({}, (error, response) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(response.products);
  });
});

app.get("/products/:id", (req, res) => {
  productClient.getProduct({ id: req.params.id }, (error, product) => {
    if (error) {
      if (error.code === grpc.status.NOT_FOUND) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.status(500).json({ error: error.message });
    }
    res.json(product);
  });
});

app.post("/products", (req, res) => {
  productClient.createProduct(req.body, (error, product) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(product);
  });
});

// REST API endpoints for Order Service
app.post("/orders", (req, res) => {
  orderClient.createOrder(req.body, (error, order) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.status(201).json(order);
  });
});

app.get("/orders", (req, res) => {
  orderClient.getOrders({}, (error, response) => {
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json(response.orders);
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

// GraphQL Schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Product {
    id: ID!
    name: String!
    price: Float!
    quantity: Int!
  }

  type OrderItem {
    productId: ID!
    quantity: Int!
  }

  type Order {
    id: ID!
    userId: ID!
    items: [OrderItem!]!
    status: String!
    createdAt: String!
  }

  type Query {
    user(id: ID!): User
    users: [User]
    product(id: ID!): Product
    products: [Product]
    order(id: ID!): Order
    orders: [Order]
  }

  type Mutation {
    createUser(name: String!, email: String!): User
    createProduct(name: String!, price: Float!, quantity: Int!): Product
    createOrder(userId: ID!, items: [OrderItemInput!]!): Order
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
  }
`;

// GraphQL Resolvers
const resolvers = {
  Query: {
    user: (_, { id }) => {
      return new Promise((resolve, reject) => {
        userClient.getUser({ id }, (error, user) => {
          if (error) return reject(error);
          resolve(user);
        });
      });
    },
    users: () => {
      return new Promise((resolve, reject) => {
        userClient.getUsers({}, (error, response) => {
          if (error) return reject(error);
          resolve(response.users);
        });
      });
    },
    product: (_, { id }) => {
      return new Promise((resolve, reject) => {
        productClient.getProduct({ id }, (error, product) => {
          if (error) return reject(error);
          resolve(product);
        });
      });
    },
    products: () => {
      return new Promise((resolve, reject) => {
        productClient.getProducts({}, (error, response) => {
          if (error) return reject(error);
          resolve(response.products);
        });
      });
    },
    order: (_, { id }) => {
      return new Promise((resolve, reject) => {
        orderClient.getOrder({ orderId: id }, (error, order) => {
          if (error) return reject(error);
          resolve(order);
        });
      });
    },
    orders: () => {
      return new Promise((resolve, reject) => {
        orderClient.getOrders({}, (error, response) => {
          if (error) return reject(error);
          resolve(response.orders);
        });
      });
    },
  },
  Mutation: {
    createUser: (_, { name, email }) => {
      return new Promise((resolve, reject) => {
        userClient.createUser({ name, email }, (error, user) => {
          if (error) return reject(error);
          resolve(user);
        });
      });
    },
    createProduct: (_, { name, price, quantity }) => {
      return new Promise((resolve, reject) => {
        productClient.createProduct(
          { name, price, quantity },
          (error, product) => {
            if (error) return reject(error);
            resolve(product);
          }
        );
      });
    },
    createOrder: (_, { userId, items }) => {
      return new Promise((resolve, reject) => {
        orderClient.createOrder({ userId, items }, (error, order) => {
          if (error) return reject(error);
          resolve(order);
        });
      });
    },
  },
};

// Create Apollo Server
const apolloServer = new ApolloServer({ typeDefs, resolvers });

// Start servers
async function startServer() {
  await apolloServer.start();
  apolloServer.applyMiddleware({ app, path: "/graphql" });

  app.get("/", (req, res) => {
    res.json({
      message: "E-commerce Microservices API Gateway",
      endpoints: {
        rest: {
          users: "/users",
          products: "/products",
          orders: "/orders",
        },
        graphql: "/graphql",
      },
    });
  });

  app.listen(PORT, () => {
    console.log(`API Gateway running on http://localhost:${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}/graphql`);
    console.log(`Connected to Product Service at ${PRODUCT_SERVICE_URL}`);
    console.log(`Connected to User Service at ${USER_SERVICE_URL}`);
    console.log(`Connected to Order Service at ${ORDER_SERVICE_URL}`);
  });
}

startServer();
