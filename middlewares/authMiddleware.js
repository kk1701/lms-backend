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

const authorizedRoles = (...roles) => (req, res, next) => {
    const currentRole = req.user.role
    if(!roles.includes(currentRole)){
        return next(new appError('You do not have permission to access this route.', 403))
    }

    next();
}

const authorizedSubscriber = async (req, res, next) => {
    const subscriptionStatus = req.user.subsciption.status
    const currentRole = req.user.role

    if( currentRole !== 'ADMIN' && subscriptionStatus !== 'active'){
        return next(new appError('Please subscribe to access this course!', 403))
    }

    next()
}

export{
    isLoggedIn,
    authorizedRoles,
    authorizedSubscriber
}   



// before getting the user details, it checks if the user is logged in or not. If (loggedIn) return details else not.