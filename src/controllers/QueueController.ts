import db from "../config/db";
import { Request, Response } from "express";
class QueueController {
    // ...
    getQueue(req: Request, res: Response) {
        const data = db
        res.json(data)
    }
    addToQueue(req: Request, res: Response) {
        const user = 'deneme'
        const { videoId, videoUrl, createdBy } = req.body
        const data = db.push({
            videoUrl,
            videoId,
            createdBy: user
        })

        res.status(200).send(data)
    }
    removeFromQueue(req: Request, res: Response) {
        const { wishId } = req.body
        const data = db.filter(object => object.videoId !== wishId)
        res.status(200).send(data)
    }
    getCurrentVideoId(req: Request, res: Response) {
        const data = db[2]
        res.status(200).send(data)
    }
}

export default new QueueController()