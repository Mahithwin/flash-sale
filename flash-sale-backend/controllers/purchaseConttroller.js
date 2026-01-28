const mongoose = require("mongoose");
const Product = require("../models/Product");
const redis = require("../config/redis");
const Order = require("../models/Order");
const LOCK_TTL = 3000; // 3 seconds

exports.buyProduct = async (req, res) => {
  const { productId } = req.body;
  const lockKey = `lock:product:${productId}`;

  try {
    // 1️⃣ Acquire lock (atomic)
    const lock = await redis.set(lockKey, "locked", "NX", "PX", LOCK_TTL);

    if (!lock) {
      return res.status(429).json({
        message: "Too many requests. Please try again.",
      });
    }

    // 2️⃣ Fetch product
    const product = await Product.findById(productId);

    if (!product || product.stock <= 0) {
      return res.status(400).json({ message: "Out of stock" });
    }

    // 3️⃣ Reduce stock
    product.stock -= 1;
    await product.save();

    return res.json({
      success: true,
      message: "Purchase successful",
      remainingStock: product.stock,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    // 4️⃣ Release lock
    await redis.del(lockKey);
  }
};

exports.purchaseProduct = async (req, res) => {
  try {
    const { productId, userId } = req.body;

    /* 1️⃣ Validate input */
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Invalid product",
      });
    }

    /* 2️⃣ Atomic stock decrement */
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gt: 0 } },
      { $inc: { stock: -1 } },
      { new: true }
    );

    /* 3️⃣ Sold out */
    if (!updatedProduct) {
      await Order.create({
        productId,
        userId: userId || "guest-user",
        price: 0,
        quantity: 0,
        status: "FAILED",
        reason: "SOLD_OUT",
      });

      return res.status(409).json({
        success: false,
        message: "Product sold out",
      });
    }

    /* 4️⃣ Successful order */
    const order = await Order.create({
      productId: updatedProduct._id,
      userId: userId || "guest-user",
      price: updatedProduct.price,
      quantity: 1,
      status: "SUCCESS",
    });

    /* 5️⃣ WebSocket updates */
    const io = req.app.get("socketio");
    if (io) {
      io.emit("stockUpdate", {
        productId: updatedProduct._id,
        newStock: updatedProduct.stock,
      });

      const populatedOrder = await Order.findById(order._id).populate(
        "productId",
        "name"
      );

      io.emit("newOrder", populatedOrder);
    }

    /* 6️⃣ Response */
    return res.status(200).json({
      success: true,
      message: "Purchase successful",
      remainingStock: updatedProduct.stock,
    });
  } catch (error) {
    console.error("Purchase error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
