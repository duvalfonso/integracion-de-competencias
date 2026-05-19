import GenericRepository from "../GenericRepository.js";

export default class SoftwareRepository extends GenericRepository {
  constructor(dao) {
    super(dao)
  }

  getById = async (id) => {
    return this.getBy({ id })
  }

  install = async (data) => {
    return await this.dao.install(data)
  }

  getInstallations = async () => {
    return await this.dao.getInstallations()
  }

  getInstallationById = async (id) => {
    return await this.dao.getInstallationById(id)
  }
}