const sql = require("mssql");
const dbConfig = require("../dbConfig");
 
/**
 * This schema uses hand-formatted string IDs (e.g. 'OR001', 'C0001') instead
 * of IDENTITY columns, so we generate the next ID ourselves by finding the
 * current max and incrementing it.
 *
 * table      - table to scan (e.g. 'CustOrder')
 * idColumn   - PK column (e.g. 'OrderID')
 * prefix     - fixed letters at the start of the ID (e.g. 'OR')
 * numLength  - how many digits follow the prefix (e.g. 3 for 'OR001')
 *
 * NOTE: for a class assignment this simple max+1 approach is fine. Under
 * real concurrent load it could theoretically generate a duplicate ID for
 * two orders placed in the same instant - the transaction below reduces
 * that risk but isn't fully airtight. Flagging this so the team is aware.
 */
async function generateNextId(transaction, table, idColumn, prefix, numLength) {
  const result = await new sql.Request(transaction).query(
    `SELECT ISNULL(MAX(CAST(SUBSTRING(${idColumn}, ${prefix.length + 1}, ${numLength}) AS INT)), 0) AS MaxNum
     FROM ${table}`
  );
  const nextNum = result.recordset[0].MaxNum + 1;
  return prefix + String(nextNum).padStart(numLength, "0");
}
 
/**
 * SHMS-7: Create an order with multiple order items in one transaction.
 * orderData = {
 *   customerId: 'C0001',
 *   stallId: 'ST001',
 *   paymentMethod: 'PayNow' | 'Cash' | 'Card' | 'NETS',
 *   items: [{ itemCode: 'IT001', quantity: 2 }, ...]
 * }
 * All items in one order must belong to the same stallId (this schema
 * doesn't enforce that at the DB level, so we enforce it here).
 */
async function createOrderWithItems({ customerId, stallId, paymentMethod, items }) {
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);
 
  try {
    await transaction.begin();
 
    // 1. Look up current prices for each (stallId, itemCode) - never trust client-sent prices
    const priced = [];
    for (const item of items) {
      const priceResult = await new sql.Request(transaction)
        .input("stallId", sql.Char(5), stallId)
        .input("itemCode", sql.Char(5), item.itemCode)
        .query(
          `SELECT ItemPrice FROM MenuItem WHERE StallID = @stallId AND ItemCode = @itemCode`
        );
 
      if (priceResult.recordset.length === 0) {
        throw new Error(`Menu item ${item.itemCode} does not exist for stall ${stallId}`);
      }
      priced.push({ ...item, unitPrice: priceResult.recordset[0].ItemPrice });
    }
 
    // 2. Generate the new OrderID and insert the CustOrder header
    const newOrderId = await generateNextId(transaction, "CustOrder", "OrderID", "OR", 3);
 
    await new sql.Request(transaction)
      .input("orderId", sql.Char(5), newOrderId)
      .input("customerId", sql.Char(5), customerId)
      .input("pmtType", sql.VarChar(20), paymentMethod)
      .query(
        `INSERT INTO CustOrder (OrderID, OrderDate, PmtType, CustomerID)
         VALUES (@orderId, GETDATE(), @pmtType, @customerId)`
      );
 
    // 3. Insert each OrderItem row (OrderItemNo increments per order, starting at 1)
    let orderItemNo = 1;
    for (const item of priced) {
      await new sql.Request(transaction)
        .input("orderId", sql.Char(5), newOrderId)
        .input("orderItemNo", sql.Int, orderItemNo)
        .input("stallId", sql.Char(5), stallId)
        .input("itemCode", sql.Char(5), item.itemCode)
        .input("quantity", sql.Int, item.quantity)
        .input("unitPrice", sql.SmallMoney, item.unitPrice)
        .query(
          `INSERT INTO OrderItem (OrderID, OrderItemNo, StallID, ItemCode, Quantity, UnitPrice)
           VALUES (@orderId, @orderItemNo, @stallId, @itemCode, @quantity, @unitPrice)`
        );
      orderItemNo++;
    }
 
    await transaction.commit();
    return getOrderById(newOrderId);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
 
/**
 * Fetch a single order with its items, stall, and computed total.
 * (CustOrder has no TotalAmount/StallID column, so both are derived from
 * OrderItem here.)
 */
async function getOrderById(orderId) {
  const pool = await sql.connect(dbConfig);
 
  const orderResult = await pool
    .request()
    .input("orderId", sql.Char(5), orderId)
    .query(`SELECT OrderID, OrderDate, PmtType, CustomerID FROM CustOrder WHERE OrderID = @orderId`);
 
  if (orderResult.recordset.length === 0) return null;
  const order = orderResult.recordset[0];
 
  const itemsResult = await pool
    .request()
    .input("orderId", sql.Char(5), orderId)
    .query(
      `SELECT oi.OrderItemNo, oi.StallID, fs.StallName, oi.ItemCode, mi.ItemDesc, oi.Quantity, oi.UnitPrice
       FROM OrderItem oi
       JOIN MenuItem mi ON mi.StallID = oi.StallID AND mi.ItemCode = oi.ItemCode
       JOIN FoodStall fs ON fs.StallID = oi.StallID
       WHERE oi.OrderID = @orderId
       ORDER BY oi.OrderItemNo`
    );
 
  const items = itemsResult.recordset.map((row) => ({
    itemCode: row.ItemCode,
    itemName: row.ItemDesc,
    quantity: row.Quantity,
    unitPrice: row.UnitPrice,
    subtotal: row.Quantity * row.UnitPrice
  }));
 
  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);
 
  return {
    orderId: order.OrderID,
    orderDate: order.OrderDate,
    paymentMethod: order.PmtType,
    customerId: order.CustomerID,
    stallId: itemsResult.recordset[0]?.StallID ?? null,
    stallName: itemsResult.recordset[0]?.StallName ?? null,
    totalAmount,
    items
  };
}
 
/**
 * SHMS-9: Get all orders (with items) for a given customer, most recent first.
 */
async function getOrderHistoryByCustomer(customerId) {
  const pool = await sql.connect(dbConfig);
 
  const ordersResult = await pool
    .request()
    .input("customerId", sql.Char(5), customerId)
    .query(
      `SELECT OrderID FROM CustOrder WHERE CustomerID = @customerId ORDER BY OrderDate DESC`
    );
 
  const orders = [];
  for (const row of ordersResult.recordset) {
    const full = await getOrderById(row.OrderID);
    if (full) orders.push(full);
  }
  return orders;
}
 
/**
 * Update an existing order's items (change quantities, add/remove items).
 * newItems = [{ itemCode, quantity }]  <- the FULL replacement list for this order
 *
 * We replace all OrderItem rows for this order rather than trying to
 * diff/patch individual rows, since it's simpler and less error-prone for
 * a class assignment. Runs in a transaction so it's all-or-nothing.
 */
async function updateOrderItems(orderId, newItems) {
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);
 
  try {
    await transaction.begin();
 
    // 1. Make sure the order actually exists first
    const existing = await new sql.Request(transaction)
      .input("orderId", sql.Char(5), orderId)
      .query("SELECT OrderID FROM CustOrder WHERE OrderID = @orderId");
 
    if (existing.recordset.length === 0) {
      throw new Error(`Order ${orderId} does not exist`);
    }
 
    // 2. Find the stall this order belongs to (all items share one stall)
    const stallLookup = await new sql.Request(transaction)
      .input("orderId", sql.Char(5), orderId)
      .query("SELECT TOP 1 StallID FROM OrderItem WHERE OrderID = @orderId");
 
    if (stallLookup.recordset.length === 0) {
      throw new Error(`Order ${orderId} has no existing items to determine its stall`);
    }
    const stallId = stallLookup.recordset[0].StallID;
 
    // 3. Look up current prices for the new item list (never trust client prices)
    const priced = [];
    for (const item of newItems) {
      const priceResult = await new sql.Request(transaction)
        .input("stallId", sql.Char(5), stallId)
        .input("itemCode", sql.Char(5), item.itemCode)
        .query("SELECT ItemPrice FROM MenuItem WHERE StallID = @stallId AND ItemCode = @itemCode");
 
      if (priceResult.recordset.length === 0) {
        throw new Error(`Menu item ${item.itemCode} does not exist for stall ${stallId}`);
      }
      priced.push({ ...item, unitPrice: priceResult.recordset[0].ItemPrice });
    }
 
    // 4. Delete all existing OrderItem rows for this order
    await new sql.Request(transaction)
      .input("orderId", sql.Char(5), orderId)
      .query("DELETE FROM OrderItem WHERE OrderID = @orderId");
 
    // 5. Re-insert the new item list
    let orderItemNo = 1;
    for (const item of priced) {
      await new sql.Request(transaction)
        .input("orderId", sql.Char(5), orderId)
        .input("orderItemNo", sql.Int, orderItemNo)
        .input("stallId", sql.Char(5), stallId)
        .input("itemCode", sql.Char(5), item.itemCode)
        .input("quantity", sql.Int, item.quantity)
        .input("unitPrice", sql.SmallMoney, item.unitPrice)
        .query(
          `INSERT INTO OrderItem (OrderID, OrderItemNo, StallID, ItemCode, Quantity, UnitPrice)
           VALUES (@orderId, @orderItemNo, @stallId, @itemCode, @quantity, @unitPrice)`
        );
      orderItemNo++;
    }
 
    await transaction.commit();
    return getOrderById(orderId);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
 
/**
 * Cancel (delete) an order and all its items.
 * This schema has no Status column on CustOrder, so "cancelling" here means
 * actually removing the order - this is the Delete in CRUD for this feature.
 */
async function cancelOrder(orderId) {
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);
 
  try {
    await transaction.begin();
 
    const existing = await new sql.Request(transaction)
      .input("orderId", sql.Char(5), orderId)
      .query("SELECT OrderID FROM CustOrder WHERE OrderID = @orderId");
 
    if (existing.recordset.length === 0) {
      throw new Error(`Order ${orderId} does not exist`);
    }
 
    // Children first (FK constraint), then the order itself
    await new sql.Request(transaction)
      .input("orderId", sql.Char(5), orderId)
      .query("DELETE FROM OrderItem WHERE OrderID = @orderId");
 
    await new sql.Request(transaction)
      .input("orderId", sql.Char(5), orderId)
      .query("DELETE FROM CustOrder WHERE OrderID = @orderId");
 
    await transaction.commit();
    return { orderId, cancelled: true };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
 
module.exports = {
  createOrderWithItems,
  getOrderHistoryByCustomer,
  getOrderById,
  updateOrderItems,
  cancelOrder
};
 