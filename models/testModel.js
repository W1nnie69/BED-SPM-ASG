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
async function getUser(id) {
    let connection;

    try {
        connection = await sql.connect(dbConfig);

        // Check StallOwner
        const result = await connection.request()
            .input('id', sql.VarChar, id)
            .query('SELECT * FROM StallOwner WHERE OwnerID = @id');

        if (result.recordset.length > 0) {
            console.log(result);
            return result.recordset[0];

        } else {
            // Check Operator
            const result2 = await connection.request()
                .input('id', sql.VarChar, id)
                .query('SELECT * FROM Operator WHERE OperatorID = @id');

            if (result2.recordset.length > 0) {
                console.log(result2);  
                return result2.recordset[0];
            
            } else {
                console.error("testModel: No user found")
                return;
            }
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