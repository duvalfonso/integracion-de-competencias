import { requestJson, escapeHtml, lockBodyScroll, unlockBodyScroll } from "./shared.js"
const API_CURRENT_URL = "http://localhost:8000/api/sessions/current";
const API_LOGOUT_URL = "http://localhost:8000/api/sessions/logout"
const API_TRUCKS_URL = "http://localhost:8000/api/trucks"
const API_NOTIFICATIONS_URL = "http://localhost:8000/api/notifications"
const ADMIN_NOTIFICATION_ROLES = new Set(["admin", "superadmin", "maintenance"])
const MAINTENANCE_BLOCK_SIZE = 5000
const DISMISSED_MAINTENANCE_NOTIFICATIONS_KEY = "hirataDismissedMaintenanceNotifications"
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

const initLogoutControl = () => {
    const slot = document.getElementById("logoutNavSlot")
    if (!slot) return

    let confirmVisible = false
    const render = () => {

        slot.innerHTML = confirmVisible

            ? `

                <div class="d-flex align-items-center gap-2 flex-wrap nav-logout-confirm">

                    <span class="small text-white-50">¿Salir?</span>

                    <button type="button" class="btn btn-sm btn-light" data-action="logout-confirm">Confirmar</button>

                    <button type="button" class="btn btn-sm btn-outline-light" data-action="logout-cancel">Cancelar</button>

                </div>

              `

            : `

                <button type="button" class="btn btn-outline-light btn-sm" data-action="logout-request">Salir</button>

              `

    }

    render()

    slot.addEventListener("click", async (event) => {
        const actionTarget = event.target.closest("[data-action]")
        if (!actionTarget) return

        const action = actionTarget.dataset.action

        if (action === "logout-request") {
            confirmVisible = true
            render()
            return
        }

        if (action === "logout-cancel") {
            confirmVisible = false
            render()
            return
        }

        if (action === "logout-confirm") {
            await cerrarSesion()
        }

    })

}

const canUseAdminNotifications = (usuario) => {

    const path = window.location.pathname.replace(/\\/g, "/")

    const isAdminView = path.includes("/module/admflota/") || path.includes("/module/admmantenimiento/")

    return isAdminView && ADMIN_NOTIFICATION_ROLES.has(usuario.role)

}

const formatNotificationDate = (isoDate) => {

    if (!isoDate) return ""

    const date = new Date(isoDate)

    if (Number.isNaN(date.getTime())) return ""

    return date.toLocaleString("es-CL", {

        day: "2-digit",

        month: "2-digit",

        year: "numeric",

        hour: "2-digit",

        minute: "2-digit"

    })

}

const getMileageBlock = (value) => Math.floor(Number(value || 0) / MAINTENANCE_BLOCK_SIZE)
const readDismissedMaintenanceNotifications = () => {

    try {
        const rawValue = localStorage.getItem(DISMISSED_MAINTENANCE_NOTIFICATIONS_KEY)
        return new Set(Array.isArray(JSON.parse(rawValue)) ? JSON.parse(rawValue) : [])
    } catch {
        return new Set()
    }
}

const saveDismissedMaintenanceNotifications = (notificationIds) => {
    localStorage.setItem(
        DISMISSED_MAINTENANCE_NOTIFICATIONS_KEY,
        JSON.stringify(Array.from(notificationIds))
    )
}

const dismissMaintenanceNotification = (notificationId) => {
    const dismissedNotifications = readDismissedMaintenanceNotifications()
    dismissedNotifications.add(String(notificationId))
    saveDismissedMaintenanceNotifications(dismissedNotifications)
}

const dismissManyMaintenanceNotifications = (notificationIds) => {
    const dismissedNotifications = readDismissedMaintenanceNotifications()
    for (const notificationId of notificationIds) {
        dismissedNotifications.add(String(notificationId))
    }
    saveDismissedMaintenanceNotifications(dismissedNotifications)
}

const buildFrontendMaintenanceNotifications = (trucks) => {

    const dismissedNotifications = readDismissedMaintenanceNotifications()
    return trucks
        .filter((truck) => Number(truck.total_mileage || 0) > 0)
        .filter((truck) => getMileageBlock(truck.total_mileage) > getMileageBlock(truck.last_maintenance_mileage))
        .map((truck) => {
            const mileageBlock = getMileageBlock(truck.total_mileage)
            return {
            id: `maintenance-${truck.id}-${mileageBlock}`,
            title: "Mantenimiento preventivo requerido",
            message: `El camión ${truck.plate_number} alcanzó ${truck.total_mileage} km y ya superó su bloque de mantenimiento de ${MAINTENANCE_BLOCK_SIZE} km.`,
            created_at: truck.created_at,
            is_read: false,
            __frontendOnly: true,
            __truckId: truck.id,
            __mileageBlock: mileageBlock
            }
        })

        .filter((notification) => !dismissedNotifications.has(notification.id))
}



const fetchMaintenanceTrucks = async () => {

    const data = await requestJson(API_TRUCKS_URL, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
    }, "No se pudieron cargar los camiones")
    return Array.isArray(data.payload) ? data.payload : []
}

const fetchUserNotifications = async () => {
    const data = await requestJson(API_NOTIFICATIONS_URL, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }

    }, "No se pudieron cargar las notificaciones")
    return Array.isArray(data.payload) ? data.payload : []
}

const markNotificationAsRead = async (notificationId) => {
    await requestJson(`${API_NOTIFICATIONS_URL}/${notificationId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
    }, "No se pudo marcar la notificación")

}

const markAllNotificationsAsRead = async () => {

    await requestJson(`${API_NOTIFICATIONS_URL}/read-all`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
    }, "No se pudieron marcar las notificaciones")

}

const initAdminNotifications = (usuario) => {

    if (!canUseAdminNotifications(usuario)) return

    const slot = document.getElementById("notificationNavSlot")

    if (!slot) return

    slot.innerHTML = `
      <div class="dropdown">
        <button
          class="btn btn-outline-light btn-sm position-relative"
          type="button"
          id="notificationsDropdownBtn"
          data-bs-toggle="dropdown"
          data-bs-auto-close="outside"
          aria-expanded="false"
          aria-label="Notificaciones"
        >
          <i class="bi bi-bell"></i>

          <span id="notificationsUnreadBadge" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger d-none">0</span>
        </button>

        <div class="dropdown-menu dropdown-menu-end p-0 nav-notification-menu" aria-labelledby="notificationsDropdownBtn">
          <div class="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
            <strong class="small text-uppercase">Notificaciones</strong>

                        <div id="markAllNotificationsSlot"></div>

          </div>
          <div id="notificationsList" class="list-group list-group-flush"></div>
        </div>
      </div>
    `
    const listEl = document.getElementById("notificationsList")
    const unreadBadgeEl = document.getElementById("notificationsUnreadBadge")
    const markAllSlotEl = document.getElementById("markAllNotificationsSlot")
    const notificationsDropdownEl = slot.querySelector(".dropdown")
    let pendingCloseNotificationId = null
    let pendingMarkAllConfirm = false
    let cachedNotifications = []

    const renderMarkAllControl = (unreadCount) => {
        if (!markAllSlotEl) return

        if (unreadCount === 0) {
            pendingMarkAllConfirm = false
            markAllSlotEl.innerHTML = `<span class="small text-muted">Sin pendientes</span>`
          return
        }

        if (!pendingMarkAllConfirm) {
            markAllSlotEl.innerHTML = `
                <button
                    type="button"
                    class="btn btn-link btn-sm text-decoration-none p-0"
                    data-action="mark-all-request"
                >
                    Marcar todas
                </button>
            `
            return
        }

        markAllSlotEl.innerHTML = `
            <div class="nav-notification-markall-confirm">
                <span class="small text-muted">¿Marcar todas como leídas?</span>
                <button type="button" class="btn btn-sm btn-primary" data-action="mark-all-confirm">Confirmar</button>
                <button type="button" class="btn btn-sm btn-outline-secondary" data-action="mark-all-cancel">Cancelar</button>
            </div>
        `
    }

    const renderNotifications = (items) => {
        if (!listEl || !unreadBadgeEl) return
        const unreadCount = items.filter((item) => !item.is_read).length
        unreadBadgeEl.textContent = String(unreadCount)
        unreadBadgeEl.classList.toggle("d-none", unreadCount === 0)
        renderMarkAllControl(unreadCount)

        if (items.length === 0) {
            listEl.innerHTML = `<div class="px-3 py-3 text-muted small">No hay notificaciones</div>`
            return
        }
        listEl.innerHTML = items
            .map((item) => {
                const unreadClass = item.is_read ? "" : " nav-notification-item-unread"
                const safeTitle = escapeHtml(item.title || "Notificación")
                const safeMessage = escapeHtml(item.message || "")
                const safeDate = escapeHtml(formatNotificationDate(item.created_at))
                const isFrontendOnly = Boolean(item.__frontendOnly)
                const isPendingConfirm = String(item.id) === String(pendingCloseNotificationId)
                const closeActionsHtml = item.is_read
                    ? ""
                    : `
                        <button
                            type="button"
                            class="btn btn-outline-secondary btn-sm nav-notification-close-btn"
                            data-action="request-close"
                            data-notification-id="${item.id}"
                            aria-label="Cerrar notificación"
                            title="Cerrar notificación"
                        >
                            <i class="bi bi-x-lg"></i>
                        </button>
                    `
                const confirmCloseHtml = isPendingConfirm
                    ? `
                        <div class="nav-notification-confirm mt-2">
                            <span class="small text-muted">¿Confirmar marcar como leído?</span>
                            <div class="nav-notification-confirm-actions mt-2">
                                <button type="button" class="btn btn-sm btn-primary" data-action="confirm-close" data-notification-id="${item.id}">Confirmar</button>
                                <button type="button" class="btn btn-sm btn-outline-secondary" data-action="cancel-close" data-notification-id="${item.id}">Cancelar</button>
                            </div>
                        </div>
                    `
                    : ""

                return `
                    <div class="list-group-item nav-notification-item${unreadClass}" data-notification-id="${item.id}" data-notification-read="${item.is_read}">
                    <div class="nav-notification-item-row">
                        <div class="nav-notification-dot-wrapper">
                            <span class="nav-notification-dot ${item.is_read ? "invisible" : ""}"></span>
                        </div>
                        <div class="nav-notification-content text-start">
                            <div class="small fw-semibold text-dark">${safeTitle}</div>
                            <div class="small text-muted mt-1">${safeMessage}</div>
                            <div class="small text-secondary mt-2"><i class="bi bi-clock me-1"></i>${safeDate}</div>
                            ${confirmCloseHtml}
                        </div>
                        ${closeActionsHtml}
                    </div>
                </div>
                `
            })
            .join("")
    }
    const showLoadError = (message) => {
        if (!listEl) return
        listEl.innerHTML = `<div class="px-3 py-3 text-danger small">${message}</div>`
    }
    const loadNotifications = async () => {
        try {
            const [items, trucks] = await Promise.all([
                fetchUserNotifications(),
                fetchMaintenanceTrucks()
            ])
            const frontendMaintenanceNotifications = buildFrontendMaintenanceNotifications(trucks)
            const mergedItems = [...frontendMaintenanceNotifications, ...items]
                .filter((item, index, array) => index === array.findIndex((candidate) => candidate.id === item.id))
            cachedNotifications = mergedItems
            renderNotifications(mergedItems)
        } catch (error) {
            showLoadError(error.message || "Error cargando notificaciones")
        }
    }

    if (markAllSlotEl) {
        markAllSlotEl.addEventListener("click", async (event) => {
            const actionTarget = event.target.closest("[data-action]")
            if (!actionTarget) return
            const action = actionTarget.dataset.action

            if (action === "mark-all-request") {
                pendingMarkAllConfirm = true
                renderMarkAllControl(cachedNotifications.filter((item) => !item.is_read).length)
                return
            }

            if (action === "mark-all-cancel") {
                pendingMarkAllConfirm = false
                renderMarkAllControl(cachedNotifications.filter((item) => !item.is_read).length)
                return
            }

            if (action === "mark-all-confirm") {
                try {
                        const frontendOnlyNotificationIds = cachedNotifications
                            .filter((notification) => notification.__frontendOnly)
                            .map((notification) => notification.id)

                    await markAllNotificationsAsRead()
                        dismissManyMaintenanceNotifications(frontendOnlyNotificationIds)
                    pendingMarkAllConfirm = false
                    pendingCloseNotificationId = null
                    await loadNotifications()
                } catch (error) {
                    showLoadError(error.message || "No se pudieron actualizar las notificaciones")
                }
            }
        })
    }

    if (listEl) {
        listEl.addEventListener("click", async (event) => {
            const actionTarget = event.target.closest("[data-action]")
            if (!actionTarget) return
            const action = actionTarget.dataset.action
            const notificationId = actionTarget.dataset.notificationId
            if (!action || !notificationId) return
            if (action === "request-close") {
                pendingCloseNotificationId = notificationId
                renderNotifications(cachedNotifications)
                return
            }
            if (action === "cancel-close") {
                pendingCloseNotificationId = null
                renderNotifications(cachedNotifications)
                return
            }

            if (action === "confirm-close") {
                try {
                    const notification = cachedNotifications.find((item) => String(item.id) === String(notificationId))
                    if (notification?.__frontendOnly) {

                        dismissMaintenanceNotification(notificationId)

                    } else {
                        await markNotificationAsRead(notificationId)
                    }
                    pendingCloseNotificationId = null

                    await loadNotifications()

                } catch (error) {
                    showLoadError(error.message || "No se pudo cerrar la notificación")
                }
            }
        })
    }
    if (notificationsDropdownEl) {
        notificationsDropdownEl.addEventListener("shown.bs.dropdown", lockBodyScroll)
        notificationsDropdownEl.addEventListener("hidden.bs.dropdown", unlockBodyScroll)

        window.addEventListener("resize", () => {
            unlockBodyScroll()
        })
    }
    loadNotifications()
    window.setInterval(loadNotifications, 30000)
}
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

    if ((usuario.role === 'admin' || usuario.role === 'superadmin') && !currentPath.includes('admflota.view.html')) {
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
    initAdminNotifications(usuario);
    initLogoutControl();
    } catch (error) {
        console.error("Error leyendo usuario:", error);
    }
});