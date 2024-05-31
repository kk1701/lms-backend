import express from 'express'
import { register, login, logout, getUser, forgotPassword, resetPassword, changePassword, updateUser } from '../controllers/userControllers.js'
import isLoggedIn from '../middlewares/authMiddleware.js'
import upload from '../middlewares/multerMiddleware.js'
const router = express.Router()

router.post('/register', upload.single('avatar'), register)
router.post('/login', login)
router.get('/logout', logout)
router.get('/user', isLoggedIn, getUser)
router.post('/reset', forgotPassword)
router.post('/reset/:resetToken', resetPassword)
router.post('/change-password', isLoggedIn, changePassword)
router.put('/update', isLoggedIn, upload.single('avatar'), updateUser)


export default router