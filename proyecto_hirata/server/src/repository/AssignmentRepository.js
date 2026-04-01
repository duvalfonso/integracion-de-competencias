import GenericRepository from "./GenericRepository.js";

export default class AssignmentRepository extends GenericRepository {
  constructor(dao) {
    super(dao)
  }

  assignTruck = async (doc) => {
    return this.dao.assign(doc)
  }

  getTruckByDriver = async (driver_id) => {
    return this.dao.getTruckByDriver(driver_id)
  }

  // TODO agregar metodo para reasignar un conductor a un camión y modificar su estado.
}