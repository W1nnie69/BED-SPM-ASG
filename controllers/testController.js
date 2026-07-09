const testModel = require("../models/testModel");

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
        const { email, password } = req.body;

        const status = await testModel.getUser(email);

        if (status == true) {
            // redirect to home page
            console.log("user found")
            res.json({ message: 'ok' });
            return;

        } else {
            // show warning on frontend
            console.log("user not found!")
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

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

module.exports = {
    getAllUsers,
    getUser,
    getAllOperator
}