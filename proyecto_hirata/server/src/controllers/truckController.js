import { truckService } from "../services/index.js";

const getAllTrucks = async (req, res) => {
  try {
    const trucks = await truckService.getAll()
    res.send({ status: "success", payload: trucks })
  } catch (error) {
    res.status(500).send({ status:"error", error: error.message })
  }
}


export default {
  getAllTrucks
}