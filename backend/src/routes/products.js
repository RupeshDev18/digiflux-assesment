const express = require("express");
const multer = require("multer");
const Product = require("../models/Product");
const { auth, adminAuth } = require("../middlewares/auth");
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

router.get("/", async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      search,
      page = 1,
      limit = 12,
      sort = "createdAt",
      order = "desc",
    } = req.query;

    let query = {};

    if (category && category !== "all") {
      query.category = category;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = order === "desc" ? -1 : 1;
    const sortObj = { [sort]: sortOrder };

    const products = await Product.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort(sortObj);

    const total = await Product.countDocuments(query);
    const categories = await Product.distinct("category");

    res.json({
      products,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      categories,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", upload.array("images", 5), async (req, res) => {
  try {
    const { name, description, price, category, stock, sku } = req.body;

    const imagePaths = req.files
      ? req.files.map((file) => `/uploads/${file.filename}`)
      : ["/uploads/default-product.jpg"];

    const product = new Product({
      name,
      description,
      price: parseFloat(price),
      category,
      stock: parseInt(stock),
      sku,
      images: imagePaths,
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/bulk", adminAuth, async (req, res) => {
  try {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/photos?_limit=30"
    );
    const photos = await response.json();

    const categories = ["Electronics", "Clothing", "Books", "Home", "Sports"];

    const products = photos.map((photo) => ({
      name: `Product ${photo.id}`,
      description: photo.title || "High-quality product description",
      price: parseFloat((Math.random() * 500 + 10).toFixed(2)),
      category: categories[Math.floor(Math.random() * categories.length)],
      images: [photo.thumbnailUrl || "/uploads/default-product.jpg"],
      stock: Math.floor(Math.random() * 100),
      sku: `SKU-${photo.id}-${Date.now()}`,
    }));

    await Product.insertMany(products);
    res
      .status(201)
      .json({ message: `${products.length} products created successfully` });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:id", upload.array("images", 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const updateData = { ...req.body };

    if (req.files && req.files.length > 0) {
      updateData.images = req.files.map((file) => `/uploads/${file.filename}`);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
