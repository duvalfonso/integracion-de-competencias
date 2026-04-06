import pool from '../utils/dbConnection.js'

export default class Maintenance {
  constructor() {
    this.table = 'maintenances'
  }

  create = async (data) => {
    const query = `INSERT INTO ${this.table}
    (truck_id, maintenance_mileage, type, scheduled_date, description)
    VALUES (?, ?, ?, ?, ?)`
    const [result] = await pool.execute(query, [data.truck_id, data.maintenance_mileage, data.type, data.scheduled_date, data.description])
    return result
  }
  
  startMaintenance = async (id) => {
    const query = `UPDATE ${this.table} SET status = 'en curso', start_date = NOW() WHERE id = ?`
    const [result] = await pool.execute(query, [id])
    return result
  }

  getTruckById = async (truck_id) => {
    const query = `SELECT * FROM ${this.table} WHERE truck_id = ? ORDER BY created_at DESC`
    const [rows] = await pool.execute(query, [truck_id])
    return rows
  }

  completeMaintenance = async (id, truck_id, completion_mileage) => {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // se marca el mantenimiento como completado
      await connection.query(`UPDATE ${this.table} SET status = 'completado', end_date = NOW() WHERE id = ?`, [id])

      // se establece el kilometraje actual como el ultimo de mantemiento y el camion se regresa a estado disponible
      await connection.query(`UPDATE trucks SET last_maintenance_mileage = ?, status = 'disponible' WHERE id = ?`, [completion_mileage, truck_id])

      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
