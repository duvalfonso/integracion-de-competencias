# 🚛 Proyecto Hirata — Modernización
**Sistema de gestión y trazabilidad de flota** para Transportes Hirata. Automatiza el monitoreo de kilometraje, genera alertas preventivas de mantenimiento y centraliza la operación logística en una sola plataforma.
## 📋 Tabla de Contenidos
- Descripción
- Problema que resuelve
- Funcionalidades principales
- Arquitectura del sistema
- Stack tecnológico
- Requisitos previos
- Instalación y ejecución
- Actores del sistema
- Capturas de pantalla
- Autores

## 📖 Descripción
**Proyecto Hirata** es un prototipo de sistema informático desarrollado como solución de baja complejidad para la **Etapa 1** de la modernización operativa de Transportes Hirata. El sistema aborda la falta de monitoreo automatizado que generaba un ciclo de fallas no detectadas, mantenimientos omitidos y sobrecostos logísticos.

## 🔍 Problema que resuelve
La ausencia de un sistema automatizado en Transportes Hirata desencadenaba el siguiente ciclo destructivo:

|        Etapa            |                     Descripción                           |
|-------------------------|----------------------------------------------------------|
| 🔵 Punto Ciego          | Sin monitoreo de kilometraje en tiempo real              |
| 🟡 Falla Oculta         | Mantenimientos preventivos sistemáticamente omitidos     |
| 🔴 Quiebre Operativo    | Vehículos inmovilizados por fallas mecánicas inesperadas |
| ⚫ Impacto Comercial    | Retrasos en entregas y escalada de costos de reparación  |

## ✨ Funcionalidades principales
- **RF-01 · Captura de Kilometraje** — Los conductores registran el kilometraje al finalizar cada recorrido mediante una interfaz de escritorio intuitiva.
- **RF-02 · Gestión de Flota** — El administrador registra y gestiona perfiles de vehículos y conductores asignados (CRUD completo).
- **RF-03 · Motor de Alertas Automáticas** — El sistema evalúa umbrales y dispara alertas preventivas al acumularse **5,000 km** desde el último mantenimiento.
- **RF-04 · Historial de Mantenimiento** — Control total de intervenciones mecánicas con protección contra registros duplicados y trazabilidad garantizada.
- **RF-05 · Aseguramiento de Calidad** — Validaciones modulares con pruebas unitarias y manejo descriptivo de errores.
