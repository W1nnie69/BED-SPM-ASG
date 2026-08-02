const sql = require("mssql");
const dbConfig = require("../dbConfig");

const poolPromise = sql.connect(dbConfig);

// getAllUsers couldve been done with a single sql query but im too stoopid(lazy) for advance sql stuff...
// get all users...
// async function getAllUsers() {
//     try {
//         const operators = await getAllOperator();
//         const stallowners = await getAllStallOwner();

//         if ((!operators || operators.length === 0) || (!stallowners || stallowners.length === 0)) {
//             throw new Error ("User's array null or empty");
//         };

//         const users = {
//             "Operators": operators,
//             "Stall Owners": stallowners
//         };

//         return users;

//     } catch (error) {
//         console.error("Error: ", error);
//         throw error;

//     } finally {
//        safeClose(connection);
//     }
// }

// get a specific user by using its id
async function getUserById(id) {
   const pool = await poolPromise;

    let tableName;
    let columnName;

    if (id.startsWith("OW")) {
        tableName = "StallOwner";
        columnName = "OwnerID";

    } else if (id.startsWith("OP")) {
        tableName = "Operator";
        columnName = "OperatorID";

    } else if (id.startsWith("C")) {
        tableName = "Customer";
        columnName = "CustomerID";

    } else if (id.startsWith("O")) {
        tableName = "NeaOfficer";
        columnName = "OfficerID";
    }

    try {
        let query = `SELECT * FROM ${tableName} WHERE ${columnName} = @id`
        // Check StallOwner
        const result = await pool.request()
            .input('id', sql.VarChar, id)
            .query(query);

        if (result.recordset.length > 0) {
            // console.log(result);
            let data = result.recordset[0];
            data.userType = tableName;
            return data;
        }
        
    } catch (error) {
        console.error("DB error: ", error);
        throw error;

    }
}

// get a specific user by their email
async function getUserByEmail(email) {
    const pool = await poolPromise;
    
    try {
        // Check StallOwner  
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM StallOwner WHERE Email = @email');

        if (result.recordset.length > 0) {
            // console.log(result);
            let data = result.recordset[0];
            data.userType = "StallOwner";
            console.log(data);
            
            return data;

        } else {
            // Check Operator
            const result = await pool.request()
                .input('email', sql.VarChar, email)
                .query('SELECT * FROM Operator WHERE Email = @email');

            if (result.recordset.length > 0) {
                // console.log(result2);  
                let data = result.recordset[0];
                data.userType = "Operator";
                console.log(data);

                return data;
            
            } else {
                // Check Customer
                const result = await pool.request()
                    .input('email', sql.VarChar, email)
                    .query('SELECT * FROM Customer WHERE CustEmail = @email');

                if (result.recordset.length > 0) {
                    // console.log(result2);  
                    let data = result.recordset[0];
                    data.userType = "Customer";
                    console.log(data);

                    return data;

                } else {
                    // Check NeaOfficer
                    const result = await pool.request()
                        .input('email', sql.VarChar, email)
                        .query('SELECT * FROM NeaOfficer WHERE Email = @email');

                    if (result.recordset.length > 0) {
                        // console.log(result2);  
                        let data = result.recordset[0];
                        data.userType = "NeaOfficer";
                        console.log(data);

                        return data;

                    } else {
                        console.error("testModel: No user found");
                        return; 
                    }
                }
            }
        }
        
    } catch (error) {
        console.error("DB error: ", error);
        throw error;

    }
}

// used for getAllUsers
// async function getAllOperator() {
//     const pool = await poolPromise;

//     try {
//         const query = "SELECT * FROM Operator";
//         const result = await pool.request().query(query);
//         return result.recordset;

//     } catch (error) {
//         console.error("DB error: ", error.stack);
//         throw error;
//     } finally {
//         safeClose(connection);
//     }
// }

// // used for getAllUsers
// async function getAllStallOwner() {
//     const pool = await poolPromise;

//     try {
//         const query = "SELECT * FROM StallOwner";
//         const result = await connection.request().query(query);
//         return result.recordset;

//     } catch (error) {
//         console.error("DB error: ", error.stack);
//         throw error;
//     } finally {
//         safeClose(connection);
//     }
// }

async function updatePassword(id, hashedPassword) {
    const pool = await poolPromise;

    const configTable = {
        StallOwner: { table: 'StallOwner', idColumn: 'OwnerID' },
        Operator: { table: 'Operator', idColumn: 'OperatorID' },
        Customer: { table: 'Customer', idColumn: 'CustomerID' }
    };

    try {
        // Find user row first.
        // check in stall owner table first
        
        const result = await getUserById(id); 
                                                  
        if (result) {                                             
            // update password                                                               
            console.log("User found: ", result);                          
                                                                                             
            // Checks whether is userType is a valid table name                                 
            // This is done to prevent sql injections as im using string interpolation below,    
            // for the table name and column name.                                              
            const config = configTable[result.userType];                                       
            if (!config) {
                throw new Error("Invalid user type!");
            }
            
        // =====================================================================================================

            const query = `UPDATE ${config.table} SET Password = @hashedPassword WHERE ${config.idColumn} = @id`

            const result2 = await pool.request()
                .input('id', sql.VarChar, id)
                .input('hashedPassword', sql.VarChar, hashedPassword)
                .query(query);

            if (result2.rowsAffected[0] === 0) {
                throw new Error("No matching user found to update.")
            }
            return true;

        } else {
            console.log("User not found");
            return false;
        }
    
    } catch (err) {
        console.error("Model error: " + err.stack);
        throw err;

    }
}

async function updateUserProfile(id, userNewData) {
    const pool = await poolPromise;
    let tableName;
    let idColumn;
    let nameColumn;
    let contactColumn;
    let contactType;

    // FOR req.body
    let name;
    let email;
    let contact;

    
    //Check user type from ID...
    // Why didnt i do this before...
    if (id.startsWith("OW")) {
        //Stall owner
        tableName = "StallOwner";
        idColumn = "OwnerID";
        nameColumn = "OwnerName";
        contactColumn = "OwnerContactNo";
        contactType = sql.Char(8);
        ({ name, email, contact } = { name: userNewData.name, email: userNewData.email, contact: userNewData.contactNo });

    } else if (id.startsWith("OP")) {
        //Operator
        tableName = "Operator";
        idColumn = "OperatorID";
        nameColumn = "OperatorName";
        contactColumn = "ContactPerson";
        contactType = sql.VarChar(50);
        ({ name, email, contact } = { name: userNewData.name, email: userNewData.email, contact: userNewData.contactPerson });

    } else if (id.startsWith("C")) {
        //Operator
        tableName = "Customer";
        idColumn = "CustomerID";
        nameColumn = "CustName";
        contactColumn = "CustContactNo";
        contactType = sql.VarChar(50);
        ({ name, email, contact } = { name: userNewData.name, email: userNewData.email, contact: userNewData.contactPerson });

    }

    if (!tableName) {
        throw new Error(`Unrecognized ID format: ${id}`);
    }

    try {
        const query = `
        UPDATE ${tableName} '
        SET 
            ${nameColumn} = @name,
            Email = @email,
            ${contactColumn} = @contact
        WHERE ${idColumn} = @id;`

        const result = await pool.request()
            .input('id', sql.VarChar, id)
            .input('name', sql.VarChar, name)
            .input('email', sql.VarChar, email)
            .input('contact', contactType, contact)
            .query(query);

        if (result.rowsAffected[0] === 0) {
            throw new Error("No matching user found to update");
        }

        return true;

    } catch (err) {
        console.error("Model error: " + err.stack);
        throw err;
        return false;

    }
}

async function signUpUser(userData) {
    const pool = await poolPromise;
    let query;
    let incrementQuery;
    let idColumnName;
    let idStartsWith;
    let queryResult;

    switch (userData.userType) {
        case "StallOwner":
            idStartsWith = "OW";
            idColumnName = "OwnerID";
            query = `
                INSERT INTO StallOwner (OwnerID, OwnerName, OwnerNRIC, OwnerContactNo, Email, Password)
                VALUES (@OwnerID, @OwnerName, @OwnerNRIC, @OwnerContactNo, @Email, @Password);
            `;

            incrementQuery = `
                SELECT TOP 1 OwnerID FROM StallOwner ORDER BY OwnerID DESC;
            `;

        break;

        case "Operator":
            idStartsWith = "OP";
            idColumnName = "OperatorID";
            query = `
                INSERT INTO Operator (OperatorID, OperatorName, ContactPerson, Email, Password)
                VALUES (@OperatorID, @OperatorName, @ContactPerson, @Email, @Password);
            `;

            incrementQuery = `
                SELECT TOP 1 OperatorID FROM Operator ORDER BY OperatorID DESC;
            `;

        break;

        case "Customer":
            idStartsWith = "C0";
            idColumnName = "CustomerID";
            query = `
                INSERT INTO Customer (CustomerID, CustName, CustContactNo, CustEmail, Password)
                VALUES (@CustomerID, @CustName, @CustContactNo, @CustEmail, @Password);
            `;

            incrementQuery = `
                SELECT TOP 1 CustomerID FROM Customer ORDER BY CustomerID DESC;
            `;
        
        break;
    }

    try {
        const incrementQueryResult = await connection.request().query(incrementQuery);    

        let nextNumber = 1;
        if (incrementQueryResult.recordset.length > 0) {
            const lastId = incrementQueryResult.recordset[0][idColumnName]; // e.g. "OW014"
            const lastNumber = parseInt(lastId.substring(2), 10); // "014" -> 14
            nextNumber = lastNumber + 1;
            console.log("Next id is: ", nextNumber);
        }

        const newUserId = idStartsWith + String(nextNumber).padStart(3, '0');

        switch (userData.userType) {
            case "StallOwner":
                queryResult = await pool.request()
                                .input('OwnerID', sql.Char(5), newUserId)
                                .input('OwnerName', sql.VarChar, userData.name)
                                .input('OwnerNRIC', sql.Char(9), userData.nric)
                                .input('OwnerContactNo', sql.Char(8), userData.contactNo)
                                .input('Email', sql.VarChar, userData.email)
                                .input('Password', sql.VarChar, userData.password)
                                .query(query);

                break;

            case "Operator":
                queryResult = await pool.request()
                                .input('OperatorID', sql.Char(5), newUserId)
                                .input('OperatorName', sql.VarChar, userData.name)
                                .input('ContactPerson', sql.VarChar, userData.contactPerson)
                                .input('Email', sql.VarChar, userData.email)
                                .input('Password', sql.VarChar, userData.password)
                                .query(query);

                break;

            case "Customer":
                queryResult = await pool.request()
                                .input('CustomerID', sql.Char(5), newUserId)
                                .input('CustName', sql.VarChar, userData.name)
                                .input('CustContactNo', sql.Char(8), userData.contactNo)
                                .input('CustEmail', sql.VarChar, userData.email)
                                .input('Password', sql.VarChar, userData.password)
                                .query(query);

                break;
        }

        return true;
        
    } catch (err) {
        console.error("Model error: " + err.stack);
        return false;

    }
}

async function getStallOwnerDashboard(OwnerId) {
    const pool = await poolPromise;

    const dashboardQuery = `
        SELECT OwnerID, OwnerName
        FROM StallOwner
        WHERE OwnerID = @OwnerID;

        SELECT 
            fs.StallID, fs.StallName, fs.StallUnitNo, hc.HCName,
            ra.RentalPrice, ra.AgrStartDate, ra.AgrEndDate, latest.HygieneGrade
        FROM RentalAgreement ra
        JOIN FoodStall fs ON fs.StallID = ra.StallID
        JOIN HawkerCentre hc ON hc.HawkerCentreID = fs.HawkerCentreID
        OUTER APPLY (
            SELECT TOP 1 i.HygieneGrade
            FROM Inspection i
            WHERE i.StallID = fs.StallID
            ORDER BY i.InspectionDate DESC
        ) latest
        WHERE ra.OwnerID = @OwnerID;

        SELECT mi.StallID, mi.ItemCode, mi.ItemDesc, mi.ItemCategory, mi.ItemPrice
        FROM MenuItem mi
        WHERE mi.StallID IN (SELECT StallID FROM RentalAgreement WHERE OwnerID = @OwnerID);

        SELECT f.FbkID, f.CustomerID, f.FbkDateTime, f.FbkRating, f.FbkComment, f.StallID
        FROM Feedback f
        WHERE f.StallID IN (SELECT StallID FROM RentalAgreement WHERE OwnerID = @OwnerID)
        ORDER BY f.FbkDateTime DESC;

        SELECT p.PromoID, p.PromoDesc, p.PromoStartDate, p.PromoEndDate, p.StallID
        FROM Promotion p
        WHERE p.StallID IN (SELECT StallID FROM RentalAgreement WHERE OwnerID = @OwnerID)
        ORDER BY p.PromoStartDate DESC;

        SELECT 
            i.InspectionID, i.InspectionDate, i.HygieneGrade, i.OfficerID, i.StallID,
            STRING_AGG(ir.InspectionRemark, ' | ') AS Remarks
        FROM Inspection i
        LEFT JOIN InspectionRemark ir ON ir.InspectionID = i.InspectionID
        WHERE i.StallID IN (SELECT StallID FROM RentalAgreement WHERE OwnerID = @OwnerID)
        GROUP BY i.InspectionID, i.InspectionDate, i.HygieneGrade, i.OfficerID, i.StallID
        ORDER BY i.InspectionDate DESC;

        SELECT
            (SELECT COUNT(*) FROM RentalAgreement WHERE OwnerID = @OwnerID) AS stallCount,
            (SELECT AVG(CAST(FbkRating AS FLOAT)) 
            FROM Feedback 
            WHERE StallID IN (SELECT StallID FROM RentalAgreement WHERE OwnerID = @OwnerID)) AS avgRating,
            (SELECT COUNT(*) 
            FROM Promotion 
            WHERE StallID IN (SELECT StallID FROM RentalAgreement WHERE OwnerID = @OwnerID)
                AND GETDATE() BETWEEN PromoStartDate AND PromoEndDate) AS activePromotions;
        `;

    try {
        const result = await pool.request()
        .input('OwnerID', sql.Char(5), OwnerId)
        .query(dashboardQuery);

        console.log(result);
        if (result.recordsets.length > 0) {
            return result;
        }

    } catch (error) {
        console.error("DB error: ", error.stack);
        throw error;
    }
}

async function getOperatorDashboard(OperatorId) {
    const pool = await poolPromise;

    const dashboardQuery = `
        SELECT OperatorID, OperatorName
        FROM Operator
        WHERE OperatorID = @OperatorID;

        SELECT
            hc.HawkerCentreID, hc.HCName, hc.HCAddress,
            COUNT(fs.StallID) AS StallCount
        FROM HawkerCentre hc
        LEFT JOIN FoodStall fs ON fs.HawkerCentreID = hc.HawkerCentreID
        WHERE hc.OperatorID = @OperatorID
        GROUP BY hc.HawkerCentreID, hc.HCName, hc.HCAddress;

        SELECT
            fs.StallID, fs.StallName, hc.HCName,
            owner_info.OwnerName, owner_info.AgrStartDate, owner_info.AgrEndDate,
            latest_grade.HygieneGrade
        FROM FoodStall fs
        JOIN HawkerCentre hc ON hc.HawkerCentreID = fs.HawkerCentreID
        OUTER APPLY (
            SELECT TOP 1 so.OwnerName, ra.AgrStartDate, ra.AgrEndDate
            FROM RentalAgreement ra
            JOIN StallOwner so ON so.OwnerID = ra.OwnerID
            WHERE ra.StallID = fs.StallID
            ORDER BY ra.AgrEndDate DESC
        ) owner_info
        OUTER APPLY (
            SELECT TOP 1 i.HygieneGrade
            FROM Inspection i
            WHERE i.StallID = fs.StallID
            ORDER BY i.InspectionDate DESC
        ) latest_grade
        WHERE hc.OperatorID = @OperatorID;

        SELECT
            fs.StallName, c.Category, f.FbkComment, f.FbkDateTime
        FROM Complaint c
        JOIN Feedback f ON f.FbkID = c.FbkID
        JOIN FoodStall fs ON fs.StallID = f.StallID
        JOIN HawkerCentre hc ON hc.HawkerCentreID = fs.HawkerCentreID
        WHERE hc.OperatorID = @OperatorID
        ORDER BY f.FbkDateTime DESC;

        SELECT
            fs.StallName, i.InspectionDate, i.OfficerID, i.HygieneGrade
        FROM Inspection i
        JOIN FoodStall fs ON fs.StallID = i.StallID
        JOIN HawkerCentre hc ON hc.HawkerCentreID = fs.HawkerCentreID
        WHERE hc.OperatorID = @OperatorID
        ORDER BY i.InspectionDate DESC;

        SELECT
            (SELECT COUNT(*) FROM HawkerCentre WHERE OperatorID = @OperatorID) AS hawkerCentreCount,
            (SELECT COUNT(*)
             FROM FoodStall fs
             JOIN HawkerCentre hc ON hc.HawkerCentreID = fs.HawkerCentreID
             WHERE hc.OperatorID = @OperatorID) AS stallCount,
            (SELECT COUNT(*)
             FROM Complaint c
             JOIN Feedback f ON f.FbkID = c.FbkID
             JOIN FoodStall fs ON fs.StallID = f.StallID
             JOIN HawkerCentre hc ON hc.HawkerCentreID = fs.HawkerCentreID
             WHERE hc.OperatorID = @OperatorID) AS activeComplaints,
            (
                SELECT
                    CASE ROUND(AVG(CASE i.HygieneGrade
                        WHEN 'A' THEN 4.0
                        WHEN 'B' THEN 3.0
                        WHEN 'C' THEN 2.0
                        WHEN 'D' THEN 1.0
                    END), 0)
                        WHEN 4 THEN 'A'
                        WHEN 3 THEN 'B'
                        WHEN 2 THEN 'C'
                        WHEN 1 THEN 'D'
                    END
                FROM (
                    SELECT i.StallID, i.HygieneGrade,
                           ROW_NUMBER() OVER (PARTITION BY i.StallID ORDER BY i.InspectionDate DESC) AS rn
                    FROM Inspection i
                    JOIN FoodStall fs ON fs.StallID = i.StallID
                    JOIN HawkerCentre hc ON hc.HawkerCentreID = fs.HawkerCentreID
                    WHERE hc.OperatorID = @OperatorID
                ) i
                WHERE i.rn = 1
            ) AS avgHygieneScore;
        `;

    try {
        const result = await pool.request()
        .input('OperatorID', sql.Char(5), OperatorId)
        .query(dashboardQuery);

        console.log(result);
        if (result.recordset.length > 0) {
            return result;
        }

    } catch (error) {
        console.error("DB error: ", error.stack);
        throw error;
    }
}

module.exports = {
    getUserById,
    getUserByEmail,
    updatePassword,
    getStallOwnerDashboard,
    getOperatorDashboard,
    updateUserProfile,
    signUpUser
}