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

module.exports = {
    getAllUsers
}