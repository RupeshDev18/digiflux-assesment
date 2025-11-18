const express = require("express");
const app = express();

require("dotenv").config();

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Endpoint is working fine." });
});

const PORT = process.env.PORT || 6000;
app.listen(PORT, (req, res) => {
  console.log(`app is running on port ${PORT}`);
});
