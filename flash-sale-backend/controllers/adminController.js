const Product = require("../models/Product");
const Order = require("../models/Order");

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(20)
      // This looks into the 'Product' collection and only grabs the 'name' field
      .populate("productId", "name"); 

    res.json(orders);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


exports.getAdminStats = async (req, res) => {
  try {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);
    last7Days.setHours(0, 0, 0, 0);

    const stats = await Order.aggregate([
      { $match: { status: { $regex: /^success$/i } } },
      {
        $facet: {
          // 1. Total Revenue & Units Sold
          "totals": [
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: { $convert: { input: "$price", to: "double" } } },
                totalUnitsSold: { $sum: "$quantity" }
              }
            }
          ],
          // 2. Top 3 Selling Products
          "topProducts": [
            {
              $group: {
                _id: "$productId",
                count: { $sum: "$quantity" }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 3 },
            {
              $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "details"
              }
            },
            { $unwind: "$details" }
          ],
          // 3. Revenue by Day (Last 7 Days)
          "revenueHistory": [
            { $match: { createdAt: { $gte: last7Days } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                dailyRevenue: { $sum: { $convert: { input: "$price", to: "double" } } }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    const data = stats[0];
    res.json({
      success: true,
      totalRevenue: data.totals[0]?.totalRevenue || 0,
      totalUnitsSold: data.totals[0]?.totalUnitsSold || 0,
      topProducts: data.topProducts,
      revenueByDay: data.revenueHistory
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



