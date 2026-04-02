// Endpoints backend para registrar kilometraje y obtener patentes disponibles.
const API_MILEAGE_URL = "http://localhost:8000/api/mileageLogs/save";
const API_TRUCKS_URL = "http://localhost:8000/api/trucks";
const API_MY_TRUCK_URL = "http://localhost:8000/api/trucks/my-truck"

// Obtiene el usuario autenticado desde localStorage.
// Si el JSON está corrupto o no existe, retorna null.
const getAuthUser = () => {
    try {
        const user = localStorage.getItem("usuarioHirata");
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

// Valida el formulario antes de enviar.
// Retorna string con mensaje de error o null si está correcto.
const validateMileageForm = (mileage, date) => {
    if (!mileage || mileage <= 0) {
        return "El kilometraje debe ser mayor a 0";
    }
    if (!date) {
        return "La fecha del recorrido es requerida";
    }
    return null;
};

// Intenta guardar el registro en backend (modo online).
// Retorna un objeto uniforme: { success: boolean, error?: string }.
const tryOnlineSave = async (mileageData) => {
    // Payload compatible con el backend actual.
    const payload = {
        mileage_value: mileageData.mileage_value,
        registration_date: mileageData.registration_date,
    };

    try {
        // Llamada principal de guardado.
        const response = await fetch(API_MILEAGE_URL, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        // Si backend responde OK, guardado exitoso.
        if (response.ok) {
            return { success: true };
        }

        // Si backend responde error, intenta recuperar mensaje útil.
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || `Error ${response.status}`;
        return { success: false, error: errorMessage };
    } catch (error) {
        // Error de red o servidor no disponible.
        return { success: false, error: error.message || "Sin conexión" };
    }
};

// Carga patentes disponibles desde BD y rellena el select.
// También muestra mensajes de estado en el contenedor de alertas.
const loadAssignedTruck = async (container, alert) => {
    try {
        const response = await fetch(API_MY_TRUCK_URL, {
          method: "GET",
          credentials: "include",
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || data.message || `Error: ${response.status}`);
        }

        const truck = data.payload;

        if(container) {
          container.value = `${truck.plate_number} (${truck.total_mileage} km)`
        }
    } catch (error) {
        if (container) {
          container.textContent = `Sin vehículo asignado`;
        }

        // Feedback cuando falla la carga desde backend.
        if (alert) {
            alert.textContent = error.message || error;
            alert.className = "mt-3 text-danger";
        }
    }
};

// Construye y envía un registro de kilometraje usando usuario autenticado.
// Retorna { success, message } para que la UI pueda mostrar estado.
const submitMileage = async (mileage, date) => {
    const user = getAuthUser();
    if (!user) {
        return { success: false, message: "No hay usuario autenticado" };
    }

    // Objeto de datos normalizado previo al POST.
    const mileageData = {
        // Por ahora se envía la patente; cuando backend mapee patente->id se mantiene compatible.
        mileage_value: parseInt(mileage),
        registration_date: date
    };

    // Ejecuta guardado online y transforma resultado en mensaje de UI.
    const onlineResult = await tryOnlineSave(mileageData);
    if (!onlineResult.success) {
        return { success: false, message: onlineResult.error || "No se pudo guardar en el servidor" };
    }

    return { success: true, message: "Kilometraje registrado exitosamente" };
};

// Inicializa toda la lógica del formulario de kilometraje:
// - referencias DOM
// - fecha por defecto
// - carga de patentes
// - eventos de guardar y limpiar
export function initMileageForm() {
    const form = document.getElementById("kilometrajeForm");
    const assignedTruckContainer = document.getElementById("assignedTruck");
    const mileageInput = document.getElementById("driverMileageValue");
    const dateInput = document.getElementById("driverRouteDate");
    const submitBtn = document.getElementById("saveMileageBtn");
    const clearBtn = document.getElementById("clearMileageBtn");
    const alert = document.getElementById("mileageAlert");

    // Si la vista no contiene el formulario esperado, no hace nada.
    if (!form || !submitBtn) return;

    // Establecer fecha y hora actual por defecto
    if (dateInput) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        dateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    loadAssignedTruck(assignedTruckContainer, alert);

    // Evento Guardar: valida, envía y muestra resultado.
    submitBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        // Validación frontend previa al envío.
        const error = validateMileageForm(mileageInput.value, dateInput.value);
        if (error) {
            if (alert) {
                alert.textContent = error;
                alert.className = "mt-3 text-danger";
            }
            return;
        }

        // Estado temporal mientras se espera respuesta.
        if (alert) alert.textContent = "Guardando...";

        // Envío real del registro.
        const result = await submitMileage(
            mileageInput.value,
            dateInput.value
        );

        // Muestra resultado final del proceso en pantalla.
        if (alert) {
            alert.textContent = result.message;
            alert.className = `mt-3 ${result.success ? "text-success" : "text-danger"}`;
        }

        // Si guardó correctamente, reinicia campos del formulario.
        if (result.success) {
            mileageInput.value = "";
            dateInput.value = new Date().toISOString().split("T")[0];
        }
    });

    // Evento Limpiar: resetea campos y mensajes.
    if (clearBtn) {
        clearBtn.addEventListener("click", (e) => {
            e.preventDefault();
            mileageInput.value = "";
            dateInput.value = new Date().toISOString().split("T")[0];
            if (alert) {
                alert.textContent = "";
                alert.className = "mt-3";
            }
        });
    }
}

// Auto-inicializa el módulo para que funcione tanto
// si el script carga antes como después del DOM.
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMileageForm);
} else {
    initMileageForm();
}
