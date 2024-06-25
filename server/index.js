import router from "./router/router.js";
import dotenv from "dotenv"
import mongoose from "mongoose";
import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import errorMiddleware from "./middlewares/error.middleware.js";

dotenv.config()
const PORT = process.env.PORT || 1200
const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL
}))
app.use('/api', router)
app.use(errorMiddleware)

const start = async () => {
    try {
        await mongoose.connect(process.env.DB_URL)
        app.listen(PORT, () => console.log("DA"))
    } catch (e) {
        console.log(e)
    }
}

start()