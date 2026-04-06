import { requestJson, setAlert, toDateTimeLocal } from "./shared.js"

const API_BASE = "http://localhost:8000/api";

const MILEAGE_BLOCK_SIZE = 5000;

const getMileageBlock = (value) => Math.floor(Number(value) / MILEAGE_BLOCK_SIZE);

const validateMileageForm = (mileage, date) => {
    const mileageNum = parseInt(mileage, 10);
    if (isNaN(mileageNum) || mileageNum <= 0) {
        return "El kilometraje debe ser un número mayor a 0";
    }
    if (!date) {
        return "La fecha del recorrido es requerida";
    }
    return null;
};

// Consulta el camión asignado al conductor y muestra patente + kilometraje acumulado.
const loadAssignedTruck = async (container, alert) => {
    try {
        const data = await requestJson(`${API_BASE}/trucks/my-truck`, {
            method: "GET",
            credentials: "include",
            headers: { 'Content-Type': 'application/json' }
        }, "Error al obtener el vehículo")

        const truck = data.payload;

        // Guarda el kilometraje actual como base para la siguiente comparación en frontend.
        if (container) {
            container.dataset.initialMileage = String(Number(truck.total_mileage || 0));
            container.value = `${truck.plate_number} (${truck.total_mileage} km)`;
        }
    } catch (error) {
        if (container) {
            container.dataset.initialMileage = "";
            container.value = "Sin vehículo asignado";
        }
        if (alert) {
            console.error("Error cargando camión:", error)
        }
    }
};

const submitMileage = async (mileage, date) => {
    const payload = {
        mileage_value: parseInt(mileage, 10),
        registration_date: date
    };

    try {
        await requestJson(`${API_BASE}/mileageLogs/save`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        }, "No se pudo guardar el kilometraje")

        return { success: true, message: "Kilometraje registrado exitosamente" };
    } catch (error) {
        return { success: false, message: "Sin conexión al servidor. Intenta de nuevo." };
    }
};

export function initMileageForm() {
    const form = document.getElementById("kilometrajeForm");
    const assignedTruckContainer = document.getElementById("assignedTruck");
    const mileageInput = document.getElementById("driverMileageValue");
    const dateInput = document.getElementById("driverRouteDate");
    const submitBtn = document.getElementById("saveMileageBtn");
    const clearBtn = document.getElementById("clearMileageBtn");
    const alert = document.getElementById("mileageAlert");

    if (!form || !submitBtn) return;

    // Inicializa fecha/hora actual y datos del vehículo.
    if (dateInput) dateInput.value = toDateTimeLocal();
    loadAssignedTruck(assignedTruckContainer, alert);

    // Guarda el kilometraje final del viaje y actualiza la referencia del camión.
    submitBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        const error = validateMileageForm(mileageInput.value, dateInput.value);
        if (error) {
            if (alert) {
                alert.textContent = error;
                alert.className = "mt-3 text-danger";
            }
            return;
        }

        const previousMileage = Number(assignedTruckContainer?.dataset?.initialMileage || 0);
        const nextMileage = Number(mileageInput.value);

        if (nextMileage <= previousMileage) {
            if (alert) {
                setAlert(
                    alert,
                    `El kilometraje ingresado debe ser mayor al actual (${previousMileage} km).`,
                    "danger"
                );
            }
            return;
        }

        const crossedMaintenanceBlock = getMileageBlock(nextMileage) > getMileageBlock(previousMileage);

        if (crossedMaintenanceBlock && alert) {
            setAlert(
                alert,
                `Alerta: se superó el límite de ${MILEAGE_BLOCK_SIZE} km. El vehículo requiere mantenimiento preventivo.`,
                "warning"
            );
        }

        submitBtn.disabled = true;
        if (alert && !crossedMaintenanceBlock) {
            setAlert(alert, "Guardando...", "info");
        }

        const result = await submitMileage(mileageInput.value, dateInput.value);

        if (alert) {
            if (crossedMaintenanceBlock) {
                alert.textContent = `${alert.textContent}\n${result.message}`;
                alert.className = `mt-3 ${result.success ? "text-success" : "text-danger"}`;
            } else {
                setAlert(alert, result.message, result.success ? "success" : "danger");
            }
        }

        if (result.success) {
            mileageInput.value = "";
            if (dateInput) dateInput.value = toDateTimeLocal();
            
            await loadAssignedTruck(assignedTruckContainer, null);
        }

        submitBtn.disabled = false;
    });

    // Restablece entradas locales del formulario sin alterar asignación de vehículo.
    if (clearBtn) {
        clearBtn.addEventListener("click", (e) => {
            e.preventDefault();
            mileageInput.value = "";
            if (dateInput) dateInput.value = toDateTimeLocal();
            if (alert) {
                setAlert(alert, "", "secondary");
            }
            loadAssignedTruck(assignedTruckContainer, null);
        });
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMileageForm);
} else {
    initMileageForm();
}