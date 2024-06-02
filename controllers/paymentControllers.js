import appError from "../utils/appError.js"
import User from '../models/userModel.js'
import Payment from '../models/paymentModel.js'
import { razorpay } from "../server.js"

const getRazorpayApiKey = async (req, res, next) => {
    try{
        res.status(200).json({
            success: true,
            message: 'Razorpay Key ID',
            key: process.env.RAZORPAY_KEY_ID
        })
    } catch(error){
        return next(new appError(error.message, 500))
    }
}

const buySubscription = async (req, res, next) => {
    try{
        const { id } = req.user
        const user = await User.findById(id)

        if(!user){
            return next(new appError('Unauthorized, please login!', 500))
        }

        if(user.role === 'ADMIN'){
            return next(new appError('Admin cannot buy subscription', 400))
        }

        const subscription = await razorpay.subscriptions.create({
            plan_id: process.env.RAZORPAY_PLAN_ID,
            customer_notify: 1,
        })


        user.subscription.id = subscription.id
        user.subscription.status = subscription.status

        await user.save()

        res.status(200).json({
            success: true,
            message: 'Subscribed successfully!'
        })

    } catch(error){
        return next(new appError(error.message, 500))
    }
}

const verifySubscription = async (req, res, next) => {
    try{
        const { id } = req.user
        const user = await User.findById(id);

        if(!user){
            return next(new appError('Unauthorized, please login!'), 500)
        }

        const { razorpay_payment_id, razorpay_signature, razorpay_subscription_id } = req.body

        const generatedSignature = crypto
            .create('sha256', process.env.RAZORPAY_SECRET)
            .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)

        if(generatedSignature !== razorpay_signature){
            return next(new appError('Payment not verfied, please try again', 500))
        }

        await Payment.create({
            razorpay_payment_id,
            razorpay_signature,
            razorpay_subscription_id,
        })

        user.subscription.status = 'active'
        await user.save()

        res.status(200).json({
            success: true,
            message: 'Payment verified successfully!',
        })

    } catch(error){
        return next(new appError(error.message, 500))
    }
}

const cancelSubscription = async (req, res, next) => {
    try{
        const { id } = req.user
        const user = await User.findById(id);

        if(!user){
            return next(new appError('Unauthorized, please login!'), 500)
        }

        if(user.role === 'ADMIN'){
            return next(new appError('Admin cannot cancel the subscription', 403))
        }

        const subscriptionId = user.subscription.id

        const subscription = await razorpay.subscriptions.cancel(subscriptionId)

        user.subscription.status = subscription.status

        await user.save()

        res.status(200).json({
            success: true,
            message: 'Subscription cancelled successfully!',
        })

    } catch(error){
        return next(new appError(error.message, 500))
    }
}

const getAllPayments = async (req, res, next) => {
    try{
        const { count } = req.query
        const subscription = await razorpay.subscriptions.all({
            count: count || 10
        })

        res.status(200).json({
            success: true,
            message: 'All payments',
            payments: subscription
        })

    } catch(error){
        return next(new appError(error.message, 500))
    }
}

export{
    getRazorpayApiKey,
    buySubscription,
    verifySubscription,
    cancelSubscription,
    getAllPayments
}