const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "..", "uploads", "menu-items"));
    },
    filename: function (req, file, cb) {
        // e.g. ST001-IT099-1719999999999.jpg
        const { stallId, itemCode } = req.body.itemCode ? req.body : req.params;
        const ext = path.extname(file.originalname);
        const safeStallId = req.params.stallId || "stall";
        const safeItemCode = req.body.itemCode || "item";
        cb(null, `${safeStallId}-${safeItemCode}-${Date.now()}${ext}`);
    }
});

function fileFilter(req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only JPG, PNG, or WEBP images are allowed"));
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

module.exports = upload;
