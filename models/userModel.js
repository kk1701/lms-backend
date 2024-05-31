import { Schema, model } from 'mongoose'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const userSchema = new Schema({
    fullName: {
        type: String,
        required: [true, "Name is required"],
        minLength: [5, "Name must have atleast 5 characters"],
        maxLength: [30, "Name must have at max 30 characters"],
        lowercase: true,
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email already exists"],
        trim: true,
        lowercase: true,

    },
    password: {
        type: String,
        required: [true, "Password is required"],
        trim: true,
        minLength: [8, "Password must be atleast 8 characters"],
        select: false
    },
    role: {
        type: String,
        enum: ['USER', 'ADMIN'],
        default: 'USER'
    },
    avatar: {
        public_id: {
            type: String
        },
        secure_url: {
            type: String
        }
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date
}, {
    timestamps: true
})

userSchema.pre('save', async function (next) {
    if(!this.isModified('password')){
        return next();
    } 
    this.password = await bcrypt.hash(this.password, 10);
})     //ensures that the password is encrypted before storing in the DB

userSchema.methods = {
    comparePassword: async function (plainTextPassword) {
        return await bcrypt.compare( plainTextPassword, this.password )
    },
    generateJWTToken: function () {
        return jwt.sign(
            { id: this._id, role: this.role, email: this.email, subscription: this.subscription},
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRY
            }
        )
    },
    generatePasswordToken: async function () {
        const resetToken = crypto.randomBytes(20).toString('hex')

        this.forgotPasswordToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex')
        this.forgotPasswordExpiry = Date.now() + 15*60*1000  //15min from now

        return resetToken
    },
}


const User = model('User', userSchema)

export default User