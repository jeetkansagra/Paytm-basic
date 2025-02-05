// backend/routes/user.js
const express = require('express');

const router = express.Router();
const zod=require("zod")
const jwt =require("jsonwebtoken")
const {JWT_SECRET} =require("../config");
const { User, Account } = require('../db');
const authMiddleware = require('../middleware');
const bcrypt = require('bcrypt')


const signupBody = zod.object({
    username:zod.string(),
    firstName:zod.string(),
    lastName:zod.string(),
    password:zod.string()
})

router.post("/signup",async(req,res) =>{
    const{success} =signupBody.safeParse(req.body)

    if(!success){
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const existingUser =await User.findOne({
        username:req.body.username
    })

    if(existingUser){
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const hasedPassword = await bcrypt.hash(req.body.password,10);

    const user = await User.create({
        username:req.body.username,
        password:hasedPassword,
        firstName:req.body.firstName,
        lastName:req.body.lastName
    })

    const userId =user._id;

    await Account.create({
        userId,
        balance:1 + Math.random()*10000
    })

    const token = jwt.sign({
        userId
    },JWT_SECRET)

    res.status(200).json({
        message:"User created successfully",
        token:token
    })
})

const signinBody=zod.object({
    username:zod.string(),
    password:zod.string()
})

router.post("/signin",async(req,res) =>{
    const {success} = signinBody.safeParse(req.body)
    if(!success){
        return res.status(411).json({
            message:"Incorrect Inputs"
        })
    }

    const user = await User.findOne({
        username:req.body.username,
    });

    if(!user){
        return res.status(411).json({
            message:"User not found"
        })
    }

    //comparing hash password
    const isPasswordValid = await bcrypt.compare(req.body.password,user.password)

    if(!isPasswordValid){
        return res.status(401).json({
            message:"Invalid Credentials"
        })
    }

    const token = jwt.sign({userId:user._id},JWT_SECRET)
    res.json({token})

})

const updateBody = zod.object({
    password:zod.string().optional(),
    firstName:zod.string().optional(),
    lastName:zod.string().optional(),
})

router.put("/",authMiddleware,async(req,res)=>{
    const{success} = updateBody.safeParse(req.body)
    if(!success){
    return res.status(411).json({
            message:"Error while uploading information"
        })
    }

    //if password is updated hash it before saving
    if(req.body.password){
        req.body.password =await bcrypt.hash(req.body.password,10)
    }

    await User.updateOne({_id:req.userId},req.body) //(filter,update)

    res.json({
        message:"Updated successfully"
    })
})

router.get("/bulk",async(req,res) =>{
    const filter = req.query.filter || "";

    const users = await User.find({
        $or:[{
            firstName:{
                "$regex":filter
            }
        },{
            lastName:{
                "$regex":filter
            }
        }]
    })

    res.json({
        user:users.map(user =>({
            username:user.username,
            firstName:user.firstName,
            lastName:user.lastName,
            _id:user._id
        }))
    })
})

module.exports = router;