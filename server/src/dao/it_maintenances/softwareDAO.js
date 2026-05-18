import pool from "../../utils/dbConnection.js";

export default class Software {
  constructor() {
    this.table = 'software'
  }

  get = async () => {
    const query = `SELECT * FROM ${this.table}`
    const [result] = await pool.execute(query)
    return result
  }

  getById = async (id) => {
    const query = `SELECT * FROM ${this.table} WHERE id = ?`
    const [result] = await pool.execute(query, [id])
    return result
  }

  save = async (data) => {
    const { name, version, license_type, expiration_date } = data
    const query = `
    INSERT INTO ${this.table} (name, version, license_type, expiration_date)
    VALUES (?, ?, ?, ?)`
    const [result] = await pool.execute(query,[name, version || null, license_type, expiration_date || null])
    return result
  }

  install = async (data) => {
    const { equipment_id, software_id, install_date, notes } = data
    const query = `
    INSERT INTO it_equipment_software (equipment_id, software_id, install_date, notes)
    VALUES (?, ?, ?, ?)`
    const [result] = await pool.execute(query, [equipment_id, software_id, install_date, notes || null])
    return result
  }

  update = async () => {
    // TODO: Implementar un metodo de actualización de versión del software en la DB
  }
}