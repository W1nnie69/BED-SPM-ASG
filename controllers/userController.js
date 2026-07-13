const userModel = require("../models/userModel");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const utils = require('../utils/email');

// VARIABLE TO STORE PASSWORD RESET TOKENS! DO NOT TOUCH!!
// Might store the tokens in the db instead. We'll see.
const resetTokens = new Map();


async function getAllUsers(req, res) {
    try {
        const users = await userModel.getAllUsers();
        res.json(users);

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving users"});
    }
}

async function getUserById(req, res) {
    try {
        const id = req.params.id;

        const user = await userModel.getUserById(id);

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

        const user = await userModel.getUserByEmail(email);

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
        const users = await userModel.getAllOperator();
        res.json(users);

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving users"});
    }
}

async function getAllStallOwner(req, res) {
    try {
        const users = await userModel.getAllStallOwner();
        res.json(users);

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving users"});
    }
}

// TODO: Move this function to a helper/ utils file
async function hashPassword(plainPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword;
}

// Cant believe it worked first try!!!
// Both forgotPassword and resetPassword works,
// just need to link them with the frontend.
async function forgotPassword(req, res) {
    const { email } = req.body;

    try {
        const user = await userModel.getUserByEmail(email);

        console.log(user.result);

        if (!user || user.result.recordset.length < 0) {
            return res.json({ message: "If that email exists, a reset link has been sent." });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 30 * 60 * 1000; // 30 mins from now

        // using the stupid method of selecting the ID from below...
        const userIdType = {
                        Operator: "OperatorID",
                        StallOwner: "OwnerID"
                    };

        resetTokens.set(token, { userId: user.result.recordset[0][userIdType[user.userType]], expiresAt });

        const resetLink = `http://localhost:3000/reset-password?token=${token}`;

        await utils.sendResetEmail(user.result.recordset[0].Email, resetLink);

        res.json({ message: "If that email exists, a reset link has been sent." });

    } catch(error) {
        console.error("Controller error: ", error.stack);
        res.status(500).json({ error: "Something went wrong" });
    }
    
}

async function resetPassword(req, res) {
    const { token, password } = req.body;

    try {
        const record = resetTokens.get(token);

        if (!record || record.expiresAt < Date.now()) {
            return res.status(400).json({ error: "This reset link is invalid or has expired." });
        }

        const hashedPassword = await hashPassword(password);
        await userModel.updatePassword(record.userId, hashedPassword);

        resetTokens.delete(token);

        res.json({ message: "Password updated successfully! "});

    } catch (error) {
        console.error("Controller error: ", error.stack);
        res.status(500).json({ error: "Something went wrong" });
    }
    
}

// Currently this doesnt work in the frontend as the forgot password page
// requests the user's email. My updatePassword model uses ID to find
// the user as i think thats safer? (IDs will never be duped, unless i do some stupid shit)
// Now looking into how actual password resets work.
//
// 1) User request for password change on front-end.
// 2) A token is then generated, which is sent to user's email with a link to redirect them to the change password page.              
// 3) On the change password page, User enters new password.
// 4) Request to change password is sent to backend
// 5) Backend checks the token sent from the user matches the one that was generated in step 2
// 6) If match, password change is executed. Else, throw error or smt like that
async function updatePassword(req, res) {
    const hashedPassword = await hashPassword(req.body.password);

    console.log(hashedPassword);

    const loginDetails = {
        "id": req.params.id,
        "hashedPassword": hashedPassword
    }

    try {
        const result = await userModel.updatePassword(loginDetails);

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
        const user = await userModel.getUserByEmail(email);

        // Horrible to look at but it works...
        // Probably should just return the recordset instead of the whole result lol
        if (user.result.recordset[0].Password && user.result.recordset[0].Password.length > 0) {
            const match_result = await bcrypt.compare(password, user.result.recordset[0].Password);

            if (match_result) {

                // This is to get the stupid userID from the result below.
                // Since both tables have different column names for the ID, i use the userType
                // in the result to properly set the column name.
                // However, I COULD JUST CHANGE THE COLUMN NAME IN THE dbINIT SCRIPT!!!!!!!!
                // TODO: Maybe change the column name in the init script
                const userIdType = {
                    Operator: "OperatorID",
                    StallOwner: "OwnerID"
                };

                // Sets the session userId
                req.session.userId = user.result.recordset[0][userIdType[result.userType]];
                console.log(req.session.userId);
                res.status(200).json({ "login status": true, "userType": result.userType });

            } else {
                res.status(401).json({ "login status": false });
            }

        } else {
            // Will it ever be empty? idk 
            res.status(500).json({ error: "hashedPassword is empty" });
        }

    } catch (error) {
        console.error("Controller error: ", error.stack);
        // Top 10 error messages...
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
    loginAuth,
    forgotPassword,
    resetPassword
}