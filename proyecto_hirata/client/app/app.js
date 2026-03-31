// Cierra sesión limpiando localStorage y redirigiendo al login correcto.
const cerrarSesion = () => {
    const path = window.location.pathname.replace(/\\/g, "/");
    const loginPath = path.includes("/module/") ? "../../login.html" : "login.html";
    localStorage.removeItem("usuarioHirata");
    window.location.href = loginPath;
};

// Expone cerrarSesion al scope global para que pueda invocarse desde botones inline en HTML.
window.cerrarSesion = cerrarSesion;

// Devuelve la ruta al login según si estamos en raíz o dentro de /module/.
const getLoginPath = () => {
    const path = window.location.pathname.replace(/\\/g, "/");
    return path.includes("/module/") ? "../../login.html" : "login.html";
};

// Pinta nombre y rol en la barra superior para vistas de módulo.
const initNavbarUser = (usuario) => {
    const nombreUsuarioEl = document.getElementById("nombreUsuario");
    if (nombreUsuarioEl) {
        nombreUsuarioEl.textContent = "Hola, " + (usuario.nombre || usuario.name || "Usuario");
    }
    const personajeBadgeEl = document.getElementById("personajeBadge");
    if (personajeBadgeEl) {
        personajeBadgeEl.textContent = usuario.rol || "Conductor";
    }
};

document.addEventListener("DOMContentLoaded", () => {
    // Recupera sesión almacenada en el navegador.
    let usuario = null;
    try {
        const data = localStorage.getItem("usuarioHirata");
        if (data) {
            usuario = JSON.parse(data);
        }
    } catch (error) {
        console.error("Error leyendo usuario:", error);
    }
    // Si no hay sesión activa, redirige al login.
    if (!usuario) {
        window.location.href = getLoginPath();
        return;
    }
    
    // Control de acceso por rol: cada tipo de usuario va a su módulo correspondiente.
    const currentPath = window.location.pathname.replace(/\\/g, "/");
    if (usuario.role === 'admin_flota' && !currentPath.includes('admflota.view.html')) {
        window.location.href = "../../module/admflota/admflota.view.html";
        return;
    }
    if (usuario.role === 'driver' && !currentPath.includes('driver.view.html')) {
        window.location.href = "../../module/driver/driver.view.html";
        return;
    }
    if (usuario.role === 'admin_mant' && !currentPath.includes('admmant.view.html')) {
        window.location.href = "../../module/admmantenimiento/admmant.view.html";
        return;
    }
    
    // Completa datos de usuario en la barra superior de las vistas activas.
    initNavbarUser(usuario);
});