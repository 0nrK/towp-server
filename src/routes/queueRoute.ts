import { Router } from "express";
import QueueController from "../controllers/QueueController";

const router = Router();

router.get("/", QueueController.getQueue);
router.post('/', QueueController.addToQueue);
router.delete('/', QueueController.removeFromQueue);

export default router;