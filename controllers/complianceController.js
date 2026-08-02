const complianceModel = require("../models/complianceModel");

const VALID_GRADES = ["A", "B", "C", "D"];

/**
 * POST /api/inspection/create
 * SHMS-18: Record inspection results as NEA Officer
 * body: { officerId, stallId, hygieneGrade, gradeExpiry, remarks: [string] }
 */
async function createInspection(req, res) {
  try {
    const { officerId, stallId, hygieneGrade, gradeExpiry, remarks } = req.body;

    if (!officerId || !stallId) {
      return res.status(400).json({ error: "officerId and stallId are required." });
    }
    if (!hygieneGrade || !VALID_GRADES.includes(hygieneGrade)) {
      return res.status(400).json({ error: `hygieneGrade must be one of: ${VALID_GRADES.join(", ")}` });
    }
    if (!gradeExpiry || isNaN(Date.parse(gradeExpiry))) {
      return res.status(400).json({ error: "gradeExpiry must be a valid date (e.g. 2026-07-15)." });
    }
    if (remarks && !Array.isArray(remarks)) {
      return res.status(400).json({ error: "remarks must be an array of strings if provided." });
    }

    const inspection = await complianceModel.createInspection({
      officerId,
      stallId,
      hygieneGrade,
      gradeExpiry,
      remarks: remarks || []
    });

    return res.status(201).json({ message: "Inspection recorded successfully", inspection });
  } catch (err) {
    console.error("createInspection error:", err.message);
    return res.status(500).json({ error: "Failed to record inspection.", details: err.message });
  }
}

/**
 * GET /api/inspection/byId/:inspectionId
 * Supporting endpoint to verify a single inspection (useful for testing/demo)
 */
async function getInspectionDetail(req, res) {
  try {
    const { inspectionId } = req.params;
    const inspection = await complianceModel.getInspectionById(inspectionId);
    if (!inspection) {
      return res.status(404).json({ error: `Inspection ${inspectionId} not found.` });
    }
    return res.status(200).json({ inspection });
  } catch (err) {
    console.error("getInspectionDetail error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve inspection.", details: err.message });
  }
}

/**
 * PUT /api/inspection/:inspectionId/grade
 * SHMS-19: Assign / update the hygiene grade on a stall's inspection as NEA Officer
 * body: { hygieneGrade, gradeExpiry }
 */
async function updateHygieneGrade(req, res) {
  try {
    const { inspectionId } = req.params;
    const { hygieneGrade, gradeExpiry } = req.body;

    if (!hygieneGrade || !VALID_GRADES.includes(hygieneGrade)) {
      return res.status(400).json({ error: `hygieneGrade must be one of: ${VALID_GRADES.join(", ")}` });
    }
    if (!gradeExpiry || isNaN(Date.parse(gradeExpiry))) {
      return res.status(400).json({ error: "gradeExpiry must be a valid date (e.g. 2026-07-15)." });
    }

    const updated = await complianceModel.updateHygieneGrade(inspectionId, { hygieneGrade, gradeExpiry });
    return res.status(200).json({ message: "Hygiene grade updated successfully", inspection: updated });
  } catch (err) {
    console.error("updateHygieneGrade error:", err.message);
    return res.status(500).json({ error: "Failed to update hygiene grade.", details: err.message });
  }
}

/**
 * GET /api/inspection/history/:stallId
 * Supporting endpoint - hygiene grade history for one stall
 */
async function getHygieneHistory(req, res) {
  try {
    const { stallId } = req.params;
    const history = await complianceModel.getHygieneHistoryByStall(stallId);
    return res.status(200).json({ history });
  } catch (err) {
    console.error("getHygieneHistory error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve hygiene history.", details: err.message });
  }
}

/**
 * GET /api/analytics/stall-performance/:operatorId
 * SHMS-20: View stall performance analytics as Operator
 */
async function getStallPerformance(req, res) {
  try {
    const { operatorId } = req.params;
    if (!operatorId) {
      return res.status(400).json({ error: "operatorId is required." });
    }

    const performance = await complianceModel.getStallPerformanceByOperator(operatorId);
    return res.status(200).json({ stalls: performance });
  } catch (err) {
    console.error("getStallPerformance error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve stall performance.", details: err.message });
  }
}

/**
 * GET /api/inspection/officers
 * GET /api/inspection/operators
 * GET /api/inspection/stalls
 * Small read-only helpers for front-end dropdowns.
 */
async function getOfficersList(req, res) {
  try {
    const officers = await complianceModel.getAllOfficers();
    return res.status(200).json({ officers });
  } catch (err) {
    console.error("getOfficersList error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve officers.", details: err.message });
  }
}

async function getOperatorsList(req, res) {
  try {
    const operators = await complianceModel.getAllOperators();
    return res.status(200).json({ operators });
  } catch (err) {
    console.error("getOperatorsList error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve operators.", details: err.message });
  }
}

async function getStallsList(req, res) {
  try {
    const stalls = await complianceModel.getAllStalls();
    return res.status(200).json({ stalls });
  } catch (err) {
    console.error("getStallsList error:", err.message);
    return res.status(500).json({ error: "Failed to retrieve stalls.", details: err.message });
  }
}

module.exports = {
  createInspection,
  getInspectionDetail,
  updateHygieneGrade,
  getHygieneHistory,
  getStallPerformance,
  getOfficersList,
  getOperatorsList,
  getStallsList
};