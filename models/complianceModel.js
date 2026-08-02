const sql = require("mssql");
const dbConfig = require("../dbConfig");

/**
 * Same ID-generation approach as orderModel.js - this schema uses
 * hand-formatted string IDs (e.g. 'IN001') instead of IDENTITY columns.
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
 * SHMS-18: Record inspection results as NEA Officer.
 * Creates a new Inspection row plus any number of remark rows.
 * inspectionData = {
 *   officerId: 'O0001',
 *   stallId: 'ST001',
 *   hygieneGrade: 'A' | 'B' | 'C' | 'D',
 *   gradeExpiry: '2026-07-15' (date string, must be after today),
 *   remarks: ['Excellent cleanliness.', 'Minor issue with waste disposal.']
 * }
 * Note: this schema has no separate "score" column on Inspection - only
 * HygieneGrade, GradeExpiry, and free-text remarks - so the "score" the
 * assignment brief mentions is captured as the hygiene grade itself plus
 * the officer's written remarks.
 */
async function createInspection({ officerId, stallId, hygieneGrade, gradeExpiry, remarks }) {
  const pool = await sql.connect(dbConfig);
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // Confirm officer and stall both exist before inserting
    const officerCheck = await new sql.Request(transaction)
      .input("officerId", sql.Char(5), officerId)
      .query("SELECT OfficerID FROM NEA_Officer WHERE OfficerID = @officerId");
    if (officerCheck.recordset.length === 0) {
      throw new Error(`NEA Officer ${officerId} does not exist`);
    }

    const stallCheck = await new sql.Request(transaction)
      .input("stallId", sql.Char(5), stallId)
      .query("SELECT StallID FROM FoodStall WHERE StallID = @stallId");
    if (stallCheck.recordset.length === 0) {
      throw new Error(`Stall ${stallId} does not exist`);
    }

    const newInspectionId = await generateNextId(transaction, "Inspection", "InspectionID", "IN", 3);

    await new sql.Request(transaction)
      .input("inspectionId", sql.Char(5), newInspectionId)
      .input("hygieneGrade", sql.Char(1), hygieneGrade)
      .input("gradeExpiry", sql.Date, gradeExpiry)
      .input("officerId", sql.Char(5), officerId)
      .input("stallId", sql.Char(5), stallId)
      .query(
        `INSERT INTO Inspection (InspectionID, InspectionDate, HygieneGrade, GradeExpiry, OfficerID, StallID)
         VALUES (@inspectionId, GETDATE(), @hygieneGrade, @gradeExpiry, @officerId, @stallId)`
      );

    for (const remark of remarks || []) {
      await new sql.Request(transaction)
        .input("inspectionId", sql.Char(5), newInspectionId)
        .input("remark", sql.VarChar(1000), remark)
        .query(
          `INSERT INTO InspectionRemark (InspectionID, InspectionRemark) VALUES (@inspectionId, @remark)`
        );
    }

    await transaction.commit();
    return getInspectionById(newInspectionId);
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Fetch one inspection with its remarks (used after create, and for the
 * update/assign-grade lookup below).
 */
async function getInspectionById(inspectionId) {
  const pool = await sql.connect(dbConfig);

  const inspectionResult = await pool
    .request()
    .input("inspectionId", sql.Char(5), inspectionId)
    .query(
      `SELECT i.InspectionID, i.InspectionDate, i.HygieneGrade, i.GradeExpiry, i.OfficerID, i.StallID, fs.StallName
       FROM Inspection i
       JOIN FoodStall fs ON fs.StallID = i.StallID
       WHERE i.InspectionID = @inspectionId`
    );

  if (inspectionResult.recordset.length === 0) return null;
  const inspection = inspectionResult.recordset[0];

  const remarksResult = await pool
    .request()
    .input("inspectionId", sql.Char(5), inspectionId)
    .query("SELECT InspectionRemark FROM InspectionRemark WHERE InspectionID = @inspectionId");

  return {
    inspectionId: inspection.InspectionID,
    inspectionDate: inspection.InspectionDate,
    hygieneGrade: inspection.HygieneGrade,
    gradeExpiry: inspection.GradeExpiry,
    officerId: inspection.OfficerID,
    stallId: inspection.StallID,
    stallName: inspection.StallName,
    remarks: remarksResult.recordset.map((r) => r.InspectionRemark)
  };
}

/**
 * SHMS-19: Assign / update the hygiene grade on an existing inspection.
 * This is the Update operation - an NEA Officer revising the grade or
 * expiry date already recorded for a stall's inspection (e.g. after
 * review, or correcting a data entry error).
 */
async function updateHygieneGrade(inspectionId, { hygieneGrade, gradeExpiry }) {
  const pool = await sql.connect(dbConfig);

  const existing = await pool
    .request()
    .input("inspectionId", sql.Char(5), inspectionId)
    .query("SELECT InspectionID FROM Inspection WHERE InspectionID = @inspectionId");
  if (existing.recordset.length === 0) {
    throw new Error(`Inspection ${inspectionId} does not exist`);
  }

  await pool
    .request()
    .input("inspectionId", sql.Char(5), inspectionId)
    .input("hygieneGrade", sql.Char(1), hygieneGrade)
    .input("gradeExpiry", sql.Date, gradeExpiry)
    .query(
      `UPDATE Inspection SET HygieneGrade = @hygieneGrade, GradeExpiry = @gradeExpiry
       WHERE InspectionID = @inspectionId`
    );

  return getInspectionById(inspectionId);
}

/**
 * Get the hygiene grade history for a stall (most recent first) - useful
 * supporting endpoint for the front-end display and for testing.
 */
async function getHygieneHistoryByStall(stallId) {
  const pool = await sql.connect(dbConfig);
  const result = await pool
    .request()
    .input("stallId", sql.Char(5), stallId)
    .query(
      `SELECT InspectionID, InspectionDate, HygieneGrade, GradeExpiry, OfficerID
       FROM Inspection WHERE StallID = @stallId ORDER BY InspectionDate DESC`
    );
  return result.recordset;
}

/**
 * SHMS-20: View stall performance analytics as Operator.
 * Returns, for every stall under hawker centres owned by this operator:
 * total orders, total revenue, average feedback rating, complaint count,
 * and current (most recent, non-expired) hygiene grade.
 */
async function getStallPerformanceByOperator(operatorId) {
  const pool = await sql.connect(dbConfig);

  const operatorCheck = await pool
    .request()
    .input("operatorId", sql.Char(5), operatorId)
    .query("SELECT OperatorID FROM Operator WHERE OperatorID = @operatorId");
  if (operatorCheck.recordset.length === 0) {
    throw new Error(`Operator ${operatorId} does not exist`);
  }

  const result = await pool.request().input("operatorId", sql.Char(5), operatorId).query(`
    SELECT
      fs.StallID,
      fs.StallName,
      hc.HCName,
      ISNULL(orderStats.OrderCount, 0) AS OrderCount,
      ISNULL(orderStats.Revenue, 0) AS Revenue,
      ISNULL(fbStats.AvgRating, 0) AS AvgRating,
      ISNULL(fbStats.FeedbackCount, 0) AS FeedbackCount,
      ISNULL(compStats.ComplaintCount, 0) AS ComplaintCount,
      latestGrade.HygieneGrade AS CurrentHygieneGrade,
      latestGrade.GradeExpiry AS CurrentGradeExpiry
    FROM FoodStall fs
    JOIN HawkerCentre hc ON hc.HawkerCentreID = fs.HawkerCentreID
    LEFT JOIN (
      SELECT oi.StallID, COUNT(DISTINCT oi.OrderID) AS OrderCount, SUM(oi.Quantity * oi.UnitPrice) AS Revenue
      FROM OrderItem oi
      GROUP BY oi.StallID
    ) orderStats ON orderStats.StallID = fs.StallID
    LEFT JOIN (
      SELECT StallID, AVG(CAST(FbkRating AS FLOAT)) AS AvgRating, COUNT(*) AS FeedbackCount
      FROM Feedback
      GROUP BY StallID
    ) fbStats ON fbStats.StallID = fs.StallID
    LEFT JOIN (
      SELECT f.StallID, COUNT(*) AS ComplaintCount
      FROM Complaint c
      JOIN Feedback f ON f.FbkID = c.FbkID
      GROUP BY f.StallID
    ) compStats ON compStats.StallID = fs.StallID
    OUTER APPLY (
      SELECT TOP 1 i.HygieneGrade, i.GradeExpiry
      FROM Inspection i
      WHERE i.StallID = fs.StallID
      ORDER BY i.InspectionDate DESC
    ) latestGrade
    WHERE hc.OperatorID = @operatorId
    ORDER BY fs.StallName
  `);

  return result.recordset.map((row) => ({
    stallId: row.StallID,
    stallName: row.StallName,
    hawkerCentreName: row.HCName,
    orderCount: row.OrderCount,
    revenue: row.Revenue,
    avgRating: row.AvgRating ? Number(row.AvgRating.toFixed(2)) : null,
    feedbackCount: row.FeedbackCount,
    complaintCount: row.ComplaintCount,
    currentHygieneGrade: row.CurrentHygieneGrade,
    currentGradeExpiry: row.CurrentGradeExpiry
  }));
}

/**
 * Small read-only helpers so the front-end dropdowns have real data.
 * Not individually graded features on their own.
 */
async function getAllOfficers() {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().query("SELECT OfficerID, OfficerName FROM NEA_Officer ORDER BY OfficerName");
  return result.recordset;
}

async function getAllOperators() {
  const pool = await sql.connect(dbConfig);
  const result = await pool.request().query("SELECT OperatorID, OperatorName FROM Operator ORDER BY OperatorName");
  return result.recordset;
}

async function getAllStalls() {
  const pool = await sql.connect(dbConfig);
  const result = await pool
    .request()
    .query(
      `SELECT fs.StallID, fs.StallName, hc.HCName
       FROM FoodStall fs
       JOIN HawkerCentre hc ON hc.HawkerCentreID = fs.HawkerCentreID
       ORDER BY fs.StallName`
    );
  return result.recordset;
}

module.exports = {
  createInspection,
  getInspectionById,
  updateHygieneGrade,
  getHygieneHistoryByStall,
  getStallPerformanceByOperator,
  getAllOfficers,
  getAllOperators,
  getAllStalls
};
