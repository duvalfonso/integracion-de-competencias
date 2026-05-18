import { Router } from "express";
import sessionController from "../controllers/sessionController.js";
import { authorize } from "../middlewares/auth.js";

const router = Router()

router.post('/register', sessionController.register)
router.post('/login', sessionController.login)
router.get('/current', authorize(['driver', 'maintenance', 'admin', 'superadmin', 'it_tech']), sessionController.current)
router.post('/logout', authorize(['driver', 'maintenance', 'admin', 'superadmin', 'it_tech']), sessionController.logout)

export default router