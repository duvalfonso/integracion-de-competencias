import pool from '../utils/dbConnection.js'
import MileageModel from './models/mileage.model.js'

export default class Mileage {
  constructor() {
    this.table = MileageModel.table
  }

  get = async () => {
    const query = `SELECT * FROM ${this.table}` 
    const [result] = await pool.execute(query)
    return result
  }

  save = async (doc) => {
    const connection = await pool.getConnection()
    try {
      const { truck_id, driver_id, mileage_value } = doc
      await connection.beginTransaction()

      const insertQuery = `INSERT INTO ${this.table} (truck_id, driver_id, mileage_value, registration_date) VALUES (?, ?, ?, NOW())`
      await connection.execute(insertQuery, [truck_id, driver_id, mileage_value])

      const updateQuery = `UPDATE trucks SET total_mileage = ? WHERE id = ?`

      const [updateResult] = await connection.execute(updateQuery, [mileage_value, truck_id])
      if(updateResult.affectedRows === 0) {
        throw new Error("No se pudo actualizar información del vehículo")
      }

      await connection.commit()
    } catch (error) {
      await connection.rollback()
      throw error      
    } finally {
      connection.release()
    }
  }
}
