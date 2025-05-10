const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// In-memory user database
const users = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com" },
  { id: "2", name: "Bob Smith", email: "bob@example.com" },
];

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
const getUser = (call, callback) => {
  const user = users.find((user) => user.id === call.request.id);
  if (!user) {
    return callback({
      code: grpc.status.NOT_FOUND,
      message: "User not found",
    });
  }
  callback(null, user);
};

const getUsers = (call, callback) => {
  callback(null, { users });
};

const createUser = (call, callback) => {
  const { name, email } = call.request;
  const newUser = {
    id: (users.length + 1).toString(),
    name,
    email,
  };
  users.push(newUser);
  callback(null, newUser);
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
