const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: String, // interview said assume userId is passed
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED"],
      default: "SUCCESS",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

