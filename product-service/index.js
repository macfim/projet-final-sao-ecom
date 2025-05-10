const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const mongoose = require("mongoose");

// MongoDB connection
mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb://root:rootpassword@localhost:27017/product?authSource=admin"
);

// Product Schema
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  quantity: Number,
  createdAt: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", productSchema);

// Load proto file
const PROTO_PATH = path.resolve(__dirname, "./product.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const productProto = grpc.loadPackageDefinition(packageDefinition).product;

// Implement the gRPC service methods
const getProduct = async (call, callback) => {
  try {
    const product = await Product.findById(call.request.id);
    if (!product) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "Product not found",
      });
    }
    callback(null, {
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      createdAt: product.createdAt.toISOString(),
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const getProducts = async (call, callback) => {
  try {
    const products = await Product.find();
    callback(null, {
      products: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        price: p.price,
        quantity: p.quantity,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const createProduct = async (call, callback) => {
  try {
    const { name, price, quantity } = call.request;
    const product = new Product({
      name,
      price,
      quantity,
      createdAt: new Date(),
    });
    await product.save();
    callback(null, {
      id: product._id.toString(),
      name: product.name,
      price: product.price,
      quantity: product.quantity,
      createdAt: product.createdAt.toISOString(),
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
server.addService(productProto.ProductService.service, {
  getProduct,
  getProducts,
  createProduct,
});

server.bindAsync(
  "0.0.0.0:3005",
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error("Failed to bind server:", err);
      return;
    }
    console.log(`Product Service running on port ${port}`);
    server.start();
    console.log(
      "Product Service is ready to accept connections from other containers"
    );
  }
);
