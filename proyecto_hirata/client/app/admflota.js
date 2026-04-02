// Endpoints backend usados por el módulo de administración de flota.
const API_TRUCKS_URL = 'http://localhost:8000/api/trucks'
const API_DRIVERS_URL = 'http://localhost:8000/api/users'
const API_REGISTER_URL = 'http://localhost:8000/api/sessions/register'
const API_ASSIGNMENTS_URL = 'http://localhost:8000/api/assignments'

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

  const response = await fetch(API_DRIVERS_URL, {
    method: "GET",
    credentials: "include",
    headers: {
      'Content-type': 'application/json'
    }
  })
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
const buildDriverSelect = (truckId, selectedDriverId) => {
  const container = document.createElement('div');
  container.className = 'd-flex gap-2';

  // SELECT
  const select = document.createElement('select');
  select.className = 'form-select form-select-sm js-driver-select';
  select.dataset.truckId = truckId;

  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Selecciona conductor';
  select.appendChild(defaultOption);

  for (const driver of activeDrivers) {
    const option = document.createElement('option');
    option.value = driver.id;
    option.textContent = driver.full_name;

    if (Number(selectedDriverId) === Number(driver.id)) {
      option.selected = true;
    }

    select.appendChild(option);
  }

  // BOTÓN
  const button = document.createElement('button');
  button.className = 'btn btn-primary btn-sm js-assign-btn';
  button.dataset.truckId = truckId;
  button.textContent = 'Asignar';

  container.appendChild(select);
  container.appendChild(button);

  return container;
};

// Carga listado de camiones y lo renderiza en la tabla principal.
const loadTrucks = async () => {
  const tbody = document.getElementById('trucksTableBody');
  if (!tbody) return;

  // 🔥 traer trucks + assignments
  const [trucksRes, assignmentsRes] = await Promise.all([
    fetch(API_TRUCKS_URL, { credentials: "include" }),
    fetch(API_ASSIGNMENTS_URL, { credentials: "include" })
  ]);

  if (!trucksRes.ok) throw new Error('No se pudieron cargar los camiones');
  if (!assignmentsRes.ok) throw new Error('No se pudieron cargar las asignaciones');

  const trucksData = await trucksRes.json();
  const assignmentsData = await assignmentsRes.json();

  const trucks = Array.isArray(trucksData.payload) ? trucksData.payload : [];
  const assignments = Array.isArray(assignmentsData.payload) ? assignmentsData.payload : [];

  // 🔥 mapa truck_id → driver_id
  const assignmentMap = {};
  for (const a of assignments) {
    assignmentMap[a.truck_id] = a.driver_id;
  }

  tbody.innerHTML = '';

  if (trucks.length === 0) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="5" class="text-muted">Sin registros</td>';
    tbody.appendChild(row);
    return;
  }

  for (const truck of trucks) {
    const assignedDriverId = assignmentMap[truck.id] || null;

    const row = document.createElement('tr');

    row.innerHTML = `
      <td>${truck.plate_number || '-'}</td>
      <td>${truck.brand || '-'}</td>
      <td>${truck.model || '-'}</td>
      <td>${truck.year || '-'}</td>
    `;

    const driverCell = document.createElement('td');
    driverCell.appendChild(buildDriverSelect(truck.id, assignedDriverId));

    row.appendChild(driverCell);
    tbody.appendChild(row);
  }
};

// Actualiza conductor asignado de un camión puntual.
const assignTruckToDriver = async (truckId, driverId) => {
  const response = await fetch(`${API_ASSIGNMENTS_URL}/assign`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      driver_id: Number(driverId),
      truck_id: Number(truckId)
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'No se pudo asignar el vehículo');
  }

  return data;
};

// Work in Progress
// Reemplazar un conductor asignado a un camion.
const reassignTruck = async (truckId, driverId) => {
  const response = await fetch(`${API_ASSIGNMENTS_URL}/reassign`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      driver_id: Number(driverId),
      truck_id: Number(truckId)
    })
  })

  const data = await response.json()

  if(!response.ok) {
    throw new Error(data.error || 'No se pudo reasignar')
  }

  return data
}

// Envía alta de camión nuevo usando datos del formulario.
const registerTruck = async (event) => {
  event.preventDefault()

  const plate_number = document.getElementById('truckPlate')?.value?.trim()?.toUpperCase()
  const brand = document.getElementById('truckBrand')?.value?.trim()
  const model = document.getElementById('truckModel')?.value?.trim()
  const year = document.getElementById('truckYear')?.value
  const assignedDriverId = document.getElementById('truckDriver')?.value

  // Validación mínima de frontend.
  // Conductor asignado debe ser un campo opcional, ya que existe la posibilidad de que no hayan conductores disponibles para asignar y aún así se requiere registrar un vehículo nuevo
  if (!plate_number || !brand || !model || !year) {
    showAlert('Completa todos los campos para registrar el camión')
    return
  }

  const truckData = {
    plate_number,
    brand,
    model,
    year: Number(year)
  }

  if(assignedDriverId) {
    truckData.assigned_driver_id = Number(assignedDriverId)
  }

  // Persistencia del camión en backend.
  const response = await fetch(API_TRUCKS_URL, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(truckData)
  })

  const responseData = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(responseData.error || 'No se pudo registrar el camión')
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
    credentials: 'include',
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
  const trucksTableBody = document.getElementById('trucksTableBody');

if (trucksTableBody) {
  trucksTableBody.addEventListener('click', async (event) => {
    const btn = event.target.closest('.js-assign-btn');
    if (!btn) return;

    const truckId = btn.dataset.truckId;

    const select = trucksTableBody.querySelector(
      `.js-driver-select[data-truck-id="${truckId}"]`
    );

    const driverId = select.value;

    if (!driverId) {
      showAlert('Selecciona un conductor válido', 'danger');
      return;
    }

    try {
      await assignTruckToDriver(truckId, driverId);
      showAlert('Vehículo asignado correctamente', 'success');
      await loadTrucks();
    } catch (error) {
      if(error.message.includes('ya está en uso')) {
        const confirmReplace = confirm('Este camión ya tiene un conductor asignado. \n¿Deseas reemplazarlo?')
        if(!confirmReplace) return
        await reassignTruck(truckId, driverId)
        showAlert('Vehículo asignado correctamente', 'success');
      }
    }
  });
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
