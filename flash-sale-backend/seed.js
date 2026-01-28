require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

const products = [
  {
    name: "iPhone Flash Sale",
    price: 999,
    stock: 4
  },
  {
    name: "Samsung Galaxy S24 Flash Sale",
    price: 899,
    stock: 21
  },
  {
    name: "OnePlus 12 Pro Flash Sale",
    price: 799,
    stock: 2
  },
  {
    name: "Google Pixel 8 Flash Sale",
    price: 749,
    stock: 4
  },
  {
    name: "iPhone 15 Flash Sale",
    price: 999,
    stock: 3
  },
  {
    name: "Xiaomi 14 Pro Flash Sale",
    price: 699,
    stock: 7
  },
  {
    name: "Nothing Phone 2 Flash Sale",
    price: 599,
    stock: 0
  },
  {
    name: "Realme GT 5 Flash Sale",
    price: 549,
    stock: 10
  },
  {
    name: "Vivo X100 Flash Sale",
    price: 649,
    stock: 6
  },
  {
    name: "Oppo Find X7 Flash Sale",
    price: 729,
    stock: 4
  },
  {
    name: "Motorola Edge 40 Pro Flash Sale",
    price: 679,
    stock: 5
  }
];

async function seed() {
  try {
    console.log("⏳ Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);

    console.log("🗑️  Cleaning existing products...");
    await Product.deleteMany();

    console.log("🌱 Seeding new products...");
    const createdProducts = await Product.insertMany(products);

    console.log(`✅ Success! ${createdProducts.length} products seeded.`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();