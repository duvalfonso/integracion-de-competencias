// Endpoints backend usados por el módulo de administración de flota.
const API_TRUCKS_URL = 'http://localhost:8000/api/trucks'
const API_DRIVERS_URL = 'http://localhost:8000/api/trucks/drivers'
const API_REGISTER_URL = 'http://localhost:8000/api/sessions/register'

// Cache local de conductores activos para reutilizar en selects.
let activeDrivers = []

// Muestra mensajes de estado/resultado para acciones de camiones.
const showAlert = (message, type = 'danger') => {
  const alert = document.getElementById('truckAlert')
  if (!alert) return
  alert.textContent = message
  alert.className = `mt-3 text-${type}`
}

// Muestra mensajes de estado/resultado para acciones de conductores.
const showDriverAlert = (message, type = 'danger') => {
  const alert = document.getElementById('driverAlert')
  if (!alert) return
  alert.textContent = message
  alert.className = `mt-3 text-${type}`
}

// Carga conductores activos desde backend y rellena select de asignación.
const loadDrivers = async () => {
  const driverSelect = document.getElementById('truckDriver')
  if (!driverSelect) return

  // Reinicia opciones para evitar duplicados al recargar.
  driverSelect.innerHTML = '<option value="">Selecciona conductor</option>'

  const response = await fetch(API_DRIVERS_URL)
  if (!response.ok) {
    throw new Error('No se pudieron cargar los conductores')
  }

  const data = await response.json()
  // Guarda en memoria para uso en la tabla editable.
  const drivers = Array.isArray(data.payload) ? data.payload : []
  activeDrivers = drivers

  // Render de opciones en select de formulario de camión.
  for (const driver of drivers) {
    const option = document.createElement('option')
    option.value = driver.id
    option.textContent = `${driver.full_name} (${driver.email})`
    driverSelect.appendChild(option)
  }
}

// Construye el select HTML por fila para reasignar conductor en tabla.
const buildDriverSelectHtml = (truckId, selectedDriverId) => {
  const options = ['<option value="">Selecciona conductor</option>']

  for (const driver of activeDrivers) {
    const isSelected = Number(selectedDriverId) === Number(driver.id) ? 'selected' : ''
    options.push(`<option value="${driver.id}" ${isSelected}>${driver.full_name}</option>`)
  }

  return `<select class="form-select form-select-sm js-driver-select" data-truck-id="${truckId}">${options.join('')}</select>`
}

// Carga listado de camiones y lo renderiza en la tabla principal.
const loadTrucks = async () => {
  const tbody = document.getElementById('trucksTableBody')
  if (!tbody) return

  const response = await fetch(API_TRUCKS_URL)
  if (!response.ok) {
    throw new Error('No se pudieron cargar los camiones')
  }

  const data = await response.json()
  const trucks = Array.isArray(data.payload) ? data.payload : []

  tbody.innerHTML = ''

  // Caso vacío: muestra fila informativa en vez de tabla vacía.
  if (trucks.length === 0) {
    const row = document.createElement('tr')
    row.innerHTML = '<td colspan="5" class="text-muted">Sin registros</td>'
    tbody.appendChild(row)
    return
  }

  // Render de filas con conductor editable.
  for (const truck of trucks) {
    const row = document.createElement('tr')
    row.innerHTML = `
      <td>${truck.plate_number || '-'}</td>
      <td>${truck.brand || '-'}</td>
      <td>${truck.model || '-'}</td>
      <td>${truck.year || '-'}</td>
      <td>${buildDriverSelectHtml(truck.id, truck.assigned_driver_id)}</td>
    `
    tbody.appendChild(row)
  }
}

// Actualiza conductor asignado de un camión puntual.
const updateAssignedDriver = async (truckId, driverId) => {
  const response = await fetch(`${API_TRUCKS_URL}/${truckId}/driver`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ assigned_driver_id: Number(driverId) })
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || 'No se pudo actualizar el conductor asignado')
  }
}

// Envía alta de camión nuevo usando datos del formulario.
const registerTruck = async (event) => {
  event.preventDefault()

  const plate = document.getElementById('truckPlate')?.value?.trim()?.toUpperCase()
  const brand = document.getElementById('truckBrand')?.value?.trim()
  const model = document.getElementById('truckModel')?.value?.trim()
  const year = document.getElementById('truckYear')?.value
  const assignedDriverId = document.getElementById('truckDriver')?.value

  // Validación mínima de frontend.
  if (!plate || !brand || !model || !year || !assignedDriverId) {
    showAlert('Completa todos los campos para registrar el camión')
    return
  }

  // Persistencia del camión en backend.
  const response = await fetch(API_TRUCKS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plate_number: plate,
      brand,
      model,
      year: Number(year),
      assigned_driver_id: Number(assignedDriverId)
    })
  })

  const responseData = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(responseData.message || 'No se pudo registrar el camión')
  }

  // Refresca la tabla tras alta exitosa.
  showAlert('Camión registrado correctamente', 'success')
  document.getElementById('truckForm')?.reset()
  await loadTrucks()
}

// Envía alta de conductor nuevo desde módulo de flota.
const registerDriver = async (event) => {
  event.preventDefault()

  const fullName = document.getElementById('driverFullName')?.value?.trim()
  const email = document.getElementById('driverEmail')?.value?.trim()?.toLowerCase()
  const password = document.getElementById('driverPassword')?.value

  // Validación mínima de frontend.
  if (!fullName || !email || !password) {
    showDriverAlert('Completa todos los campos para registrar el conductor')
    return
  }

  // Reutiliza endpoint de registro existente.
  const response = await fetch(API_REGISTER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ full_name: fullName, email, password })
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.status !== 'success') {
    throw new Error(data.error || data.message || 'No se pudo registrar el conductor')
  }

  // Refresca select de conductores para poder asignar inmediatamente.
  showDriverAlert('Conductor registrado correctamente', 'success')
  document.getElementById('newDriverForm')?.reset()
  await loadDrivers()
}

// Inicializa navegación lateral (secciones + colapso desktop + toggle móvil).
const initSidebar = () => {
  const sidebarLinks = document.querySelectorAll('.adm-sidebar-link[data-section-target]')
  const sections = document.querySelectorAll('.adm-section')
  const toggleBtnDesktop = document.getElementById('toggleSidebarBtn')
  const toggleBtnMobile = document.getElementById('toggleSidebarBtnMobile')
  const sidebarCol = document.getElementById('sidebarCol')
  const sidebar = document.getElementById('admSidebar')
  const contentCol = document.getElementById('contentCol')

  // Utilidad para distinguir comportamiento desktop/móvil.
  const isDesktop = () => window.matchMedia('(min-width: 992px)').matches

  // Muestra una sección y oculta las demás.
  const showSection = (targetId) => {
    sections.forEach((section) => {
      section.classList.toggle('d-none', section.id !== targetId)
    })
  }

  // Manejo de click en links del sidebar.
  sidebarLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const targetId = link.dataset.sectionTarget
      if (!targetId) return

      sidebarLinks.forEach((item) => item.classList.remove('active'))
      link.classList.add('active')
      showSection(targetId)

      // En móvil, cierra menú al elegir sección para mejorar UX.
      if (!isDesktop()) {
        sidebarCol?.classList.add('d-none')
      }
    })
  })

  // Toggle desktop: colapsa sidebar mostrando solo iconos.
  if (toggleBtnDesktop && sidebarCol && sidebar && contentCol) {
    toggleBtnDesktop.addEventListener('click', () => {
      const collapsed = sidebar.classList.toggle('is-collapsed')
      if (collapsed) {
        sidebarCol.classList.remove('col-lg-3')
        sidebarCol.classList.add('col-lg-1')
        contentCol.classList.remove('col-lg-9')
        contentCol.classList.add('col-lg-11')
      } else {
        sidebarCol.classList.remove('col-lg-1')
        sidebarCol.classList.add('col-lg-3')
        contentCol.classList.remove('col-lg-11')
        contentCol.classList.add('col-lg-9')
      }
    })
  }

  // Toggle móvil: muestra/oculta sidebar completo.
  if (toggleBtnMobile && sidebarCol) {
    toggleBtnMobile.addEventListener('click', () => {
      sidebarCol.classList.toggle('d-none')
    })
  }

  // Carga inicial de sección activa.
  const activeLink = document.querySelector('.adm-sidebar-link.active[data-section-target]')
  showSection(activeLink?.dataset.sectionTarget || 'registerTruckSection')
}

// Inicialización principal del módulo al cargar DOM.
document.addEventListener('DOMContentLoaded', async () => {
  initSidebar()

  try {
    // Carga inicial de catálogos y listado.
    await loadDrivers()
    await loadTrucks()
  } catch (error) {
    showAlert(error.message || 'Error al cargar datos iniciales')
  }

  // Bind de formulario de alta de camión.
  const form = document.getElementById('truckForm')
  if (form) {
    form.addEventListener('submit', async (event) => {
      try {
        await registerTruck(event)
      } catch (error) {
        showAlert(error.message || 'Error al registrar camión')
      }
    })
  }

  // Bind de edición rápida de conductor en tabla.
  const trucksTableBody = document.getElementById('trucksTableBody')
  if (trucksTableBody) {
    trucksTableBody.addEventListener('change', async (event) => {
      const select = event.target.closest('.js-driver-select')
      if (!select) return

      const truckId = select.dataset.truckId
      const driverId = select.value

      if (!truckId || !driverId) {
        showAlert('Selecciona un conductor válido para asignar', 'danger')
        return
      }

      try {
        await updateAssignedDriver(truckId, driverId)
        showAlert('Conductor actualizado correctamente', 'success')
      } catch (error) {
        showAlert(error.message || 'Error al actualizar conductor', 'danger')
        await loadTrucks()
      }
    })
  }

  // Bind de formulario de alta de conductor.
  const newDriverForm = document.getElementById('newDriverForm')
  if (newDriverForm) {
    newDriverForm.addEventListener('submit', async (event) => {
      try {
        await registerDriver(event)
      } catch (error) {
        showDriverAlert(error.message || 'Error al registrar conductor')
      }
    })
  }
})
