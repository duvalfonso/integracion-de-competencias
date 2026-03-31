import { Router } from 'express'
import assignmentController from '../controllers/assignmentController.js'
import { authorize } from '../middlewares/auth.js'

const router = Router()

router.get('/', authorize(['admin', 'superadmin']), assignmentController.getAllAssignments)
router.post('/', authorize(['admin', 'superadmin']), assignmentController.assignTruck)

export default router
