import cookieParser from 'cookie-parser';
import express from 'express'
import cors from 'cors'
import userRoutes from './routes/userRoutes.js'
import courseRoutes from './routes/courseRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import errorMiddleware from './middlewares/errorMiddleware.js';
import morgan from 'morgan';

const app = express();

app.use(express.json());

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true
}))

// app.use(morgan('dev'))

app.use(cookieParser())

app.get('/ping', ( req, res) => {
    res.send('Pong')
})

// 3route config
app.use('/user', userRoutes);
app.use('/courses', courseRoutes);
app.use('/payments', paymentRoutes);

app.get('*', (req, res) => {
    res.status(404).send('404 Page Not Found')
})

app.use(errorMiddleware);

export default app

