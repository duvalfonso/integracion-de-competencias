import pool from "../utils/dbConnection.js";
import AssigmentModel from "./models/assignment.model.js"

export default class Assignment {
  constructor() {
    this.table = AssigmentModel.table
  }

  get = async () => {
    const query = `SELECT * FROM ${this.table}`
    const [result] = await pool.execute(query)
    return result
  }

  getBy = async (params) => {
    const key = Object.key(params)[0]
    const value = Object.values(params)[0]

    const query = `SELECT * FROM ${this.table} WHERE ${key} = ? LIMIT 1`
    const [result] = await pool.execute(query, [value])
    return result[0]
  }

  assign = async ({ driver_id, truck_id }) => {
    const query = `
      INSERT INTO ${this.table} (driver_id, truck_id)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE truck_id = VALUES(truck_id)
    `
    const [result] = await pool.execute(query, [driver_id, truck_id])
    return result
  }

  getTruckByDriver = async (driver_id) => {
    const query = `
      SELECT t.*
      FROM trucks t
      JOIN truck_driver dt ON dt.truck_id = t.id
      WHERE dt.driver_id = ?
      LIMIT 1
    `
    const [result] = await pool.execute(query, [driver_id])
    return result[0]
  }

  // TODO: agregar metodo para cambiar estado de asignamiento en tabla trucks
}