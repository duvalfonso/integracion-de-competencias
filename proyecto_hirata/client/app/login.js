// Endpoint backend de autenticación.
const API_LOGIN_URL = "http://localhost:8000/api/sessions/login";

// Rutas de entrada según rol.
const DRIVER_VIEW_URL = "module/driver/driver.view.html";
const ADM_FLOTA_VIEW_URL = "module/admflota/admflota.view.html";
const ADM_MANT_VIEW_URL = "module/admmantenimiento/admmant.view.html";

// Resuelve la ruta de inicio de acuerdo al rol autenticado.
const getRedirectByRole = (role) => {
    if (role === "admin_flota") return ADM_FLOTA_VIEW_URL;
    if (role === "admin_mant") return ADM_MANT_VIEW_URL;
    return DRIVER_VIEW_URL;
};

// Muestra un error legible en el contenedor del login.
const showError = (alerta, message) => {
    alerta.textContent = message;
    alerta.className = "mt-3 text-danger";
};

// Controla estado visual de carga (overlay + botón deshabilitado).
const setLoading = (isLoading) => {
    const overlay = document.getElementById("loadingOverlay");
    const submitButton = document.querySelector("#loginForm button[type='submit']");

    if (overlay) {
        overlay.classList.toggle("is-visible", isLoading);
        overlay.setAttribute("aria-hidden", isLoading ? "false" : "true");
    }

    if (submitButton) {
        submitButton.disabled = isLoading;
    }
};

// Inicializa botón de mostrar/ocultar contraseña.
const initPasswordToggle = () => {
    const passwordInput = document.getElementById("password");
    const toggleBtn = document.getElementById("togglePassword");
    const toggleIcon = document.getElementById("togglePasswordIcon");

    if (!passwordInput || !toggleBtn || !toggleIcon) return;

    toggleBtn.addEventListener("click", () => {
        const isPassword = passwordInput.type === "password";
        passwordInput.type = isPassword ? "text" : "password";
        toggleIcon.classList.toggle("bi-eye", !isPassword);
        toggleIcon.classList.toggle("bi-eye-slash", isPassword);
        toggleBtn.setAttribute("aria-label", isPassword ? "Ocultar contraseña" : "Mostrar contraseña");
    });
};

initPasswordToggle();

// Flujo principal de inicio de sesión.
document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    // Lectura de campos y normalización básica de email.
    const usuario = document.getElementById("usuario").value.trim().toLowerCase();
    const password = document.getElementById("password").value;
    const alerta = document.getElementById("alertaLogin");

    // Estado inicial limpio antes del intento de autenticación.
    alerta.textContent = "";
    alerta.className = "mt-3";
    setLoading(true);

    try {
        // Intenta autenticación contra backend.
        const response = await fetch(API_LOGIN_URL, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: usuario, password })
        });
        // Maneja respuesta HTTP no exitosa con detalle si existe.
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || "Credenciales incorrectas");
        }

        // Valida contrato de respuesta esperado.
        const data = await response.json();
        if (data.status !== "success" || !data.payload) {
            showError(alerta, "Credenciales incorrectas");
            return;
        }

        // Persiste perfil para control de sesión y redirige según rol.
        const perfil = data.payload;
        localStorage.setItem("usuarioHirata", JSON.stringify(perfil));
        window.location.href = getRedirectByRole(perfil.role);
    } catch (error) {
        showError(alerta, error.message || "No se pudo conectar al servidor.");
    } finally {
        // Siempre restaura UI al terminar el proceso.
        setLoading(false);
    }
});