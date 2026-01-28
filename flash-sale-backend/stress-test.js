const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const Product = require("./models/Product");

const API_URL = "http://localhost:3001/api/purchase";
const TOTAL_REQUESTS = 50;
const INITIAL_STOCK = 10;

async function stressTest() {
  console.log(
    `Starting stress test: ${TOTAL_REQUESTS} requests for ${INITIAL_STOCK} items`
  );
  console.log("----------------------------------------");

  // 1️⃣ Create fresh product with stock = 10
  const product = await Product.create({
    name: "Stress Test Product",
    price: 100,
    stock: INITIAL_STOCK,
  });

  const productId = product._id.toString();

  // 2️⃣ Fire 50 concurrent purchase requests
  const requests = Array.from({ length: TOTAL_REQUESTS }).map(() =>
    axios
      .post(API_URL, { productId })
      .then((res) => res.data)
      .catch((err) => err.response?.data)
  );

  const results = await Promise.all(requests);

  // 3️⃣ Count results
  const successCount = results.filter((r) => r?.success === true).length;
  const failedCount = TOTAL_REQUESTS - successCount;

  // 4️⃣ Fetch final stock
  const finalProduct = await Product.findById(productId);

  console.log(`Successful purchases: ${successCount}`);
  console.log(`Failed (out of stock): ${failedCount}`);
  console.log(`Final stock in database: ${finalProduct.stock}`);
  console.log("----------------------------------------");

  if (successCount === INITIAL_STOCK && finalProduct.stock === 0) {
    console.log("TEST PASSED: No overselling detected");
  } else {
    console.log("TEST FAILED: Overselling detected");
  }

  // cleanup
  await Product.deleteOne({ _id: productId });
  await mongoose.disconnect();
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(stressTest)
  .catch(console.error);
