const express = require("express");
const Product = require("../models/Product");
const { auth, requireAdmin } = require("../middleware/auth");
const { upload } = require("../utils/cloudinary");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (category) {
      filter.category = category;
    }

    filter.available = true;

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error("Get products error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", auth, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const productData = { ...req.body };
    if (req.file) {
      productData.imageUrl = req.file.path;
    }
    const product = await Product.create(productData);
    res.status(201).json(product);
  } catch (err) {
    console.error("Create product error:", err);
    res.status(400).json({ message: "Invalid product data" });
  }
});

router.put("/:id", auth, requireAdmin, upload.single("image"), async (req, res) => {
  try {
    const productData = { ...req.body };
    if (req.file) {
      productData.imageUrl = req.file.path;
    }
    const product = await Product.findByIdAndUpdate(req.params.id, productData, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    console.error("Update product error:", err);
    res.status(400).json({ message: "Invalid product data" });
  }
});

router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

