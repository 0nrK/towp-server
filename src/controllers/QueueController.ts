import Wish from "../models/Wish";
import { Request, Response } from "express";
class QueueController {
    // ...
    async getQueue(req: Request, res: Response) {
        const data = await Wish.find()
        res.json(data)
    }
    async addToQueue(req: Request, res: Response) {
        const user = 'deneme'
        const { videoId } = req.body
        const data = await new Wish({
            videoId,
            createdBy: user
        }).save()
        res.status(200).send(data)
    }
    async removeFromQueue(req: Request, res: Response) {
        const { wishId } = req.body
        const data = await Wish.findByIdAndDelete(wishId)
        res.status(200).send(data)
    }
}

export default new QueueController()