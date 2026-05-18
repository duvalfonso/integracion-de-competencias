import { softareService } from "../../services/index.js";

const getAllSoftware = async (req, res) => {
  try {
    const softwareList = await softareService.getAll()
    res.send({ status: 'success', payload: softwareList })
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message })
  }
}

const addSoftware = async (req, res) => {
  try {
    const { name, version, license_type, expiration_date } = req.body
    if (!name || !license_type) {
      return res.status(400).send({ status: 'error', error: 'Nombre y Licencia son campos obligatorios.' })
    }

    const softwareData = {
      name,
      version: version || null,
      license_type,
      expiration_date: expiration_date || null
    }

    const result = await softareService.create(softwareData)
    res.send({ status: 'success', message: 'Software registrado.', result_id: result.insertId })
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message })
  }
}

const installSoftware = async (req, res) => {
  try {
    const { equipment_id, software_id, install_date, notes } = req.body
    
    if (!equipment_id || !software_id || !install_date) {
      return res.status(400).send({ status: 'error', error: 'Equipo, Software y Fecha de Instalación son campos obligatorios.' })
    }

    const installData = {
      equipment_id,
      software_id,
      install_date,
      notes: notes || null
    }

    const result = await softareService.install(installData)
    res.send({ status: 'success', message: 'Software asociado al equipo.', result_id: result.insertId })
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message })
  }
}

const getInstallations = async (req, res) => {
  try {
    const installations = await softareService.getInstallations()
    res.send({ status: 'success', payload: installations })
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message })
  }
}

const getInstallationById = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) {
      return res.status(400).send({ status: 'error', error: 'ID es requerido.' })
    }
    const installation = await softareService.getInstallationById(id)
    res.send({ status: 'success', payload: installation })
  } catch (error) {
    res.status(500).send({ status: 'error', error: error.message })
  }
}

export default {
  getAllSoftware,
  addSoftware,
  installSoftware,
  getInstallations,
  getInstallationById
}