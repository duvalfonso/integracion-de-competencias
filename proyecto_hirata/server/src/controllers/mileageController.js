import { mileageService, truckService } from '../services/index.js'

const getAllMileageLogs = async (req, res) => {
  try {
    const result = await mileageService.getAll()
    return res.status(200).send({ message: 'Lista de registros de kilometraje', payload: result })
  } catch (error) {
    res.status(500).send({ status: "error", error: error.message })
  }
}

const registerMileage = async (req, res) => {
  try {
    const { truck_id, mileage_value } = req.body // el id y el kilometraje del vehículo se toman del formulario
    const driver_id = req.session.user.id // el id del conductor se toma del token de autenticación
      
    if (!mileage_value || mileage_value <= 0) {
      return res.status(400).send({ message: "Kilometraje inválido" })
    }

    const truck = await truckService.getById(truck_id)
    if(!truck) return res.status({ status: "error", error: "Vehículo no encontrado" })
    
    if(mileage_value <= truck.total_mileage) {
      return res.status(400).send({ status: "error", error: `El kilometraje ingresado debe ser superior al actual (${truck.total_mileage} km.)` })
    }

    await mileageService.create({ truck_id, driver_id, mileage_value })

    await truckService.update(truck_id, mileage_value)

    const kmSinceLastService = mileage_value - truck.last_maintenance_mileage
    const needsMaintenance = kmSinceLastService >= 5000

    res.status(201).send({
      status: "success",
      message: "Kilometraje registrado exitosamente.",
      maintenanceAlert: needsMaintenance,
      details: {
        currentMileage: mileage_value,
        kmForNextService: Math.max(0, 5000 - kmSinceLastService)
      }
    })
  } catch (error) {
    res.status(500).send({ message: "Error interno del servidor", error: error.message })
  }
}

export default {
  registerMileage,
  getAllMileageLogs
}