// load .env stuff...
const dotenv = require("dotenv");
dotenv.config();

// modules
const express = require("express");
const session = require("express-session");
const sql = require("mssql")
const path = require("path");

// Controllers
const uamController = require("./controllers/uamController");

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
    res.redirect("https://www.youtube.com/watch?v=DLzxrzFCyOs");
})

// API ROUTES
app.get("/api/users", uamController.getAllUsers);

app.get("/api/user/byId/:id", uamController.getUserById);

app.get("/api/user/byEmail/:email", uamController.getUserByEmail);

//reset password not fully implemented yet on the frontend
app.put("/api/user/updatepass/:id", uamController.updatePassword);

app.post("/api/login", uamController.loginAuth);

app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "Logged out"});
    });
});

// TEST API ROUTES
app.get("/api/operator", uamController.getAllOperator);

app.get("/api/stallowner", uamController.getAllStallOwner);

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

