import { truckService } from "../services/index.js";

const createTruck = async (req, res) => {
  try {
    const { plate_number, brand, model, year } = req.body
    if(!plate_number || !brand || !model || !year) {
      return res.status(400).send({ status: 'error', error: 'Campos incompletos' })
    }
    const exists = await truckService.getByPlateNumber(plate_number)
    if(exists) {
      return res.status(400).send({ status: 'error', error: `Ya se encuentra registrada la patente ${plate_number}` })
    }

    const truck = {
      plate_number,
      brand,
      model,
      year
    }
    const result = await truckService.create(truck)
    res.send({ status: 'success', message: 'Camión creado', result_id: result.insertId })
  } catch (error) {
    console.error('error create truck: ', error)
    res.status(500).send({ status: 'error', error: error.message })
  }
}

const getAllTrucks = async (req, res) => {
  try {
    const trucks = await truckService.getAll()
    res.send({ status: "success", payload: trucks })
  } catch (error) {
    res.status(500).send({ status:"error", error: error.message })
  }
}


export default {
  createTruck,
  getAllTrucks
}