import { Router } from "express";
import equipmentController from "../../controllers/it_maintenances/equipmentController.js";

const router = Router()

router.get('/', equipmentController.getAllEquipments)
router.get('/:eid', equipmentController.getEquipmentById)
router.post('/', equipmentController.createEquipment)
router.put('/:eid', equipmentController.updateEquipment)

export default router
