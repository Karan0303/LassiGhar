const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ["Classic", "Flavored", "Seasonal", "Special", "Combo"],
      required: true,
    },
    description: { type: String },
    price: { type: Number, required: true },
    imageUrl: { type: String },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);

