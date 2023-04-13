import express, { Request, Response } from "express";
import connectDB from "./config/db";
import dotenv from 'dotenv'
import QueueRoute from './routes/queueRoute'
const app = express();
dotenv.config()


connectDB()

app.use('/api/queue', QueueRoute)

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World");
});

app.listen(5000, () => console.log("Server listening on http://localhost:5000"));