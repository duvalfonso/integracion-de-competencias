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

  save = async ({ driver_id, mileage_value, registration_date }) => {
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      const [assignment] = await connection.query(
        `SELECT * FROM truck_driver
        WHERE driver_id = ? AND active = true
        FOR UPDATE`,
        [driver_id]
      )

      if(assignment.length === 0) {
        throw new Error('El conductor no tiene un camion asignado')
      }

      const truck_id = assignment[0].truck_id

      const [truckRows] = await connection.query(
        `SELECT total_mileage, last_maintenance_mileage
        FROM trucks
        WHERE id = ?
        FOR UPDATE`,
        [truck_id]
      )

      if(truckRows === 0) {
        throw new Error('Vehiculo no encontrado')
      }

      const truck = truckRows[0]

      if(mileage_value <= truck.total_mileage) {
        throw new Error(`El kilometraje debe ser mayor a ${truck.total_mileage}`)
      }

      await connection.query(
        `INSERT INTO ${this.table}
        (truck_id, driver_id, mileage_value, registration_date)
        VALUES (?, ?, ?, ?)`,
        [truck_id, driver_id, mileage_value, registration_date ? registration_date : NOW()]
      )

      const mileageSinceLastService = mileage_value - truck.last_maintenance_mileage

      const needsMaintenance = mileageSinceLastService >= truck.maintenance_threshold

      await connection.query(
        `UPDATE trucks
        SET total_mileage = ?, status = ?
        WHERE id = ?`,
        [
          mileage_value, 
          needsMaintenance ? 'en mantenimiento' : 'disponible',
          truck_id
        ]
      )

      await connection.query(
        `UPDATE truck_driver
        SET 
          active = false,
          ended_at = ?
        WHERE id = ?`,
        [
          registration_date || new Date(),
          assignment[0].id
        ]
      )

      await connection.commit()
      return { 
        success: true,
        maintenanceAlert: needsMaintenance,
        details: {
          currentMileage: mileage_value,
          mileageForNextService: Math.max(0, truck.maintenance_threshold - mileageSinceLastService)
        }
      }
      
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }
}
