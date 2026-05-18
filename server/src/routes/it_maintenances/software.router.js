import { Router } from "express";
import softwareController from "../../controllers/it_maintenances/softwareController.js";

const router = Router()

router.get('/', softwareController.getAllSoftware)
router.post('/', softwareController.addSoftware)
router.post('/install', softwareController.installSoftware)

export default router