import { itMaintenanceService } from "../../services/index.js";

const getAllItMaintenances = async (req, res) => {
  try {
    const itMaintenances = await itMaintenanceService.getAll()
    res.send({ status: 'success', payload: itMaintenances })
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message })    
  }
}

const getById = async (req, res) => {
  try {
    const { id } = req.params
    const itMaintenance = await itMaintenanceService.getById(id)
    if (!itMaintenance) {
      res.status(404).send({ status: 'error', error: 'Mantenimiento no encontrado según el id especificado.' })
    }
    res.send({ status: 'success', payload: itMaintenance })
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message })
  }
}

const registerMaintenance = async (req, res) => {
  try {
    const { equipment_id, technician_id, type, description, cost, final_status } = req.body
    const userId = req.session.user.id

    if (!equipment_id || !type || !description) {
      res.status(400).send({ status: 'error', error: 'Campos incompletos' })
    }

    const maintenanceData = {
      equipment_id,
      technician_id: userId,
      type,
      description,
      cost: cost || 0,
      final_status: final_status || 'operativo'
    }

    // se deben traer de la base de datos las partes usadas para llevar el control de inventario. De momento solo se habilita el registro sin uso de partes desde el inventario.
    const partsUsed = []

    const resultId = await itMaintenanceService.registerMaintenance(maintenanceData, partsUsed)
  
    res.send({ status: 'success', message: 'Mantenimiento registrado.', resultId: resultId })
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message })
  }
}

export default {
  getAllItMaintenances,
  getById,
  registerMaintenance
}
