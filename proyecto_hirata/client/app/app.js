const API_CURRENT_URL = "http://localhost:8000/api/sessions/current";
const API_LOGOUT_URL = "http://localhost:8000/api/sessions/logout"

// Solcita cierre de sesión al backend y redirige al login correcto.
const cerrarSesion = async () => {
    try {
        await fetch(API_LOGOUT_URL, {
            method: "POST",
            credentials: "include"
        });
    } catch (error) {
        console.error("Error cerrando sesión:", error);
    } finally {
        window.location.href = getLoginPath();
    }
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
        nombreUsuarioEl.textContent = "Hola, " + (usuario.nombre || usuario.full_name || "Usuario");
    }
    const personajeBadgeEl = document.getElementById("personajeBadge");
    if (personajeBadgeEl) {
        personajeBadgeEl.textContent = usuario.role || "Conductor";
    }
};

const getCurrentUser = async () => {
  try {
    const res = await fetch(API_CURRENT_URL, {
      credentials: "include"
    })
    if(!res.ok) return null

    const data = await res.json()
    return data.payload
  } catch (error) {
    console.error("Error obteniendo sesión: ", error)
    return null
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Recupera sesión almacenada en cookies del navegador.
    const usuario = await getCurrentUser();

    // Si no hay sesión activa, redirige al login.
    if (!usuario) {
        window.location.href = getLoginPath();
        return;
    }
    
    // Control de acceso por rol: cada tipo de usuario va a su módulo correspondiente.
    const currentPath = window.location.pathname.replace(/\\/g, "/");
    if (usuario.role === 'admin' || usuario.role === 'superadmin' && !currentPath.includes('admflota.view.html')) {
        window.location.href = "../../module/admflota/admflota.view.html";
        return;
    }
    if (usuario.role === 'driver' && !currentPath.includes('driver.view.html')) {
        window.location.href = "../../module/driver/driver.view.html";
        return;
    }
    if (usuario.role === 'maintenance' && !currentPath.includes('admmant.view.html')) {
        window.location.href = "../../module/admmantenimiento/admmant.view.html";
        return;
    }
    
    // Completa datos de usuario en la barra superior de las vistas activas.
    initNavbarUser(usuario);
    } catch (error) {
        console.error("Error leyendo usuario:", error);
    }
    
});