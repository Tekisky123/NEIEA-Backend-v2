import Subscribe from "../models/Subscribe.js";
import validator from 'validator';

export const createSubscribe = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Email ID"
            })
        }

        const alreadySubscribe = await Subscribe.findOne({email}); 

        if(alreadySubscribe) {
            return res.status(409).json({       
                success: false,
                message: "You are already subscribed!"
            });
        }

        const newContact = new Subscribe({email});

        await newContact.save();

        return res.status(201).json({
            success: true,
            message: "Thank you for subscribing!",
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message,
        });
    }
};