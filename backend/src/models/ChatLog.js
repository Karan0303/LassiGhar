const mongoose = require("mongoose");

const chatLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    message: { type: String, required: true },
    sender: { type: String, enum: ["user", "chatbot"], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatLog", chatLogSchema);

