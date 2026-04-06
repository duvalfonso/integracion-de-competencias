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

      // Se obtienen los datos del camión y su asignación activa
      const [assignmentRows] = await connection.query(
        `SELECT td.id, td.truck_id, t.plate_number, t.total_mileage, t.last_maintenance_mileage, t.maintenance_threshold
        FROM truck_driver td
        JOIN trucks t ON td.truck_id = t.id
        WHERE td.driver_id = ? AND td.active = true
        FOR UPDATE`,
        [driver_id]
      )

      if(assignmentRows.length === 0) {
        throw new Error('El conductor no tiene un camion asignado')
      }
      const truck = assignmentRows[0]

      // Se prioriza el último mantenimiento real completado para evitar depender de múltiplos exactos.
      const [maintenanceRows] = await connection.query(
        `SELECT maintenance_mileage
        FROM maintenances
        WHERE truck_id = ?
          AND status = 'completado'
          AND active = true
        ORDER BY maintenance_mileage DESC, id DESC
        LIMIT 1`,
        [truck.truck_id]
      )

      const latestCompletedMaintenanceMileage = maintenanceRows.length > 0
        ? Number(maintenanceRows[0].maintenance_mileage) || 0
        : 0
      const effectiveLastMaintenanceMileage = Math.max(
        Number(truck.last_maintenance_mileage) || 0,
        latestCompletedMaintenanceMileage
      )

      // Validación de kilometraje correcto
      if(mileage_value <= truck.total_mileage) {
        throw new Error(`El kilometraje debe ser mayor a ${truck.total_mileage}`)
      }

      // Registrar el kilometraje
      await connection.query(
        `INSERT INTO ${this.table}
        (truck_id, driver_id, mileage_value, registration_date)
        VALUES (?, ?, ?, ?)`,
        [truck.truck_id, driver_id, mileage_value, registration_date || new Date()]
      )

      // Logica de manteninmiento
      const previousMileageSinceLastService = truck.total_mileage - effectiveLastMaintenanceMileage
      const mileageSinceLastService = mileage_value - effectiveLastMaintenanceMileage
      const needsMaintenance = mileageSinceLastService >= truck.maintenance_threshold
      const maintenanceThreshold = truck.maintenance_threshold
      const previousThresholdBlock = maintenanceThreshold > 0
        ? Math.floor(previousMileageSinceLastService / maintenanceThreshold)
        : 0
      const currentThresholdBlock = maintenanceThreshold > 0
        ? Math.floor(mileageSinceLastService / maintenanceThreshold)
        : 0
      const shouldSendMaintenanceNotification = currentThresholdBlock > previousThresholdBlock

      // Actualizar camion
      await connection.query(
        `UPDATE trucks
        SET total_mileage = ?, status = ?, last_maintenance_mileage = ?
        WHERE id = ?`,
        [
          mileage_value, 
          needsMaintenance ? 'en mantenimiento' : 'en uso',
          effectiveLastMaintenanceMileage,
          truck.truck_id
        ]
      )

      // Generar notificaciones cuando cruza un nuevo bloque de mantenimiento (5000, 10000, 15000, etc.)
      if(shouldSendMaintenanceNotification) {
        const [recipients] = await connection.query(
          //Buscar los roles correspondientes a admin, superadmin y mantenimiento activos
          `SELECT id FROM users WHERE role_id IN (1, 2, 4) AND active = true`
        )

        if(recipients.length > 0) {
          const title = `Mantenimiento Requerido`
          const message = `El vehículo [${truck.plate_number}] alcanzó ${mileageSinceLastService} km desde su último mantenimiento.`
          const type = 'mantenimiento'
          const reference_type = 'truck'

          // Preparación de insert masivo iterando los todos los usuarios resultantes de los roles obtenidos.
          const notificationValues = recipients.map(user => [
            user.id, title, message, type, truck.truck_id, reference_type
          ])

          await connection.query(
            `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES ?`,
            [notificationValues]
          )
        }
      }

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
