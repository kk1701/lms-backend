import appError from '../utils/appError.js'
import User from '../models/userModel.js'
import cloudinary from 'cloudinary'
import fs from 'fs/promises'
import sendEmail from '../utils/sendEmail.js'
import crypto from 'crypto'

const cookieOptions = {
    secret: true,
    maxAge: 7*24*60*60*1000,   //7 days
    httpOnly: true
}

const register = async (req, res, next) => {
    const { fullName, email, password} = req.body

    if( !fullName || !email || !password){
        return next(new appError('All fields are required!', 400));
    }

    const userExists = await User.findOne( {email} );

    if(userExists){
        return next(new appError('User already exists!', 400));
    }

    const user = User.create({
        fullName,
        email,
        password,
        avatar: {
            public_id: email,
            secure_url: 'https://www.youtube.com/'
        }
    });

    if(!user){
        return next(new appError('User registration failed, please try again.', 400))
    }

    if(req.file){
        try{
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
                folder: 'lms',
                height: 250,
                width: 250,
                gravity: 'faces',
                crop: 'fill'
            })

            if(result){
                user.avatar.public_id = result.public_id
                user.avatar.secure_url = result.secure_url

                // remove file from local server
                fs.rm('uploads/' + req.file.filename)
            }
        } catch(e){
            return next(new appError('File not uploaded, please try again.', 500))
        }
    }

    await user.save();

    user.password = undefined

    res.status(200).json({
        success: true,
        message: 'User registered successfully.',
        user
    })
}


const login = async (req, res, next) => {
    const { email, password } = req.body

    if(!email || !password){
        return next(new appError('All fields are required', 400))
    }

    const user = await User.findOne({
        email
    }).select('+password')

    if(!user || !user.comparePassword(password)){
        return next(new appError('Email or password do not match.', 400))
    }

    const token = await user.generateJWTToken();
    user.password = undefined;

    res.cookie('token', token, cookieOptions);

    res.status(201).json({
        success: true,
        message: 'User logged in successfully',
        user
    })
}


const logout = async (req, res, next) => {
    res.cookie('token', null, {
        secure: true,
        maxAge: 0,
        httpOnly: true
    })

    res.status(200).json({
        success: true,
        message: 'User logged out successfully'
    })
}

const getUser = async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        message: 'User details',
        user
    })
}

const forgotPassword = async (req, res, next) => {
    const { email } = req.body

    if(!email){
        return next(new appError('Email is required!', 400))
    }

    const user = await User.findOne({ email })

    if(!user){
        return next(new appError('User is not registered!', 400))
    }

    const resetToken = await user.generatePasswordToken()

    await user.save()

    // Now, generate resetPassword URL and trigger an email to the user.
    const resetPasswordUrl = process.env.FRONTEND_URL + '/reset-password/' + resetToken;
    const subject = 'Reset Password';
    const message = 'You can reset your password by clicking at ' + resetPasswordUrl + ' .';

    console.log(resetPasswordUrl);

    try{
        await sendEmail(email, subject, message) 
        
        res.status(200).json({
            success: true,
            message: `Reset password token has been sent to ${email}`
        })
    } catch(error){
        user.forgotPasswordExpiry = undefined;
        user.forgotPasswordToken = undefined;

        await user.save()

        return next(new appError(error.message, 500))
    }
}

const resetPassword = async (req, res, next) => {
    const { resetToken } = req.params
    const {password} = req.body

    const forgotPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: { $gt: Date.now() }
    })

    if(!user){
        return next(new appError('Token is invalid or expired, please try again', 400))
    }

    user.password = password;
    user.forgotPasswordExpiry = undefined
    user.forgotPasswordToken = undefined

    await user.save()

    res.status(200).json({
        success: true,
        message: 'Password changed successfully'    
    })
}

const changePassword = async (req, res, next) => {
    const { oldPassword, newPassword } = req.body
    const {id} = req.user

    if(!oldPassword || !newPassword){
        return next(new appError('All fields are required', 400))
    }

    const user = await User.findById(id).select('+password')

    if(!user){
        return next(new appError('User does not exist', 400))
    }

    const isPasswordValid = await user.comparePassword(oldPassword)

    if(!isPasswordValid){
        return next(new appError('Invalid Old passowrd', 400))
    }

    user.password = newPassword

    user.save()
    user.password = undefined

    res.status(200).json({
        success: true,
        message: 'Password changed successfully!'
    })

}

const updateUser = async (req, res, next) => {
    const {fullName} = req.body
    const {id} = req.user
    const user = await User.findById(id)

    if(!user){
        return next(new appError('User does not exist', 400))
    }

    if(req.fullName){
        user.fullName = fullName
    } 
    if(req.file){
        await cloudinary.v2.uploader.destroy(user.avatar.public_id)

        const result = await cloudinary.v2.uploader.upload(req.file.path, {
            folder: 'lms',
            height: 250,
            width: 250,
            gravity: 'faces',
            crop: 'fill'
        })

        if(result){
            user.avatar.public_id = result.public_id
            user.avatar.secure_url = result.secure_url

            // remove file from local server
            fs.rm('uploads/' + req.file.filename)
        }
    }

    await user.save()

    res.status(200).json({
        success: true,
        message: 'User details updated successfully!'
    })
}

export{ 
    register, 
    login, 
    logout, 
    getUser,
    forgotPassword,
    resetPassword,
    changePassword,
    updateUser
}
