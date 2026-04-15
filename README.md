# Sistema de Gestión de Flota - Empresa Hirata
## Descripción del Proyecto
Solución informática integral diseñada para automatizar el ciclo de vida de la flota de camiones de Transportes Hirata. El sistema permite el registro de conductores, la asignación de vehículos y el control estricto del kilometraje para disparar alertas de mantenimiento preventivo cada **5,000 km**.
Arquitectura del Sistema

## Frontend 
Ubicado en la carpeta client, construido con tecnologías estándar para asegurar ligereza y compatibilidad:
* 	Vistas (HTML/Bootstrap ): Interfaces adaptables para escritorio y móviles.
* 	Lógica de Cliente (JavaScript ES6): * app.js: Gestión global de sesiones, protección de rutas por rol y control de la barra de navegación.
* 	login.js: Gestión de autenticación y redirección inteligente según el perfil.
* 	admflota.js: CRUD de camiones, registro de conductores y asignación dinámica de flota.
* 	driver-mileage.js: Formulario especializado para que los conductores reporten sus recorridos.
## Backend 
Ubicado en la carpeta server, encargado de la seguridad y persistencia:
* 	Node.js & Express: Servidor de API REST.
* 	Autenticación: Uso de Cookies y JWT para mantener sesiones seguras.
* 	Seguridad de Datos: Encriptación de contraseñas con Bcrypt.
## Base de Datos (MySQL)
El esquema `hirata_db` incluye:
* `drivers`: Registro de conductores.
* `trucks`: Datos técnicos y odómetro de los camiones.
* `mileage_logs`: Historial de kilómetros ingresados.
* `maintenance_history`: Registro de servicios realizados.

# Instalación y Despliegue

## Requisitos Previos
* Node.js v16 o superior.
* MySQL Server v8.0.
* Navegador web moderno (Chrome, Edge o Safari).
## Configuración del Servidor
* 	1	Navega a la carpeta server.
* 	2	Instala las dependencias:
        `npm install`.
* 	3	Configura el archivo `.env` con tus credenciales de base de datos.
* 	MYSQL_HOST=127.0.0.1
        MYSQL_USER=root
        MYSQL_PASSWORD=tu_password_aqui
        MYSQL_DATABASE=hirata_db

PORT=8000
JWT_SECRET=firma
* 	4	Ejecuta el script SQL dbSchema.sql en tu instancia de MySQL.
* 	5	Inicia el servidor: 
       ```bash
       npm run dev	
## Acceso al Cliente
*	1	Abre el archivo `login.html` en tu navegador.
*	2	El sistema se conectará automáticamente a http://localhost

