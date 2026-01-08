const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const mongoose = require("mongoose");

// MongoDB connection
mongoose.connect(
  process.env.MONGODB_URI ||
    "mongodb://root:rootpassword@localhost:27017/user?authSource=admin"
);

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// Load proto file
const PROTO_PATH = path.resolve(__dirname, "./user.proto");
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const userProto = grpc.loadPackageDefinition(packageDefinition).user;

// Implement the gRPC service methods
const getUser = async (call, callback) => {
  try {
    const user = await User.findById(call.request.id);
    if (!user) {
      return callback({
        code: grpc.status.NOT_FOUND,
        message: "User not found",
      });
    }
    callback(null, {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const getUsers = async (call, callback) => {
  try {
    const users = await User.find();
    callback(null, {
      users: users.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        createdAt: u.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    callback({
      code: grpc.status.INTERNAL,
      message: error.message,
    });
  }
};

const createUser = async (call, callback) => {
  try {
    const { name, email } = call.request;
    const user = new User({
      name,
      email,
      createdAt: new Date(),
    });
    await user.save();
    callback(null, {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
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
server.addService(userProto.UserService.service, {
  getUser,
  getUsers,
  createUser,
});

server.bindAsync(
  "0.0.0.0:3004",
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) {
      console.error("Failed to bind server:", err);
      return;
    }
    console.log(`User Service running on port ${port}`);
    server.start();
    console.log(
      "User Service is ready to accept connections from other containers"
    );
  }
);
