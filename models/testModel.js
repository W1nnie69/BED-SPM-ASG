const sql = require("mssql");
const dbConfig = require("../dbConfig");

// get all users
async function getAllUsers() {
    let connection;

    try {
        connection = await sql.connect(dbConfig);
        const query = "SELECT * FROM users";
        const result = await connection.request().query(query);
        return result.recordset;

    } catch (error) {
        console.error("DB error: ", error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.close();

            } catch (err) {
                console.error("Error closing connection: ", err);
            }
        }
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
        if (connection) {
            try {
                await connection.close();

            } catch (err) {
                console.error("Error closing connection: ", err);
            }
        }
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
        if (connection) {
            try {
                await connection.close();

            } catch (err) {
                console.error("Error closing connection: ", err);
            }
        }
    }
}


module.exports = {
    getAllUsers,
    getUser,
    getAllOperator
}