const app = require("./src/app");
const connectDB = require("./src/config/db");
require("dotenv").config();

connectDB();

const fs = require("fs");
const uploadsDir = "./uploads";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = process.env.PORT || 6000;
app.listen(PORT, (req, res) => {
  console.log(`app is running on port ${PORT}`);
});
