const userModel = require("../models/userModel");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const utils = require('../utils/email');
const jwt = require('jsonwebtoken');
const { get } = require("http");

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

async function getUserProfile(req, res) {
    try {
        const userId = req.params.id;
        console.log(userId);
        const user = await userModel.getUserById(userId);

        let data = user.result.recordset[0];
        const { Password, ...dataCleaned } = data;

        console.log(dataCleaned);

        res.status(200).json(dataCleaned);

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

// updatePassword has been replaced by forgotPassword and resetPassword.
// It is now deprecated...
// async function updatePassword(req, res) {
//     const hashedPassword = await hashPassword(req.body.password);

//     console.log(hashedPassword);

//     const loginDetails = {
//         "id": req.params.id,
//         "hashedPassword": hashedPassword
//     }

//     try {
//         const result = await userModel.updatePassword(loginDetails);

//         console.log(result);

//         if (result) {
//             res.status(200).json({
//                     status: "Done"
//                 });

//         } else {
//             res.status(500).json({error: "user not found?"});
//         }
    
//     } catch (err) {
//         console.error("Controller error: ", err);
//         res.status(500).json({error: "Unable to update password"});
//     }
// }

async function loginAuth(req, res) {
    const { email, password } = req.body;

    try{
        // Find user in DB
        const user = await userModel.getUserByEmail(email);

        const userIdType = {
                    Operator: "OperatorID",
                    StallOwner: "OwnerID"
                };

        // Horrible to look at but it works...
        // Dirty fix. CBA to change the db column names.          
        const userId = user.result.recordset[0][userIdType[user.userType]];
        const hashedPassword = user.result.recordset[0].Password;

        if (hashedPassword && hashedPassword.length > 0) {
            const match_result = await bcrypt.compare(password, hashedPassword);

            if (match_result) {
                
                // Generates a jwt for auth
                const token = jwt.sign(
                    { userId: userId, userType: user.userType },
                    process.env.JWT_SECRET,
                    { expiresIn: "1h" }
                );
                
                res.status(200).json({ 
                    "loginStatus": true, 
                    "userType": user.userType,
                    "userId": userId,
                    "token": token
                });

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

async function getDashboard(req, res) {
    try {
        const { userType, id } = req.params;

        if (userType === 'Operator') {
            const result = await userModel.getOperatorDashboard(id);

            if (!result) {
                return res.status(404).json({ error: "User not found" });
            }

            const [operatorRows, hawkerCentres, stalls, complaints, inspections, statsRows] = result.recordsets;

            const operator = operatorRows[0] || null;
            const stats = statsRows[0] || {};

            return res.status(200).json({ operator, stats, hawkerCentres, stalls, complaints, inspections });
        }

        if (userType === 'StallOwner') {
            const result = await userModel.getStallOwnerDashboard(id);

            if (!result) {
                return res.status(404).json({ error: "User not found" });
            }

            const [ownerRows, stalls, menuItems, feedback, promotions, inspections, statsRows] = result.recordsets;

            const owner = ownerRows[0] || null;
            const stats = statsRows[0] || {};
            stats.hygieneGrade = stalls[0]?.HygieneGrade || null;

            return res.status(200).json({ owner, stats, stalls, menuItems, feedback, promotions, inspections });
        }

        return res.status(400).json({ error: "Unknown user type" });

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({ error: "Error retrieving user" });
    }
}

module.exports = {
    getAllUsers,
    getUserById,
    getUserByEmail,
    getAllOperator,
    getAllStallOwner,
    loginAuth,
    forgotPassword,
    resetPassword,
    getDashboard,
    getUserProfile
}