const sql = require("mssql");
const dbConfig = require("../dbConfig");
const orderModel = require("../models/orderModel");

/**
 * POST /api/order/create
 * SHMS-7: Add multiple items in one order as Customer
 * body: { customerId, stallId, paymentMethod, items: [{ itemCode, quantity }] }
 */
async function createOrder(req, res) {
  try {
    const { customerId, stallId, paymentMethod, items } = req.body;

    if (!customerId || !stallId) {
      return res.status(400).json({ error: "customerId and stallId are required." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "items must be a non-empty array of { itemCode, quantity }." });
    }
    for (const item of items) {
      if (!item.itemCode || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          error: "Each item requires a valid itemCode and a quantity greater than 0."
        });
      }
    }
    const validMethods = ["Cash", "Card", "PayNow", "NETS"];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return res
        .status(400)
        .json({ error: `paymentMethod must be one of: ${validMethods.join(", ")}` });
    }

    const newOrder = await orderModel.createOrderWithItems({
      customerId,
      stallId,
      paymentMethod,
      items
    });

    return res.status(201).json({ message: "Order created successfully", order: newOrder });
  } catch (err) {
    console.error("createOrder error:", err.message);
    return res.status(500).json({ error: "Failed to create order.", details: err.message });
  }
}

/**
 * GET /api/order/history/:customerId
 * SHMS-9: Check order history as Customer
 */
async function getOrderHistory(req, res) {
  try {
    const { customerId } = req.params;
    if (!customerId) {
      return res.status(400).json({ error: "customerId is required." });
    }

    const history = await orderModel.getOrderHistoryByCustomer(customerId);

    if (history.length === 0) {
      return res.status(200).json({ message: "No orders found for this customer.", orders: [] });
    }

    return res.status(200).json({ orders: history });
  } catch (err) {
    console.error("getOrderHistory error:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to retrieve order history.", details: err.message });
  }
}

/**
 * GET /api/order/byId/:orderId
 * Supporting endpoint used to verify a single order (useful for Postman/demo)
 */
async function getOrderDetail(req, res) {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ error: "orderId is required." });
    }

    const order = await orderModel.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: `Order ${orderId} not found.` });
    }

    return res.status(200).json({ order });
  } catch (err) {
    console.error("getOrderDetail error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve order.", details: err.message });
  }
}

/**
 * GET /api/order/customers
 * Minimal read-only helper for the order page's "ordering as" dropdown.
 * NOTE: this is only CustomerID + CustName, not full user management -
 * that belongs to whoever owns Customer/User account features. If your
 * teammate's userController.js already exposes a similar list (e.g.
 * getAllUsers filtered to customers), prefer that instead and delete this.
 */
async function getCustomersForOrdering(req, res) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .query("SELECT CustomerID, CustName FROM Customer ORDER BY CustName");
    return res.status(200).json({ customers: result.recordset });
  } catch (err) {
    console.error("getCustomersForOrdering error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve customers.", details: err.message });
  }
}

module.exports = { createOrder, getOrderHistory, getOrderDetail, getCustomersForOrdering };
