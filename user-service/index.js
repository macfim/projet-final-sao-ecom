const { ApolloServer, gql } = require("apollo-server");

// In-memory user database
const users = [
  { id: "1", name: "Alice Johnson", email: "alice@example.com" },
  { id: "2", name: "Bob Smith", email: "bob@example.com" },
];

// GraphQL schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type Query {
    user(id: ID!): User
    users: [User]
  }

  type Mutation {
    createUser(name: String!, email: String!): User
  }
`;

// Resolvers
const resolvers = {
  Query: {
    user: (_, { id }) => users.find((user) => user.id === id),
    users: () => users,
  },
  Mutation: {
    createUser: (_, { name, email }) => {
      const newUser = {
        id: (users.length + 1).toString(),
        name,
        email,
      };
      users.push(newUser);
      return newUser;
    },
  },
};

// Create Apollo Server
const server = new ApolloServer({ typeDefs, resolvers });

// Start server
server.listen({ port: 3004, host: "0.0.0.0" }).then(({ url }) => {
  console.log(`User Service running at ${url}`);
  console.log(
    "User Service is ready to accept connections from other containers"
  );
});
