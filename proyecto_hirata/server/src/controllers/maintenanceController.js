import { maintenanceService } from "../services/index.js";

const createMaintenance = async (req, res) => {
  try {
    const result = await maintenanceService.createMaintenance(req.body)
    res.send({ status: "success", message: "Mantenimiento programado", payload: result })
  } catch (error) {
    res.status(500).send({ status: "error", error: error })
  }
}

const startMaintenance = async (req, res) => {
  try {
    const { maintenance_id } = req.body
    await maintenanceService.startMaintenance(maintenance_id)
    res.send({ status: "success", message: "Mantenimiento marcado como inicado" })
  } catch (error) {
    res.status(500).send({ status: "error", error: error.message })
  }
}

const getByTruck = async (req, res) => {
  try {
    const { truck_id } = req.params
    const result = await maintenanceService.getMaintenancesByTruck(truck_id)
    res.send({ status: "success", payload: result })
  } catch (error) {
    res.status(500).send({ status: "error", error: error.message })
  }
}

const completeMaintenance = async (req, res) => {
  try {
    const { maintenance_id } = req.params
    const { truck_id, maintenance_mileage } = req.body
    await maintenanceService.finishMaintenance(maintenance_id, truck_id, maintenance_mileage)
    res.send({ status: "success", message: "Vehículo listo para operar nuevamente" })
  } catch (error) {
    res.status(500).send({ status: "error", error: error.message })
  }
}

export default {
  createMaintenance,
  startMaintenance,
  getByTruck,
  completeMaintenance
}
