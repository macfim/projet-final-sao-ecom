const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const { Kafka } = require("kafkajs");

const PORT = 3003;

// Load proto file
const packageDefinition = protoLoader.loadSync("./order.proto", {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const orderProto = grpc.loadPackageDefinition(packageDefinition).order;

// In-memory order database
const orders = [];

// Setup Kafka producer
const kafka = new Kafka({
  clientId: "order-service",
  brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
});
const producer = kafka.producer();

// Connect to Kafka
const connectKafka = async () => {
  await producer.connect();
  console.log("Connected to Kafka");
};

// Publish order created event
const publishOrderCreated = async (order) => {
  try {
    await producer.send({
      topic: "order-events",
      messages: [
        {
          key: order.id,
          value: JSON.stringify({ type: "ORDER_CREATED", data: order }),
        },
      ],
    });
    console.log(`Published order created event for order ${order.id}`);
  } catch (err) {
    console.error("Erreur lors de la production de message", err);
  }
};

// gRPC service implementation
const orderService = {
  createOrder: async (call, callback) => {
    const { userId, items } = call.request;
    const order = {
      id: (orders.length + 1).toString(),
      userId,
      items,
      status: "CREATED",
      createdAt: new Date().toISOString(),
    };
    orders.push(order);

    try {
      await publishOrderCreated(order);
    } catch (error) {
      console.error("Error publishing to Kafka", error);
    }

    callback(null, order);
  },

  getOrder: (call, callback) => {
    const { orderId } = call.request;
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Order not found",
      });
    }

    callback(null, order);
  },

  getOrders: (call, callback) => {
    callback(null, { orders });
  },
};

// Start gRPC server
const server = new grpc.Server();
server.addService(orderProto.OrderService.service, orderService);
server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error("Failed to bind server:", error);
      return;
    }

    console.log(`Order Service running on port ${port}`);
    server.start();

    // Connect to Kafka
    connectKafka().catch(console.error);
  }
);
