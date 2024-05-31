import app from './app.js'
import { config } from 'dotenv'
import connectToDB from './config/connectDB.js';
import cloudinary from 'cloudinary'

config()

connectToDB()

const PORT = process.env.PORT || 5000;

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    api_key: process.env.CLOUDINARY_API_KEY
})

app.listen(PORT, async () => {
    // await connectToDB()
    console.log("Server is live at port: ", PORT);
})