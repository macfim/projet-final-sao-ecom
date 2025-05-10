const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3005;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory database
const products = [
  { id: "1", name: "Laptop", price: 999.99, quantity: 10 },
  { id: "2", name: "Smartphone", price: 699.99, quantity: 15 },
  { id: "3", name: "Headphones", price: 99.99, quantity: 20 },
];

// Get all products
app.get("/products", (req, res) => {
  res.json(products);
});

// Get product by id
app.get("/products/:id", (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  res.json(product);
});

// Create a new product
app.post("/products", (req, res) => {
  const { name, price, quantity } = req.body;
  const newProduct = {
    id: (products.length + 1).toString(),
    name,
    price: parseFloat(price),
    quantity: parseInt(quantity, 10),
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Product Service running on http://0.0.0.0:${PORT}`);
  console.log(
    "Product Service is ready to accept connections from other containers"
  );
});
