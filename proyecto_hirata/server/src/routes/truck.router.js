import { Router } from "express";
import truckController from "../controllers/truckController.js";
import { authorize } from "../middlewares/auth.js";


const router = Router()

router.get('/', truckController.getAllTrucks)
router.post('/', authorize(['admin', 'superadmin']), truckController.createTruck)

export default router
