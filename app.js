// load .env stuff...
const dotenv = require("dotenv");
dotenv.config();

// modules
const express = require("express");
const sql = require("mssql")

// create app
const app = express();
const port = process.env.PORT || 3000;

// test route
app.get("/", (req, res) => {
    res.send("Hi!");
})

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

