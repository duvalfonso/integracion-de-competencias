import GenericRepository from "./GenericRepository.js";

export default class MaintenanceRepository extends GenericRepository {
  constructor(dao) {
    super(dao)
  }

  createMaintenance = async (data) => await this.dao.create(data)
  
  startMaintenance = async (id) => await this.dao.startMaintenance(id)

  getMaintenancesByTruck = async (tid) => await this.dao.getTruckById(tid)

  finishMaintenance = async (id, truck_id, mileage) => {
    await this.dao.completeMaintenance(id, truck_id, mileage)
  }
}
