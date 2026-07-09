// load .env stuff...
const dotenv = require("dotenv");
dotenv.config();

// modules
const express = require("express");
const sql = require("mssql")
const path = require("path");

// Controllers
const testController = require("./controllers/testController");

// create app
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(express.json());

// test routes
app.get("/", (req, res) => {
    res.send("Hi!");
})

app.get("/users", testController.getAllUsers);

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
})

app.get("/home", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'))
})

app.post("/api/login", testController.getUser);

app.get("/api/operator", testController.getAllOperator);

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

