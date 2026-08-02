// load .env stuff...
const dotenv = require("dotenv");
dotenv.config();

// modules
const express = require("express");
const sql = require("mssql")
const path = require("path");


// Controllers
const userController = require("./controllers/userController");
const orderController = require("./controllers/orderController");
const menuController = require("./controllers/menuController");
const custEngagementController = require("./controllers/custEngagementController");
const complianceController = require("./controllers/complianceController");


// create app
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
const upload = require("./middlewares/upload");
const userMiddlewares = require("./middlewares/userMiddlewares");



// API ROUTES...

//=================================================== Dani's Routes ==============================================================
// app.get("/api/users", userController.getAllUsers);

// app.get("/api/user/byId/:id", userController.getUserById);

// app.get("/api/user/byEmail/:email", userController.getUserByEmail);

app.post("/api/user/forgot-password", userController.forgotPassword);

app.post("/api/user/reset-password", userController.resetPassword);

app.post("/api/login", userController.loginAuth);

app.get("/api/:userType/get-dashboard/:id", userMiddlewares.verifyToken, userMiddlewares.requireRole(['StallOwner', 'Operator']), userMiddlewares.checkIfUserQueryingMatchesID, userController.getDashboard);

app.get("/api/user/get-profile/:id", userMiddlewares.verifyToken, userMiddlewares.checkIfUserQueryingMatchesID, userController.getUserProfile);

app.put("/api/user/update-profile/:id", userMiddlewares.verifyToken, userMiddlewares.requireRole(['StallOwner', 'Operator', 'Customer', 'NeaOfficer']), userMiddlewares.checkIfUserQueryingMatchesID, userController.updateUserProfile);

app.put("/api/user/update-password/:id", userMiddlewares.verifyToken, userMiddlewares.requireRole(['StallOwner', 'Operator', 'Customer', 'NeaOfficer']), userMiddlewares.checkIfUserQueryingMatchesID, userController.updatePassword);

app.post("/api/:userType/signup", userController.registerUser);


//=================================================== Jeff's Routes ================================================================
// Get all liked food items for a customer
app.get('/api/likes/:customerId', userMiddlewares.verifyToken, custEngagementController.getLikedFoods);

// Route for liking a food item
app.post('/api/likes', userMiddlewares.verifyToken, custEngagementController.likeFood);

// Unlike a food item
app.delete('/api/likes', userMiddlewares.verifyToken, custEngagementController.unlikeFood);

// Get total like count for a food item
app.get('/api/likes/count/:stallId/:itemCode', custEngagementController.getLikeCount);

// Check if a customer has liked a food item
app.get('/api/likes/status/:customerId/:stallId/:itemCode', userMiddlewares.verifyToken, custEngagementController.hasLikedFood);

//Submit a rating and comment
app.post('/api/feedback', userMiddlewares.verifyToken, custEngagementController.addFeedback);

//Edit their rating and comment
app.put('/api/feedback/:fbkID', userMiddlewares.verifyToken, custEngagementController.updateFeedback);

//Delete their rating and comment
app.delete('/api/feedback/:fbkID', userMiddlewares.verifyToken, custEngagementController.deleteFeedback);

// Get average rating and number of ratings for a stall
app.get('/api/feedback/stall/:stallId', custEngagementController.getStallRating);


//=================================================== Shengle's Routes ===============================================================
app.get("/api/stall/:stallId/menu", menuController.getMenuByStall);
app.get("/api/stall/:stallId/owns", menuController.checkOwnership);

app.post("/api/stall/:stallId/menu", userMiddlewares.verifyToken, upload.single("photo"), menuController.addMenuItem);
app.put("/api/stall/:stallId/menu/:code", userMiddlewares.verifyToken, menuController.updateMenuItem);
app.delete("/api/stall/:stallId/menu/:code", userMiddlewares.verifyToken, menuController.deleteMenuItem);

app.get("/api/session", userController.getSessionStatus);

//=================================================== LiangChen's Routes ==============================================================
// ORDER ROUTES (SHMS-7, SHMS-9)
app.post("/api/order/create", userMiddlewares.verifyToken, orderController.createOrder);
app.get("/api/order/history/:customerId", userMiddlewares.verifyToken, orderController.getOrderHistory);
app.get("/api/order/byId/:orderId", userMiddlewares.verifyToken, orderController.getOrderDetail);
app.get("/api/order/customers", userMiddlewares.verifyToken, orderController.getCustomersForOrdering);

// MENU ROUTES (read-only helper for the order page)
app.get("/api/menu", menuController.getAllMenuItems);

// INSPECTION / HYGIENE / ANALYTICS ROUTES (SHMS-18, SHMS-19, SHMS-20)
app.post("/api/inspection/create", userMiddlewares.verifyToken, userMiddlewares.requireRole(['NeaOfficer']), complianceController.createInspection);
app.get("/api/inspection/byId/:inspectionId", userMiddlewares.verifyToken, userMiddlewares.requireRole(['NeaOfficer']), complianceController.getInspectionDetail);
app.put("/api/inspection/:inspectionId/grade", userMiddlewares.verifyToken, userMiddlewares.requireRole(['NeaOfficer']), complianceController.updateHygieneGrade);
app.get("/api/inspection/history/:stallId", userMiddlewares.verifyToken, userMiddlewares.requireRole(['NeaOfficer']), complianceController.getHygieneHistory);
app.get("/api/analytics/stall-performance/:operatorId", userMiddlewares.verifyToken, userMiddlewares.requireRole(['NeaOfficer']), complianceController.getStallPerformance);

app.get("/api/inspection/officers", userMiddlewares.verifyToken, complianceController.getOfficersList);
app.get("/api/inspection/operators", userMiddlewares.verifyToken, complianceController.getOperatorsList);
app.get("/api/inspection/stalls", userMiddlewares.verifyToken, complianceController.getStallsList);

//=================================================== WEBSITE ROUTES ==================================================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'index.html'));
})

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'login.html'));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'sign-up.html'));
});

app.get("/forgot-password", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'forgot-password.html'));
});

app.get("/reset-password", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'reset-password.html'));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'dashboard.html'));
});

app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'profile.html'));
});
app.get("/menu", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'menu-management.html'));
});
app.get("/order", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'order.html'));
});

app.get("/rating.html", (req, res) => {
    res.sendFile(path.join(__dirname, "public/html", "rating-comment.html"));
});

app.get("/inspection", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'inspection.html'));
});

app.get("/analytics", (req, res) => {
    res.sendFile(path.join(__dirname, 'public/html', 'analytics.html'));
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// start server
app.listen(port, async () => {
    console.log(`Server listening on port ${port}`);
});

// graceful shutdown
process.on("SIGINT", async () => {
    console.log("Server is gracefully shutting down.");
    await sql.close();
    console.log("DB connection closed.");
    process.exit(0);
});
