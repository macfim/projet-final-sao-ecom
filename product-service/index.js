const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// In-memory database
const products = [
  { id: "1", name: "Laptop", price: 999.99, quantity: 10 },
  { id: "2", name: "Smartphone", price: 699.99, quantity: 15 },
  { id: "3", name: "Headphones", price: 99.99, quantity: 20 },
];

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
const getProduct = (call, callback) => {
  const product = products.find((p) => p.id === call.request.id);
  if (!product) {
    return callback({
      code: grpc.status.NOT_FOUND,
      message: "Product not found",
    });
  }
  callback(null, product);
};

const getProducts = (call, callback) => {
  callback(null, { products });
};

const createProduct = (call, callback) => {
  const { name, price, quantity } = call.request;
  const newProduct = {
    id: (products.length + 1).toString(),
    name,
    price: parseFloat(price),
    quantity: parseInt(quantity, 10),
  };
  products.push(newProduct);
  callback(null, newProduct);
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
