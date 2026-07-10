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

async function getUser(req, res) {
    try {
        const id = req.params.id;

        const user = await testModel.getUser(id);

        if(!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
        
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
        res.status(500).json({error: "Unable to login"});
    }
}

async function loginAuth(req, res) {
    const { username, password } = req.body;

    try{
        const result = await testModel.loginAuth(req.body);

        if (result.hashedPassword && result.hashedPassword.length > 0) {
            const match_result = await bcrypt.compare(password, result.hashedPassword);

            if (match_result) {
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
    getUser,
    getAllOperator,
    getAllStallOwner,
    updatePassword,
    loginAuth
}