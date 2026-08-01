// load .env stuff...
const dotenv = require("dotenv");
dotenv.config();

// modules
const express = require("express");
const session = require("express-session");
const sql = require("mssql")
const path = require("path");

// Controllers
const userController = require("./controllers/userController");
const orderController = require("./controllers/orderController");
const menuController = require("./controllers/menuController");
const custEngagementController = require("./controllers/custEngagementController");


// create app
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
const userMiddlewares = require("./middlewares/userMiddlewares");


// test routes
app.get("/", (req, res) => {
    res.redirect("https://www.youtube.com/watch?v=DLzxrzFCyOs");
})

// API ROUTES...

//=================================================== Dani's Routes ==============================================================
app.get("/api/users", userController.getAllUsers);

// app.get("/api/user/byId/:id", userController.getUserById);

// app.get("/api/user/byEmail/:email", userController.getUserByEmail);

app.post("/api/user/forgot-password", userController.forgotPassword);

app.post("/api/user/reset-password", userController.resetPassword);

app.post("/api/login", userController.loginAuth);

app.get("/api/:userType/get-dashboard/:id", userMiddlewares.verifyToken, userMiddlewares.requireRole(['StallOwner', 'Operator']), userMiddlewares.checkIfUserQueryingMatchesID, userController.getDashboard);

app.get("/api/user/get-profile/:id", userMiddlewares.verifyToken, userMiddlewares.checkIfUserQueryingMatchesID, userController.getUserProfile);

app.put("/api/user/update-profile/:id", userMiddlewares.verifyToken, userMiddlewares.requireRole(['StallOwner', 'Operator']), userMiddlewares.checkIfUserQueryingMatchesID, userController.updateUserProfile);

app.put("/api/user/update-password/:id", userController.updatePassword);

app.post("/api/:userType/signup", userController.registerUser);


//=================================================== Jeff's Routes ================================================================
// Get all liked food items for a customer
app.get('/likes/:customerId', custEngagementController.getLikedFoods);

// Route for liking a food item
app.post('/likes', custEngagementController.likeFood);

// Unlike a food item
app.delete('/likes', custEngagementController.unlikeFood);

//reset password not fully implemented yet on the frontend
// app.put("/api/user/updatepass/:id", userController.updatePassword); 

//=================================================== Shengle's Routes ===============================================================
app.get("/api/stall/:stallId/menu", menuController.getMenuByStall);

app.post("/api/stall/:stallId/menu", menuController.addMenuItem);

app.put("/api/stall/:stallId/menu/:code", menuController.updateMenuItem);

app.delete("/api/stall/:stallId/menu/:code", menuController.deleteMenuItem);

//=================================================== LiangChen's Routes ==============================================================
// ORDER ROUTES (SHMS-7, SHMS-9)
app.post("/api/order/create", orderController.createOrder);
app.get("/api/order/history/:customerId", orderController.getOrderHistory);
app.get("/api/order/byId/:orderId", orderController.getOrderDetail);
app.get("/api/order/customers", orderController.getCustomersForOrdering);

// MENU ROUTES (read-only helper for the order page)
app.get("/api/menu", menuController.getAllMenuItems);

//=================================================== WEBSITE ROUTES ==================================================================
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get("/sign-up", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'sign-up.html'));
});

app.get("/forgot-password", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

app.get("/reset-password", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get("/profile", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get("/menu", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'menu.html'));
});

app.get("/order", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'order.html'));
});


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
