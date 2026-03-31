import GenericRepository from "./GenericRepository.js";

export default class TruckRepository extends GenericRepository {
  constructor(dao) {
    super(dao)
  }

  getById = async (id) => {
    return this.getBy({ id })
  }

  getByPlateNumber = async (plate) => {
    return this.getBy({ plate })
  }

  getByStatus = async (status) => {
    return this.getBy({ status })
  }

  updateMileage = async (id, newMileage) => {
    return this.update({ id, newMileage })
  }
}
