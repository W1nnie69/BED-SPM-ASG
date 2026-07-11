// load .env stuff...
const dotenv = require("dotenv");
dotenv.config();

// modules
const express = require("express");
const session = require("express-session");
const sql = require("mssql")
const path = require("path");

// Controllers
const testController = require("./controllers/testController");

// create app
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2 // session lasts 2 hours
  }
}));

// test routes
app.get("/", (req, res) => {
    res.send("Hi!");
})

// API ROUTES
app.get("/api/users", testController.getAllUsers);

app.get("/api/user/byId/:id", testController.getUserById);

app.get("/api/user/byEmail/:email", testController.getUserByEmail);

//reset password not fully implemented yet on the frontend
app.put("/api/user/updatepass/:id", testController.updatePassword);

app.post("/api/login", testController.loginAuth);

app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "Logged out"});
    });
});

// TEST API ROUTES
app.get("/api/operator", testController.getAllOperator);

app.get("/api/stallowner", testController.getAllStallOwner);

// WEBSITE ROUTES
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get("/signup", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get("/forgot-password", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

app.get("/reset-password", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

app.get("/dash", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
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

