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

module.exports = {
    getAllUsers
}