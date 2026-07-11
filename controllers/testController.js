const testModel = require("../models/testModel");
const bcrypt = require('bcrypt');

async function getAllUsers(req, res) {
    try {
        const users = await testModel.getAllUsers();
        res.json(users);

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving users"});
    }
}

async function getUserById(req, res) {
    try {
        const id = req.params.id;

        const user = await testModel.getUserById(id);

        if(!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
        
    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving user"});
    }
}

async function getUserByEmail(req, res) {
    try {
        const email = req.params.email;

        const user = await testModel.getUserByEmail(email);

        if(!user || user.length <= 0) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user.result.recordset[0]);
        
    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving user"});
    }
}

async function getAllOperator(req, res) {
    try {
        const users = await testModel.getAllOperator();
        res.json(users);

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving users"});
    }
}

async function getAllStallOwner(req, res) {
    try {
        const users = await testModel.getAllStallOwner();
        res.json(users);

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving users"});
    }
}

async function hashPassword(plainPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword;
}

async function updatePassword(req, res) {
    const hashedPassword = await hashPassword(req.body.password);

    console.log(hashedPassword);

    const loginDetails = {
        "id": req.params.id,
        "hashedPassword": hashedPassword
    }

    try {
        const result = await testModel.updatePassword(loginDetails);

        console.log(result);

        if (result) {
            res.status(200).json({
                    status: "Done"
                });

        } else {
            res.status(500).json({error: "user not found?"});
        }
    
    } catch (err) {
        console.error("Controller error: ", err);
        res.status(500).json({error: "Unable to update password"});
    }
}

async function loginAuth(req, res) {
    const { email, password } = req.body;

    try{
        // Find user in DB
        const result = await testModel.getUserByEmail(email);

        if (result.result.recordset[0].Password && result.result.recordset[0].Password.length > 0) {
            const match_result = await bcrypt.compare(password, result.result.recordset[0].Password);

            if (match_result) {

                const userIdType = {
                    Operator: "OperatorID",
                    StallOwner: "OwnerID"
                };

                req.session.userId = result.result.recordset[0][userIdType[result.userType]];
                console.log(req.session.userId);
                res.status(200).json({ "login status": true, "userType": result.userType });

            } else {
                res.status(401).json({ "login status": false });
            }

        } else {
            res.status(500).json({ error: "hashedPassword is empty" });
        }

    } catch (error) {
        console.error("Controller error: ", error.stack);
        res.status(500).json({error: "Something wrong"});
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    getUserByEmail,
    getAllOperator,
    getAllStallOwner,
    updatePassword,
    loginAuth
}