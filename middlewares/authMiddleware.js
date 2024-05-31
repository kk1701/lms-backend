import appError from '../utils/appError.js'
import jwt from 'jsonwebtoken'

const isLoggedIn = function(req, res, next){
    const {token} = req.cookies

    if(!token){
        return next(new appError('Unauthorized, please login', 401))
    }

    const tokenDetails = jwt.verify(token, process.env.JWT_SECRET)

    if(!tokenDetails){
        return next(new appError('Unauthorized, please login', 401))
    }

    req.user = tokenDetails

    next();
}

export default isLoggedIn  



// before getting the user details, it checks if the user is logged in or not. If (loggedIn) return details else not.