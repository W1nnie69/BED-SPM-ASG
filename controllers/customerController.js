const { sql, getPool } = require('../config/db');

/**
 * GET /api/customers
 * Read-only helper so the front-end can simulate "logging in" as a customer.
 * NOTE: full account management (register/update) belongs to whichever
 * teammate owns the User Account feature - this is intentionally read-only.
 */
async function getAllCustomers(req, res) {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query('SELECT CustomerID, Name, Email FROM Customer ORDER BY Name');

    return res.status(200).json({ customers: result.recordset });
  } catch (err) {
    console.error('getAllCustomers error:', err.message);
    return res.status(500).json({ error: 'Failed to retrieve customers.', details: err.message });
  }
}

module.exports = { getAllCustomers };