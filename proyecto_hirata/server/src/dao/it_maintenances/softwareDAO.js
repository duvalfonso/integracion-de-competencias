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
  
  // Validar que el equipo exista
  const [equipment] = await pool.execute('SELECT id FROM it_equipment WHERE id = ?', [equipment_id])
  if (!equipment || equipment.length === 0) {
    throw new Error('equipo_no_existe')
  }
  
  // Validar que el software exista
  const [software] = await pool.execute('SELECT id FROM software WHERE id = ?', [software_id])
  if (!software || software.length === 0) {
    throw new Error('software_no_existe')
  }
  
  const query = `
  INSERT INTO it_equipment_software (equipment_id, software_id, install_date, notes)
  VALUES (?, ?, ?, ?)`
  const [result] = await pool.execute(query, [equipment_id, software_id, install_date, notes || null])
  return result
}

  getInstallations = async () => {
    const query = `
    SELECT 
      ies.id,
      ies.equipment_id,
      ies.software_id,
      ies.install_date as installation_date,
      ies.notes as note,
      ie.inventory_code,
      ie.model as equipment_model,
      ie.type as equipment_type,
      s.name as software_name,
      s.version as software_version,
      s.license_type
    FROM it_equipment_software ies
    INNER JOIN it_equipment ie ON ies.equipment_id = ie.id
    INNER JOIN software s ON ies.software_id = s.id
    ORDER BY ies.install_date DESC`
    const [result] = await pool.execute(query)
    return result
  }

  getInstallationById = async (id) => {
    const query = `
    SELECT 
      ies.id,
      ies.equipment_id,
      ies.software_id,
      ies.install_date as installation_date,
      ies.notes as note,
      ie.inventory_code,
      ie.model as equipment_model,
      ie.type as equipment_type,
      ie.location,
      ie.serial_number,
      s.name as software_name,
      s.version as software_version,
      s.license_type,
      s.expiration_date
    FROM it_equipment_software ies
    INNER JOIN it_equipment ie ON ies.equipment_id = ie.id
    INNER JOIN software s ON ies.software_id = s.id
    WHERE ies.id = ?`
    const [result] = await pool.execute(query, [id])
    return result
  }
}