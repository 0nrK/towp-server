import { Router } from "express";
import QueueController from "../controllers/QueueController";

const router = Router();

router.get("/", QueueController.getQueue);
router.get("/getCurrentVideoId", QueueController.getCurrentVideoId);
router.post('/', QueueController.addToQueue);
router.delete('/', QueueController.removeFromQueue);

export default router;