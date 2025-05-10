const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const mongoose = require("mongoose");
const { Kafka } = require("kafkajs");

// MongoDB connection
mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb://root:rootpassword@localhost:27017/order?authSource=admin"
);

// Order Schema
const orderItemSchema = new mongoose.Schema({
  productId: String,
  quantity: Number,
});

const orderSchema = new mongoose.Schema({
  userId: String,
  items: [orderItemSchema],
  status: String,
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

const KAFKA_BROKER = process.env.KAFKA_BROKER || "localhost:9092";

// Kafka setup
const kafka = new Kafka({
  clientId: "order-service",
  brokers: [KAFKA_BROKER],
});

const producer = kafka.producer();

// Load proto file
const PROTO_PATH = path.resolve(__dirname, "./order.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const orderProto = grpc.loadPackageDefinition(packageDefinition).order;

// Implement the gRPC service methods
const createOrder = async (call, callback) => {
  try {
    const { userId, items } = call.request;
    const order = new Order({
      userId,
      items,
      status: "PENDING",
    });
    await order.save();

    // Send order created event to Kafka
    await producer.send({
      topic: "order-events",
      messages: [
        {
          value: JSON.stringify({
            type: "ORDER_CREATED",
            orderId: order._id.toString(),
            userId,
            items,
          }),
        },
      ],
    });

    callback(null, {
      id: order._id.toString(),
      userId: order.userId,
      items: order.items,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const getOrder = async (call, callback) => {
  try {
    const order = await Order.findById(call.request.orderId);
    if (!order) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Order not found",
      });
    }
    callback(null, {
      id: order._id.toString(),
      userId: order.userId,
      items: order.items,
      status: order.status,
      createdAt: order.createdAt.toISOString(),
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const getOrders = async (call, callback) => {
  try {
    const orders = await Order.find();
    callback(null, {
      orders: orders.map((order) => ({
        id: order._id.toString(),
        userId: order.userId,
        items: order.items,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

// Start gRPC server
const server = new grpc.Server();
server.addService(orderProto.OrderService.service, {
  createOrder,
  getOrder,
  getOrders,
});

// Connect to Kafka before starting the server
producer.connect().then(() => {
  server.bindAsync(
    "0.0.0.0:3003",
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error("Failed to bind server:", err);
        return;
      }
      console.log(`Order Service running on port ${port}`);
      server.start();
      console.log(
        "Order Service is ready to accept connections from other containers"
      );
    }
  );
});
