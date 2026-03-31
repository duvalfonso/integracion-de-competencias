import { Router } from "express";
import truckController from "../controllers/truckController.js";


const router = Router()

router.get('/', truckController.getAllTrucks)

export default router
