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
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Validar driver sin asignación activa
      const [driverActive] = await connection.query(
        `SELECT * FROM truck_driver 
        WHERE driver_id = ? AND active = true 
        FOR UPDATE`,
        [driver_id]
      )

      if (driverActive.length > 0) {
        throw new Error('El conductor ya tiene un camión asignado')
      }

      // Validar truck sin asignación activa
      const [truckActive] = await connection.query(
        `SELECT * FROM truck_driver 
        WHERE truck_id = ? AND active = true 
        FOR UPDATE`,
        [truck_id]
      )

      if (truckActive.length > 0) {
        throw new Error('El camión ya está en uso')
      }

      // Crear asignación
      const [result] = await connection.query(
        `INSERT INTO truck_driver (driver_id, truck_id, active, assigned_at)
        VALUES (?, ?, true, NOW())`,
        [driver_id, truck_id]
      )

      // Actualizar estado del camión
      await connection.query(
        `UPDATE trucks SET status = 'en uso' WHERE id = ?`,
        [truck_id]
      )

      await connection.commit()
      return result

    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  }

  reassign = async ({ driver_id, truck_id }) => {
    const connection = await pool.getConnection()

    try {
      await connection.beginTransaction()

      // Obtener asignación activa del camión
      const [current] = await connection.query(
        `SELECT * FROM truck_driver 
        WHERE truck_id = ? AND active = true 
        FOR UPDATE`,
        [truck_id]
      )

      if (current.length === 0) {
        throw new Error('El camión no tiene asignación activa')
      }

      // Desactivar asignación actual
      await connection.query(
        `UPDATE truck_driver 
        SET active = false 
        WHERE id = ?`,
        [current[0].id]
      )

      // Crear nueva asignación
      const [result] = await connection.query(
        `INSERT INTO truck_driver (driver_id, truck_id, active, assigned_at)
        VALUES (?, ?, true, NOW())`,
        [driver_id, truck_id]
      )

      await connection.commit()
      return result

    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
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