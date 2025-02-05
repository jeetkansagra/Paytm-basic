const express = require('express');
const { Account } = require('../db');
const authMiddleware = require('../middleware');
const { mongo, default: mongoose } = require('mongoose');
const router = express.Router();
const zod=require("zod")


router.get("/balance",authMiddleware, async(req,res)=>{

    if (!req.userId) {
        return res.status(400).json({ message: "User ID is missing" });
    }
   
    const account = await Account.findOne({
        userId:req.userId
    })

    res.json({
        balance : account.balance
    })
})


const transferBody =zod.object({
    amount:zod.string(),
    to : zod.string()
})

router.post("/transfer" ,authMiddleware,async (req,res) =>{
    const {success} = transferBody.safeParse(req.body)
    console.log(req.body)
    if(!success){
        return res.status(411).json({
            message:"Incorrect Inputs"
        })
    }
    console.log(req.body)
    const {amount,to} =req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    const account = await Account.findOne({userId:req.userId}).session(session);

    if(!account || account.balance < amount){
        await session.abortTransaction();
        return res.status(400).json({
            message:"Insufficient balance"
        });
    }

    const toAccount = await Account.findOne({userId:to}).session(session)

    if(!toAccount){
        await session.abortTransaction();
        return res.status(400).json({
            message:"Invalid account"
        })
    }

    // performing Transfer 
    await Account.updateOne({userId:req.userId},{$inc:{balance : -amount}}).session(session)
    await Account.updateOne({userId:to},{$inc:{balance : amount}}).session(session)

    //commit transaction
    await session.commitTransaction();
    res.json({
        message:"Transfer successful"
    })



})


module.exports = router