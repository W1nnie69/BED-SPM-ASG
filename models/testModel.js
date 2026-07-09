const sql = require("mssql");
const dbConfig = require("../dbConfig");

// Close connection safely
async function safeClose(connection) {
    if (!connection) return;
    try {
        await connection.close();
    } catch (err) {
        console.error("Error closing connection: ", err);
    }
}

// get all users
async function getAllUsers() {
    let connection;

    try {
        const operators = await getAllOperator();
        const stallowners = await getAllStallOwner();

        if ((!operators || operators.length == 0) || (!stallowners || stallowners.length == 0)) {
            throw new Error ("User's array null or empty");
        };

        const users = {
            "Operators": operators,
            "Stall Owners": stallowners
        };

        return users;

    } catch (error) {
        console.error("Error: ", error);
        throw error;

    } finally {
       safeClose(connection);
    }
}

// get a specific user
async function getUser(email) {
    let connection;

    try {
        connection = await sql.connect(dbConfig);
        const result = await connection.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM users WHERE email = @email');
        // return result.recordset;

        if (result.recordset.length > 0) {
            console.log(result);
            return true;

        } else {
            return false;
        }
        

    } catch (error) {
        console.error("DB error: ", error);
        throw error;

    } finally {
        safeClose(connection);
    }
}

async function getAllOperator() {
    let connection;

    try {
        connection = await sql.connect(dbConfig);
        const query = "SELECT * FROM Operator";
        const result = await connection.request().query(query);
        return result.recordset;

    } catch (error) {
        console.error("DB error: ", error);
        throw error;
    } finally {
        safeClose(connection);
    }
}

async function getAllStallOwner() {
    let connection;

    try {
        connection = await sql.connect(dbConfig);
        const query = "SELECT * FROM StallOwner";
        const result = await connection.request().query(query);
        return result.recordset;

    } catch (error) {
        console.error("DB error: ", error);
        throw error;
    } finally {
        safeClose(connection);
    }
}


module.exports = {
    getAllUsers,
    getUser,
    getAllOperator,
    getAllStallOwner,
}