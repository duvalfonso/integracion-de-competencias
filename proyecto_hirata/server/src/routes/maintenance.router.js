import { Router } from "express";
import maintenanceController from "../controllers/maintenanceController.js";
import { authorize } from "../middlewares/auth.js";

const router = Router()

const authRoles = authorize(['maintenance', 'admin', 'superadmin'])

router.post('/', authRoles, maintenanceController.createMaintenance)
router.get('/truck/:truck_id', authRoles, maintenanceController.getByTruck)
router.put('/:maintenance_id/complete', authRoles, maintenanceController.completeMaintenance)
router.put('/:maintenance_id/start', authRoles, maintenanceController.startMaintenance)

export default router
