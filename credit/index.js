const express = require("express");
require("dotenv").config();

const app = express();

// Home route
app.get("/", (req, res) => {
  res.send("Hello World!!!");
});

// Test environment variable
app.get("/env", (req, res) => {
  res.json({
    message: "Environment variable working",
    secret: process.env.MY_SECRET
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});