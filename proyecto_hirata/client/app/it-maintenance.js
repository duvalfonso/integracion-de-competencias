import { requestJson, renderSidebar, escapeHtml, setAlert, toDateTimeLocal } from './shared.js';

export async function init() {
    console.log("Módulo de Mantenimiento IT inicializado");
    
    // Renderizar sidebar específico para IT Mantenimiento
    renderSidebar('sidebarCol', [
        { label: 'Registrar Mantenimiento', icon: 'bi bi-tools', target: 'registerItMaintenanceSection', active: true },
        { label: 'Agregar Equipos', icon: 'bi bi-plus-square', target: 'addEquipmentSection', active: false },
        { label: 'Añadir nuevo Software', icon: 'bi bi-folder-plus', target: 'addSoftwareSection', active: false },
        { label: 'Implementación<br>de Software', icon: 'bi bi-file-earmark-arrow-down', target: 'installSoftwareSection', active: false },
        { label: 'Historial<br>de Mantenimientos', icon: 'bi bi-clock-history', target: 'historySection', active: false },
        { label: 'Historial<br>de Software', icon: 'bi bi-clock-history', target: 'historySoftwareSection', active: false },
        { label: 'Inventario de Piezas', icon: 'bi bi-box-seam', target: 'partsInventorySection', active: false },
        { label: 'Registrar Pieza', icon: 'bi bi-plus-square', target: 'registerPartSection', active: false }
    ], 'it_sidebar_collapsed');

    const form = document.getElementById('formItMaintenance');
    const selectEquipment = document.getElementById('equipment_id');
    const selectInstallEquipment = document.getElementById('install_equipment_id');
    const selectInstallSoftware = document.getElementById('install_software_id');
    const partsUsedTableBody = document.getElementById('partsUsedTableBody');
    const btnAddUsedPartRow = document.getElementById('btnAddUsedPartRow');
    const historySection = document.getElementById('historySection');
    const historySoftwareSection = document.getElementById('historySoftwareSection');
    const alertContainer = document.getElementById('responseAlert');
    let equipmentsCache = [];
    let partsCache = [];

    function normalizeNumber(value, fallback = 0) {
        const number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function setPartsUsedEmptyState() {
        if (!partsUsedTableBody) return;
        const emptyRow = document.getElementById('partsUsedEmptyRow');
        if (!emptyRow) return;
        const hasRows = partsUsedTableBody.querySelectorAll('tr.parts-used-row').length > 0;
        emptyRow.classList.toggle('d-none', hasRows);
    }

    function createPartOptions(selectedPartId = '') {
        const placeholder = `<option value="" ${selectedPartId ? '' : 'selected'} disabled>Seleccione una pieza...</option>`;
        const options = partsCache.map((part) => {
            const criticalStock = normalizeNumber(part.critical_stock ?? part.min_stock, 0);
            return `<option value="${part.id}" ${String(part.id) === String(selectedPartId) ? 'selected' : ''}>${escapeHtml(part.part_name)}${criticalStock ? ` (mín. ${criticalStock})` : ''}</option>`;
        }).join('');
        return placeholder + options;
    }

    function addPartUsedRow(partId = '', quantity = 1) {
        if (!partsUsedTableBody) return;
        const emptyRow = document.getElementById('partsUsedEmptyRow');
        if (emptyRow) emptyRow.remove();

        const tr = document.createElement('tr');
        tr.className = 'parts-used-row';
        tr.innerHTML = `
            <td>
              <select class="form-select form-select-sm part-used-select" required>
                ${createPartOptions(partId)}
              </select>
            </td>
            <td>
              <input type="number" class="form-control form-control-sm part-used-quantity" min="1" value="${normalizeNumber(quantity, 1)}" required>
            </td>
            <td>
              <button type="button" class="btn btn-sm btn-outline-danger remove-part-row-btn">
                <i class="bi bi-trash"></i>
              </button>
            </td>
        `;

        tr.querySelector('.remove-part-row-btn').addEventListener('click', () => {
            tr.remove();
            if (!partsUsedTableBody.querySelector('.parts-used-row')) {
                partsUsedTableBody.innerHTML = '<tr class="text-muted" id="partsUsedEmptyRow"><td colspan="3" class="text-center">No hay piezas agregadas.</td></tr>';
            }
            setPartsUsedEmptyState();
        });

        partsUsedTableBody.appendChild(tr);
        setPartsUsedEmptyState();
    }

    async function loadPartsCatalog() {
        try {
            const res = await requestJson('http://localhost:8000/api/ti/parts', { credentials: 'include' });
            const parts = res.payload || res;
            partsCache = Array.isArray(parts) ? parts : [];
            if (!partsUsedTableBody) return;
            if (!document.querySelector('.parts-used-row')) {
                addPartUsedRow();
            }
        } catch (error) {
            showFeedback('No se pudo cargar el catálogo de piezas: ' + error.message, 'warning', 'responseAlert');
        }
    }

    function collectPartsUsed() {
        if (!partsUsedTableBody) return [];
        return Array.from(partsUsedTableBody.querySelectorAll('.parts-used-row')).map((row) => {
            const partId = row.querySelector('.part-used-select')?.value;
            const quantity = row.querySelector('.part-used-quantity')?.value;
            return {
                part_id: Number(partId),
                quantity_used: Number(quantity)
            };
        }).filter((item) => Number.isFinite(item.part_id) && item.part_id > 0 && Number.isFinite(item.quantity_used) && item.quantity_used > 0);
    }

    // 2. Manejar el envío del formulario de mantenimiento
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        const partsUsed = collectPartsUsed();
        data.partsUsed = partsUsed;

        try {
            const response = await requestJson('http://localhost:8000/api/ti/maintenances', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (response) {
                setAlert(alertContainer, 'Registro de mantenimiento guardado correctamente.', 'success');
                form.reset();
                if (partsUsedTableBody) {
                    partsUsedTableBody.innerHTML = '<tr class="text-muted" id="partsUsedEmptyRow"><td colspan="3" class="text-center">No hay piezas agregadas.</td></tr>';
                    setPartsUsedEmptyState();
                }
                await loadEquipments();
                await loadMaintenanceHistory();
            }
        } catch (error) {
            setAlert(alertContainer, 'No se pudo guardar el registro: ' + error.message, 'danger');
        }
    });

    // 3. Manejar el envío del formulario Agregar Equipo
    const formAddEquipment = document.getElementById('formAddEquipment');
    formAddEquipment.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formAddEquipment);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await requestJson('http://localhost:8000/api/ti/equipments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (response && response.status === 'success') {
                showFeedback('Equipo agregado correctamente.', 'success', 'responseAlertAddEquipment');
                formAddEquipment.reset();
                // Actualizar la lista del selector de equipos en el formulario de mantenimiento
                await loadEquipments();
                await loadMaintenanceHistory();
            }
        } catch (error) {
            showFeedback('No se pudo agregar el equipo: ' + error.message, 'danger', 'responseAlertAddEquipment');
        }
    });

    // Encapsulamos la carga de equipos para reutilizarla
    async function loadEquipments() {
        try {
            // Ajustamos cómo leemos la respuesta del backend
            const res = await requestJson('http://localhost:8000/api/ti/equipments');
            // La API de equipments devuelve { status: 'success', payload: [...] }
            const equipments = res.payload || res; 
            equipmentsCache = Array.isArray(equipments) ? equipments : [];

            selectEquipment.innerHTML = '<option value="" selected disabled>Seleccione un equipo...</option>';
            if(selectInstallEquipment) selectInstallEquipment.innerHTML = '<option value="" selected disabled>Seleccione un equipo...</option>';
            
            if (Array.isArray(equipments)) {
                equipments.forEach(eq => {
                    // Para Registrar Mantenimiento
                    const option = document.createElement('option');
                    option.value = eq.id;
                    option.textContent = `[${eq.inventory_code}] ${eq.model} - ${eq.type}`;
                    selectEquipment.appendChild(option);
                    
                    // Para Instalar/Actualizar Software
                    if(selectInstallEquipment) {
                        const optionInstall = document.createElement('option');
                        optionInstall.value = eq.id;
                        optionInstall.textContent = `[${eq.inventory_code}] ${eq.model} - ${eq.type}`;
                        selectInstallEquipment.appendChild(optionInstall);
                    }
                });
            }
        } catch (error) {
            showFeedback('Error al cargar equipos: ' + error.message, 'danger', 'responseAlert');
        }
    }

    // Cargar equipos inicialmente
    await loadEquipments();
    await loadPartsCatalog();
    // Cargar historial de mantenimientos
    await loadMaintenanceHistory();

    if (btnAddUsedPartRow) {
        btnAddUsedPartRow.addEventListener('click', () => addPartUsedRow());
    }

    // =============== LOGICA DE SOFTWARE ===============

    // 4. Manejar el envío del Catálogo de Software
    const formAddSoftware = document.getElementById('formAddSoftware');
    formAddSoftware.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formAddSoftware);
        const data = Object.fromEntries(formData.entries());

        // Limpiar el string vacio de expiración si viene vacío (en DB es nulo o fecha)
        if (!data.expiration_date) {
            delete data.expiration_date;
        }

        try {
            const response = await requestJson('http://localhost:8000/api/ti/software', { // Supondremos que esta ruta existe
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (response && response.status === 'success') {
                showFeedback('Software añadido al catálogo correctamente.', 'success', 'responseAlertSoftware');
                formAddSoftware.reset();
                await loadSoftware(); // Recargar el combobox de actualizar software
            }
        } catch (error) {
            showFeedback('No se pudo añadir el software: ' + error.message, 'danger', 'responseAlertSoftware');
        }
    });

    // 5. Manejar el envío para Instalar/Actualizar Software
    const formInstallSoftware = document.getElementById('formInstallSoftware');
    formInstallSoftware.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(formInstallSoftware);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await requestJson('http://localhost:8000/api/ti/software/install', { // Supondremos ruta
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(data)
            });

            if (response && response.status === 'success') {
                showFeedback('Actualización/Instalación de software registrada en el equipo.', 'success', 'responseAlertInstall');
                formInstallSoftware.reset();
                document.getElementById('install_date').valueAsDate = toDateTimeLocal(new Date()); // Resetear fecha a HOY
                await loadSoftwareHistory(); // Recargar el historial de software
            }
        } catch (error) {
            showFeedback('No se pudo registrar la instalación: ' + error.message, 'danger', 'responseAlertInstall');
        }
    });

    // Encapsulamos la carga del catálogo de software
    async function loadSoftware() {
        if (!selectInstallSoftware) return;
        try {
            const res = await requestJson('http://localhost:8000/api/ti/software');
            const sofwareList = res.payload || res; 

            selectInstallSoftware.innerHTML = '<option value="" selected disabled>Seleccione un software...</option>';
            
            if (Array.isArray(sofwareList)) {
                sofwareList.forEach(sw => {
                    const option = document.createElement('option');
                    option.value = sw.id;
                    option.textContent = `${sw.name} ${sw.version ? `(${sw.version})` : ''} - ${sw.license_type}`;
                    selectInstallSoftware.appendChild(option);
                });
            }
        } catch (error) {
            showFeedback('Error al cargar catálogo de software (¿Ruta /api/ti/software creada?): ' + error.message, 'warning', 'responseAlertInstall');
        }
    }

    // Cargar software inicialmente (y definir un valor por default para la fecha de instalación)
    await loadSoftware();
    const dateInput = document.getElementById('install_date');
    if(dateInput) dateInput.valueAsDate = new Date();
    // Cargar historial de software inicialmente
    await loadSoftwareHistory();

    // Cargar historial de mantenimientos
    async function loadMaintenanceHistory() {
        try {
            const res = await requestJson('http://localhost:8000/api/ti/maintenances', { credentials: 'include' });
            const records = res.payload || res;
            const tbody = document.getElementById('historyTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (Array.isArray(records) && records.length > 0) {
                records.forEach(rec => {
                    const equipment = equipmentsCache.find(e => e.id == rec.equipment_id) || {};
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${escapeHtml(rec.id)}</td>
                        <td>${escapeHtml(equipment.inventory_code || rec.equipment_id)}</td>
                        <td>${escapeHtml(equipment.model || '')}</td>
                        <td>${escapeHtml(equipment.location || '')}</td>
                        <td>${escapeHtml(rec.type)}</td>
                        <td>${Number(rec.cost || 0).toLocaleString('es-CL')}</td>
                        <td>${escapeHtml(rec.final_status || '')}</td>
                        <td>${new Date(rec.intervention_date).toLocaleString()}</td>
                        <td>${escapeHtml(rec.description)}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="10" class="text-center text-muted">No hay registros de mantenimiento.</td></tr>`;
            }
        } catch (error) {
            showFeedback('Error al cargar historial: ' + error.message, 'danger', 'responseAlert');
        }
    }

    async function loadSoftwareHistory() {
        try {
            const res = await requestJson('http://localhost:8000/api/ti/software/installations/all', { credentials: 'include' });
            const records = res.payload || res;
            const tbody = document.getElementById('historySoftwareTableBody');
            if (!tbody) return;
            tbody.innerHTML = '';

            if (Array.isArray(records) && records.length > 0) {
                records.forEach((rec) => {
                    // Buscar equipo en cache para obtener el código de inventario
                    const equipment = equipmentsCache.find(e => e.id == rec.equipment_id) || {};
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${escapeHtml(rec.id)}</td>
                        <td>${escapeHtml(equipment.inventory_code || rec.equipment_id)}</td>
                        <td>${escapeHtml(rec.software_name || rec.software_id)}</td>
                        <td>${escapeHtml(rec.software_version || '')}</td>
                        <td>${escapeHtml(rec.license_type || '')}</td>
                        <td>${new Date(rec.installation_date).toLocaleString()}</td>
                        <td>
                            <button class="btn btn-sm btn-primary view-installation-btn" data-id="${rec.id}">
                                <i class="bi bi-eye"></i> Ver
                            </button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });

                // Agregar event listeners a los botones de "Ver"
                document.querySelectorAll('.view-installation-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const installationId = e.currentTarget.getAttribute('data-id');
                        await showInstallationDetails(installationId);
                    });
                });
            } else {
                tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No hay registros de instalaciones de software.</td></tr>`;
            }
        } catch (error) {
            showFeedback('Error al cargar historial de software: ' + error.message, 'danger', 'responseAlertSoftware');
        }
    }

    async function showInstallationDetails(installationId) {
        try {
            const res = await requestJson(`http://localhost:8000/api/ti/software/installations/${installationId}`, { credentials: 'include' });
            const details = (res.payload && res.payload[0]) || res[0];
            
            if (!details) {
                showFeedback('No se encontraron detalles de la instalación.', 'warning', 'responseAlertSoftware');
                return;
            }

            // Crear modal con detalles
            const modalContent = `
                <div class="modal fade" id="installationDetailsModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Detalles de Instalación de Software</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <hr>
                                        <h1 class="fw-bold"><strong>Información del Equipo</strong></h1>
                                        <p><strong>Código de Inventario:</strong> ${escapeHtml(details.inventory_code || 'N/A')}</p>
                                        <p><strong>Modelo:</strong> ${escapeHtml(details.equipment_model || 'N/A')}</p>
                                        <p><strong>Tipo:</strong> ${escapeHtml(details.equipment_type || 'N/A')}</p>
                                        <p><strong>Número de Serie:</strong> ${escapeHtml(details.serial_number || 'N/A')}</p>
                                        <p><strong>Ubicación:</strong> ${escapeHtml(details.location || 'N/A')}</p>
                                    </div>
                                    <div class="col-md-6">
                                        <hr>
                                        <h1 class="fw-bold"><strong>Información del Software</strong></h1>
                                        <p><strong>Nombre:</strong> ${escapeHtml(details.software_name || 'N/A')}</p>
                                        <p><strong>Versión:</strong> ${escapeHtml(details.software_version || 'N/A')}</p>
                                        <p><strong>Tipo de Licencia:</strong> ${escapeHtml(details.license_type || 'N/A')}</p>
                                        <p><strong>Fecha de Expiración:</strong> ${details.expiration_date ? new Date(details.expiration_date).toLocaleDateString() : 'Permanente'}</p>
                                    </div>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-12">
                                        <hr>
                                        <h1 class="fw-bold"><strong>Detalles de Instalación</strong></h1>
                                        <p><strong>Fecha de Instalación:</strong> ${new Date(details.installation_date).toLocaleString()}</p>
                                        <p><strong>Notas:</strong></p>
                                        <p class="text-muted">${escapeHtml(details.note || 'Sin notas')}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Insertar modal en el DOM
            let modalDiv = document.getElementById('installationDetailsModal');
            if (modalDiv) {
                modalDiv.remove();
            }
            document.body.insertAdjacentHTML('beforeend', modalContent);

            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('installationDetailsModal'));
            modal.show();
        } catch (error) {
            showFeedback('Error al cargar detalles: ' + error.message, 'danger', 'responseAlertSoftware');
        }
    }
}

function showFeedback(message, type, targetElementId = 'responseAlert') {
    const container = document.getElementById(targetElementId);
    if (!container) return;
    container.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}



// ====== MODULO INVENTARIO DE PIEZAS=======

// Funciones para gestionar el inventario de piezas (carga, registro, acciones)
async function loadPartsInventory() {
    const tbody = document.getElementById('partsInventoryTableBody');
    const alertTarget = document.getElementById('partsAlert');
    if (!tbody) return;
    try {
        const res = await requestJson('http://localhost:8000/api/ti/parts', { credentials: 'include' });
        const parts = res.payload || res;
        tbody.innerHTML = '';
        if (!Array.isArray(parts) || parts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No hay registros de piezas.</td></tr>`;
            return;
        }

        parts.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(p.id)}</td>
                <td>${escapeHtml(p.part_name || p.name || '')}</td>
                <td>${escapeHtml(p.description || '')}</td>
                <td>${Number(p.stock_quantity || 0).toLocaleString('es-CL')}</td>
                <td>${Number(p.critical_stock || 0).toLocaleString('es-CL')}</td>
                <td>${Number(p.unit_price || 0).toLocaleString('es-CL')}</td>
                                <td>
                                    ${(() => {
                                        const stock = Number(p.stock_quantity || 0);
                                        const critical = Number(p.critical_stock || 0);
                                        const state = stock <= critical ? 'Crítico' : 'Disponible';
                                        const cls = state === 'Crítico' ? 'bg-danger' : 'bg-success';
                                        return `<span class="badge ${cls}">${state}</span>`;
                                    })()}
                                </td>
                <td>
                    <button class="btn btn-sm btn-success me-1 in-part-btn" title="Registrar ingreso" data-id="${p.id}"><i class="bi bi-plus-lg"></i></button>
                    <button class="btn btn-sm btn-warning me-1 out-part-btn" title="Registrar salida" data-id="${p.id}"><i class="bi bi-dash-lg"></i></button>
                    <button class="btn btn-sm btn-outline-primary me-1 edit-part-btn" data-id="${p.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger delete-part-btn" data-id="${p.id}"><i class="bi bi-trash"></i></button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        showFeedback('Error al cargar inventario de piezas: ' + error.message, 'danger', 'partsAlert');
    }
}

async function submitRegisterPart(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    try {
        const res = await requestJson('http://localhost:8000/api/ti/parts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        showFeedback('Pieza registrada correctamente.', 'success', 'responseAlertPart');
        form.reset();
        await loadPartsInventory();
    } catch (error) {
        showFeedback('No se pudo registrar la pieza: ' + error.message, 'danger', 'responseAlertPart');
    }
}

async function deletePart(partId) {
    if (!confirm('¿Eliminar esta pieza? Esta acción no se puede deshacer.')) return;
    try {
        await requestJson(`http://localhost:8000/api/ti/parts/${partId}`, { method: 'DELETE', credentials: 'include' });
        showFeedback('Pieza eliminada.', 'success', 'partsAlert');
        await loadPartsInventory();
    } catch (error) {
        showFeedback('No se pudo eliminar la pieza: ' + error.message, 'danger', 'partsAlert');
    }
}

async function getPartById(id) {
    try {
        const res = await requestJson(`http://localhost:8000/api/ti/parts/${id}`, { credentials: 'include' });
        return (res.payload && res.payload[0]) || res;
    } catch (error) {
        throw error;
    }
}

// Estado ahora derivado del stock; la BD no almacenara 'status' por defecto.

function openPartStockModal(partId, mode = 'ingreso') {
    // mode: 'ingreso' or 'salida'
    const modalEl = document.getElementById('partStockModal');
    if (!modalEl) return;
    const inputPartId = document.getElementById('movement_part_id');
    const typeSelect = document.getElementById('movement_type');
    const qtyInput = document.getElementById('movement_quantity');
    const dateInput = document.getElementById('movement_date');
    const notes = document.getElementById('movement_notes');

    inputPartId.value = partId;
    typeSelect.value = mode === 'salida' ? 'salida' : 'ingreso';
    qtyInput.value = 1;
    dateInput.value = toDateTimeLocal(new Date());
    notes.value = '';

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    // Attach one-time handler to confirm button
    const btn = document.getElementById('btnConfirmMovement');
    const handler = async () => {
        btn.removeEventListener('click', handler);
        try {
            await submitStockMovement(partId, {
                movement_type: typeSelect.value,
                quantity: Number(qtyInput.value || 0),
                date: dateInput.value,
                notes: notes.value
            });
            modal.hide();
        } catch (error) {
            showFeedback('Error registrando movimiento: ' + error.message, 'danger', 'partsAlert');
        }
    };
    btn.addEventListener('click', handler);
}

async function submitStockMovement(partId, movement) {
    // movement: { movement_type, quantity, date, notes }
    if (!partId) throw new Error('partId requerido');
    const part = await getPartById(partId);
    if (!part) throw new Error('Pieza no encontrada');

    const currentStock = Number(part.stock_quantity || 0);
    const qty = Number(movement.quantity || 0);
    let newStock = currentStock;
    if (movement.movement_type === 'ingreso') {
        newStock = currentStock + qty;
    } else {
        newStock = currentStock - qty;
        if (newStock < 0) throw new Error('Stock insuficiente para esta salida');
    }

    // First, try to post a movement record if the API supports it
    try {
        await requestJson(`http://localhost:8000/api/ti/parts/${partId}/movements`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                type: movement.movement_type,
                quantity: qty,
                date: movement.date,
                notes: movement.notes
            })
        });
    } catch (err) {
        // ignore; may not exist on backend
    }

    // Update part stock via PUT
    const updatePayload = { stock_quantity: newStock };
    try {
        await requestJson(`http://localhost:8000/api/ti/parts/${partId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updatePayload)
        });
        showFeedback('Movimiento registrado y stock actualizado.', 'success', 'partsAlert');
        await loadPartsInventory();
    } catch (error) {
        throw error;
    }
}

function initPartsModule() {
    const form = document.getElementById('formRegisterPart');
    const partsTable = document.getElementById('partsInventoryTableBody');
    const btnNewPartSidebar = document.getElementById('btnNewPartSidebar');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitRegisterPart(form);
        });
    }

    if (btnNewPartSidebar) {
        btnNewPartSidebar.addEventListener('click', (e) => {
            // Mostrar la vista de registrar pieza a través del sidebar link si existe
            const link = document.querySelector('[data-section-target="registerPartSection"]');
            if (link) link.click();
        });
    }

    if (partsTable) {
        partsTable.addEventListener('click', async (e) => {
            const btn = e.target.closest('button');
            if (!btn) return;
            const id = btn.getAttribute('data-id');
            // Ingreso de stock
            if (btn.classList.contains('in-part-btn')) {
                openPartStockModal(id, 'ingreso');
                return;
            }
            // Salida de stock
            if (btn.classList.contains('out-part-btn')) {
                openPartStockModal(id, 'salida');
                return;
            }
            if (btn.classList.contains('delete-part-btn')) {
                await deletePart(id);
                return;
            }
            if (btn.classList.contains('edit-part-btn')) {
                // Simple inline edit: cargar valores y mostrar formulario
                try {
                    const res = await requestJson(`http://localhost:8000/api/ti/parts/${id}`, { credentials: 'include' });
                    const part = (res.payload && res.payload[0]) || res;
                    if (part) {
                        const link = document.querySelector('[data-section-target="registerPartSection"]');
                        if (link) link.click();
                        // rellenar form
                        document.getElementById('part_name').value = part.part_name || part.name || '';
                        document.getElementById('part_description').value = part.description || '';
                        document.getElementById('stock_quantity').value = part.stock_quantity || 0;
                        document.getElementById('critical_stock').value = part.critical_stock || 0;
                        document.getElementById('unit_price').value = part.unit_price || 0;
                        // change form submit to perform PUT
                        form.addEventListener('submit', async function onUpdate(ev) {
                            ev.preventDefault();
                            const fd = new FormData(form);
                            const data = Object.fromEntries(fd.entries());
                            try {
                                await requestJson(`http://localhost:8000/api/ti/parts/${id}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    credentials: 'include',
                                    body: JSON.stringify(data)
                                });
                                showFeedback('Pieza actualizada.', 'success', 'responseAlertPart');
                                form.removeEventListener('submit', onUpdate);
                                form.reset();
                                await loadPartsInventory();
                            } catch (error) {
                                showFeedback('No se pudo actualizar la pieza: ' + error.message, 'danger', 'responseAlertPart');
                            }
                        });
                    }
                } catch (error) {
                    showFeedback('Error al cargar pieza: ' + error.message, 'danger', 'partsAlert');
                }
            }
        });
    }

    // Cargar inventario al inicializar el submódulo
    loadPartsInventory();
}

// Inicializar módulo de piezas cuando el DOM esté listo (coexiste con init())
document.addEventListener('DOMContentLoaded', () => {
    initPartsModule();
});



