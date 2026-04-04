# Sistema de Gestión de Flota - Empresa Hirata 

## Descripción del Proyecto
Solución informática para automatizar el monitoreo y mantenimiento preventivo de la flota de camiones. El sistema gestiona el kilometraje y genera alertas críticas cada 5,000 km para asegurar la operatividad de los vehículos.

##  Tecnologías
* **Backend:** Node.js / Express.
* **Base de Datos:** MySQL.
* **Seguridad:** Bcrypt para hashing de contraseñas y JWT para sesiones.

##  Estructura de Datos (MySQL)
El esquema `hirata_db` incluye:
* `drivers`: Registro de conductores.
* `trucks`: Datos técnicos y odómetro de los camiones.
* `mileage_logs`: Historial de kilómetros ingresados.
* `maintenance_history`: Registro de servicios realizados.

## Requisitos Previos
*`Node.js instalado`.
*`Servidor MySQL activo`.

##  Instalación y Uso

1. **Configurar DB:** Ejecutar el archivo `dbSchema.sql` en tu servidor MySQL.
2. **Variables de Entorno:** Crear un archivo `.env` con las credenciales de tu base de datos (Host, User, Password, Database).
3. **Instalar dependencias:**
   ```bash
   npm run dev