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

        if ((!operators || operators.length === 0) || (!stallowners || stallowners.length === 0)) {
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
async function getUserById(id) {
    let connection;

    try {
        connection = await sql.connect(dbConfig);

        // Check StallOwner
        const result = await connection.request()
            .input('id', sql.VarChar, id)
            .query('SELECT * FROM StallOwner WHERE OwnerID = @id');

        if (result.recordset.length > 0) {
            // console.log(result);
            return { result, "userType": "StallOwner" };

        } else {
            // Check Operator
            const result = await connection.request()
                .input('id', sql.VarChar, id)
                .query('SELECT * FROM Operator WHERE OperatorID = @id');

            if (result.recordset.length > 0) {
                // console.log(result2);  
                return { result, "userType": "Operator" };
            
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

async function getUserByUsername(username) {
    let connection;

    try {
        connection = await sql.connect(dbConfig);

        // Check StallOwner
        const result = await connection.request()
            .input('username', sql.VarChar, username)
            .query('SELECT * FROM StallOwner WHERE Username = @username');

        if (result.recordset.length > 0) {
            // console.log(result);
            return { result, "userType": "StallOwner" };

        } else {
            // Check Operator
            const result = await connection.request()
                .input('username', sql.VarChar, username)
                .query('SELECT * FROM Operator WHERE Username = @username');

            if (result.recordset.length > 0) {
                // console.log(result2);  
                return { result, "userType": "Operator" };
            
            } else {
                console.error("testModel: No user found");
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
        console.error("DB error: ", error.stack);
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
        console.error("DB error: ", error.stack);
        throw error;
    } finally {
        safeClose(connection);
    }
}

async function updatePassword(loginDetails) {
    let connection;
    const { id, hashedPassword } = loginDetails;

    const configTable = {
        StallOwner: { table: 'StallOwner', idColumn: 'OwnerID' },
        Operator: { table: 'Operator', idColumn: 'OperatorID' }
    };

    try {
        // Find user row first.
        // check in stall owner table first
        const result = await getUserById(id);

        if (result.result.recordset.length > 0) {
            // update password
            console.log("User found: ", result.result.recordset[0]);
            
            // Checks whether is userType is a valid table name
            const config = configTable[result.userType];
            if (!config) {
                throw new Error("Invalid user type!");
            }
            
            connection = await sql.connect(dbConfig);

            const query = `UPDATE ${config.table} SET Password = @hashedPassword WHERE ${config.idColumn} = @id`

            const result2 = await connection.request()
                .input('id', sql.VarChar, id)
                .input('hashedPassword', sql.VarChar, hashedPassword)
                .query(query);

            return true;

        } else {
            console.log("User not found");
            return false;
        }
    
    } catch (err) {
        console.error("Model error: " + err.stack);
        throw err;

    } finally {
        safeClose();
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    getUserByUsername,
    getAllOperator,
    getAllStallOwner,
    updatePassword
}