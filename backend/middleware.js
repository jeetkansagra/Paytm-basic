const jwt = require('jsonwebtoken');
const {JWT_SECRET} = require('./config');

const authMiddleware = (req, res, next) =>{
    const authHeaders = req.headers.authorization;

    if(!authHeaders || !authHeaders.startsWith('Bearer ')){
        return res.status(403).json({})
    }

    const token = authHeaders.split(" ")[1];

    try {
        const decode = jwt.verify(token,JWT_SECRET);

        if(decode.userId){
            req.userId = decode.userId;
            next();
        }else{
            return res.status(403).json({})
        }
    } catch (err) {
        return res.status(403).json({})
    }
}

module.exports= authMiddleware;