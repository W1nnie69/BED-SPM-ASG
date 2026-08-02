const userModel = require("../models/userModel");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const utils = require('../utils/email');
const jwt = require('jsonwebtoken');
const { get } = require("http");
const { user } = require("../dbConfig");

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

        res.json(user);
        
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
        const user = await userModel.getUserById(userId);

        const { Password, ...dataCleaned } = user;

        res.status(200).json(dataCleaned);

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error retrieving users"});
    }
}

async function updateUserProfile(req, res) {
    try {
        const userId = req.params.id;

        console.log(req.body);
        const result = await userModel.updateUserProfile(userId, req.body);

        if (result === false) {
            throw new Error("Model operation returned false.");
        }

        res.status(200).json({ status: "success!"});

    } catch (error) {
        console.error("Controller error: ", error);
        res.status(500).json({error: "Error updating profile"});
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

        console.log(user);

        if (!user || user.length < 0) {
            return res.json({ message: "If that email exists, a reset link has been sent." });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + 30 * 60 * 1000; // 30 mins from now

        // using the stupid method of selecting the ID from below...
        const userIdType = {
                        Operator: "OperatorID",
                        StallOwner: "OwnerID",
                        Customer: "CustomerID"
                    };

        resetTokens.set(token, { userId: user[userIdType[user.userType]], expiresAt });

        const resetLink = `http://localhost:3000/reset-password?token=${token}`;

        await utils.sendResetEmail(user.Email, resetLink);

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

async function updatePassword(req, res) {
    const { id, currentPassword, newPassword } = req.body;

    try {
        const result = await userModel.getUserById(id);
        
        if (currentPassword && currentPassword.length > 0) {
            const compare_result = await bcrypt.compare(currentPassword, result.Password);

            if (compare_result) {
                const hashedNewPassword = await hashPassword(currentPassword);
                const status = await userModel.updatePassword(id, hashedNewPassword);

                if (status) {
                    res.status(200).json({ status: "success" });

                } else {
                    throw new Error("Password change unsuccessful");
                }

            } else {
                throw new Error("Password did not match");
            }
        }
        
    } catch (error) {
        console.error("Controller error: ", error.stack);
        res.status(500).json({ error: "Something went wrong" });
    }
}

async function loginAuth(req, res) {
    const { email, password } = req.body;

    try{
        // Find user in DB
        const user = await userModel.getUserByEmail(email);

        const userIdType = {
                    Operator: "OperatorID",
                    StallOwner: "OwnerID",
                    Customer: "CustomerID"
                };

        // Horrible to look at but it works...
        // Dirty fix. CBA to change the db column names.          
        const userId = user[userIdType[user.userType]];
        const hashedPassword = user.Password;

        if (hashedPassword && hashedPassword.length > 0) {
            const match_result = await bcrypt.compare(password, hashedPassword);

            if (match_result) {
                
<<<<<<< HEAD
                // Sets the session userId
                req.session.userId = user.result.recordset[0][userIdType[user.userType]];
                req.session.userType = user.userType;
                console.log(req.session.userId);
                res.status(200).json({ "loginStatus": true, "userType": user.userType, "userId": user.result.recordset[0][userIdType[user.userType]]});
=======
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
>>>>>>> 29aaafed436e9e1b97f41d4b8f7050810b83643e

            } else {
                res.status(401).json({ "loginStatus": false });
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

async function registerUser(req, res) {
    const userType = req.params.userType;

    const { name, password, email } = req.body;
    const hashedPassword = await hashPassword(password);

    //StallOwner vars
    let nric;
    let contactNo; // Customer too
    //Operator vars
    let contactPerson;

    // data package
    let userData = {
                userType: userType,
                name: name,
                password: hashedPassword,
                email: email
            };
    
    switch (userType) {
        case "StallOwner":
            ({ nric, contactNo } = req.body);
            userData.nric = nric;
            userData.contactNo = contactNo;
            break;
        
        case "Operator":
            ({ contactPerson } = req.body);
            userData.contactPerson = contactPerson;
            break;

        case "Customer":
            ({ contactNo } = req.body);
            userData.contactNo = contactNo;
            break;
        
        default:
            console.error("Unknown user type");
            return;
    }

    try {
        const status = await userModel.signUpUser(userData);

        if (status === false) {
            throw new Error("userModel returned false as status");
        }   

        res.status(200).json({ status: "success" });

    } catch (error) {
        console.error("Controller error: ", error.stack);
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


//-shengle- added this to cover feature needed by login
async function getSessionStatus(req, res) {
    if (req.session.userId) {
        res.json({ loggedIn: true, userId: req.session.userId, userType: req.session.userType });
    } else {
        res.json({ loggedIn: false });
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
<<<<<<< HEAD
    getSessionStatus
=======
    getUserProfile,
    updateUserProfile,
    updatePassword,
    registerUser
>>>>>>> 29aaafed436e9e1b97f41d4b8f7050810b83643e
}