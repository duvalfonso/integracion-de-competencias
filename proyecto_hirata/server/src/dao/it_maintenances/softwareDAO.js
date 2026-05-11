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
    const { name, version, license_type } = data
    const query = `
    INSERT INTO ${this.table} (name, version, license_type)
    VALUES (?, ?, ?)`
    const [result] = await pool.execute(query,[name, version, license_type])
    return result
  }

  update = async () => {
    // TODO: Implementar un metodo de actualización de versión del software en la DB
  }
}