import express, { Request, Response } from "express";
import dotenv from 'dotenv'
import cors from 'cors'
import QueueRoute from './routes/queueRoute'
const app = express();

dotenv.config()
app.use(cors())
app.use('/api/queue', QueueRoute)

app.get("/", (req: Request, res: Response) => {
    res.send("Hello World");
});

app.listen(5000, () => console.log("Server listening on http://localhost:5000"));