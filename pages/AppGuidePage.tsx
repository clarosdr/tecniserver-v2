

import React from 'react';
import Card from '../components/common/Card';
import { APP_NAME } from '../constants.tsx';
import { formatCurrencyCOP } from '../utils/formatting';

const AppGuidePage: React.FC = () => {
  const sections = [
    {
      title: `Bienvenido a ${APP_NAME}`,
      description: `Esta guía te ayudará a comprender todas las funcionalidades y capacidades de ${APP_NAME}, un sistema de gestión integral diseñado para optimizar las operaciones de tu taller. Nuestro objetivo es proporcionarte una herramienta potente, flexible y configurable.`,
      features: [],
    },
    {
      title: 'Filosofía del Sistema: Administrable y Configurable',
      description: `${APP_NAME} está diseñado pensando en la adaptabilidad. A través del módulo "Configuración IA" y la gestión de usuarios, podrás personalizar aspectos clave del sistema para que se ajusten a los flujos de trabajo y políticas de tu taller.`,
      features: [
        "**Gestión Centralizada:** Controla usuarios internos, sus roles y (simuladamente) sus credenciales.",
        "**Personalización de Comunicaciones (Conceptual):** El sistema está preparado para adaptar plantillas de notificación para email y (futuramente) WhatsApp.",
        "**Parámetros Operativos (Conceptuales):** En futuras versiones, se podrán definir formatos de documentos, términos y condiciones, y más.",
      ],
    },
    {
      title: 'Inicio de Sesión, Seguridad y Acceso',
      description: 'El acceso seguro y diferenciado es fundamental para proteger la información y optimizar las tareas de cada miembro del equipo.',
      features: [
        "**Inicio de Sesión Unificado:**",
        "  - **Personal Interno (Admin, Técnico, etc.):** Ingresan utilizando su **nombre de usuario y contraseña** asignados.",
        "  - **Clientes:** Acceden a su portal dedicado utilizando su **correo electrónico y su ID Fiscal (C.C. o NIT)**, tal como se configuró en su ficha de cliente.",
        "**Restablecimiento de Contraseña (Conceptual):** En una versión futura, los usuarios internos podrían restablecer su contraseña mediante un sistema de OTP (One-Time Password) enviado a su correo electrónico registrado.",
        "**Roles y Permisos:** El sistema cuenta con roles predefinidos (Administrador, Técnico, Recepcionista, Contador, Cliente, etc.) que determinan el acceso a los diferentes módulos y funcionalidades. Ver sección 'Gestión de Usuarios y Roles'.",
      ],
    },
    {
      title: 'Notificaciones Generales del Sistema',
      description: `Mantener una comunicación fluida es clave. ${APP_NAME} está preparado para integrar un sistema de notificaciones robusto. Actualmente, las notificaciones para administradores se simulan mediante eventos internos y mensajes en consola; las notificaciones a clientes son simuladas.`,
      features: [
        "**Canales Principales (Planificados):** El sistema utilizará correo electrónico y WhatsApp (mediante integración futura) para enviar notificaciones automáticas y manuales.",
        "**Eventos Notificables:** Actualizaciones en Órdenes de Trabajo, disponibilidad de presupuestos, recordatorios de pago, confirmaciones de servicio, alertas de stock, etc.",
        "**Configuración Centralizada (Futura):** Las plantillas y preferencias de notificación se gestionarán desde un módulo de 'Configuración de Empresa' futuro.",
      ],
    },
    {
      title: 'Dashboard Principal',
      description: `Proporciona una vista general y rápida del estado actual del taller. Incluye un selector de tema (claro/oscuro) en la cabecera. Ideal para un vistazo matutino o para revisar el pulso del negocio en cualquier momento. Los valores monetarios se muestran en ${formatCurrencyCOP(0).split(' ')[0]} (COP).`,
      features: [
        'Estadísticas clave: Órdenes de Trabajo (OT) activas, pendientes de diagnóstico, OTs esperando aprobación de cliente, ítems de inventario con bajo stock, total de clientes registrados e ingresos estimados del mes.',
        'Gráfico de rendimiento dinámico: Visualiza reparaciones, ingresos y egresos. Se puede filtrar por día (últimos 7 días), semana (actual) o mes (días del mes actual).',
        'Actividad reciente: Un feed de las últimas acciones importantes realizadas en el sistema (simulado).',
      ],
      users: 'Administradores, Recepcionistas y cualquier usuario que necesite una visión general.',
    },
    {
      title: 'Gestión de Órdenes y Solicitudes (Trabajo)',
      description: `El corazón del sistema, ahora organizado por "Áreas" que representan las etapas del flujo de trabajo. Aquí se gestiona todo el ciclo de vida de las reparaciones y solicitudes. La barra lateral de navegación cuenta con funcionalidad de auto-contracción/expansión y una opción para fijarla. Los valores monetarios se muestran en ${formatCurrencyCOP(0).split(' ')[0]} (COP).`,
      features: [
        '**Panel de "Órdenes Pendientes de Aprobación de Presupuesto":** Un panel destacado en la parte superior muestra las OTs que requieren aprobación del cliente, permitiendo una acción rápida (ver detalles o aprobar manualmente).',
        '**Estructura por Áreas (Pestañas):** El módulo se organiza en las siguientes áreas principales, cada una con sus estados específicos:',
        '  - **1. Solicitudes de Servicio:**',
        '    - **Contenido:** Lista las `ScheduledService` (Servicios Programados desde el módulo de Clientes o Portal del Cliente) que tienen estado `Pendiente`.',
        '    - **Información Mostrada:** Cliente, Equipo (descripción), Tipo de Servicio, Fecha Programada, Descripción Breve, Indicador de Visita a Domicilio.',
        '    - **Acciones Clave:**',
        '      - `Convertir en OT`: Transforma la solicitud en una Orden de Trabajo formal. La nueva OT se crea automáticamente en el área "Entrada a Taller" con estado "Pendiente de Diagnóstico". La solicitud original actualiza su estado a "Convertida en OT".',
        '      - `Ver Detalle Cliente`: Enlace directo a la página de detalle del cliente asociado.',
        '      - `Cancelar Solicitud`: Cambia el estado del Servicio Programado a "Cancelado" (con modal de confirmación).',
        '  - **2. Entrada a Taller:**',
        '    - **Contenido:** Órdenes de Trabajo que están activamente en el taller.',
        '    - **Estados Posibles:** `Pendiente de Diagnóstico`, `En Progreso`, `En espera de repuesto`, `Esperando Aprobación`, `Cancelado`.',
        '    - **Acciones Clave:** `Editar/Ver OT`, `Generar Ticket de OT`, `Eliminar OT` (con modal de confirmación). Opción para aprobar presupuesto manualmente si está en "Esperando Aprobación".',
        '  - **3. Listo para Retirar:**',
        '    - **Contenido:** Órdenes de Trabajo cuyo proceso técnico ha finalizado.',
        '    - **Estados Posibles:** `Reparado`, `Sin solución`.',
        '    - **Acciones Clave (con modales de confirmación):**',
        '      - `Notificar Cliente (Listo)`: Envía un recordatorio (simulado) al cliente indicando que su equipo está listo.',
        '      - `Marcar como Entregado`: Mueve la OT al área "Entregado y Bodega" con estado "Entregado". Registra la fecha de entrega.',
        '      - `Mover a Bodega`: Permite mover una OT que está lista para retirar directamente a bodega si no va a ser retirada inmediatamente, cambiando su estado a "En Bodega" y su área a "Entregado y Bodega".',
        '      - `Editar/Ver OT`: Permite actualizar detalles, como información de pago, antes de la entrega.',
        '  - **4. Entregado y Bodega:** (Nueva área combinada)',
        '    - **Contenido:** Órdenes de Trabajo que han sido efectivamente entregadas al cliente (`status: Entregado`) o que están almacenadas en el taller (`status: En Bodega`).',
        '    - **Acciones Clave (con modales de confirmación):**',
        '        - Para OTs "Entregadas": `Ver Ticket de OT`, `Mover a Bodega (Post-Entrega)` (cambia estado a "En Bodega").',
        '        - Para OTs "En Bodega": `Notificar Cliente (Almacenamiento Prolongado)`, `Ver Ticket de OT`.',
        '  - **5. Todas las Órdenes:**',
        '    - **Contenido:** Muestra **todas** las órdenes de trabajo existentes, independientemente de su área o estado actual.',
        '    - **Propósito:** Ofrece una visión global y unificada para búsquedas generales o seguimiento completo del historial de trabajo.',
        '    - **Columnas:** ID (con iconos de estado/origen), Cliente, Equipo, **Área actual**, Estado actual, Prioridad, Fecha de Creación.',
        '    - **Acciones:** `Editar/Ver OT`, `Generar Ticket`.',
        '**Funcionalidades Generales del Módulo:**',
        '  - **Conteo por Área en Pestañas:** Cada pestaña de área muestra el número de ítems que contiene.',
        '  - **Búsqueda:** Permite buscar dentro del área activa o en "Todas las Órdenes" por ID de OT/Solicitud, nombre del cliente, equipo, serial, área, estado, etc.',
        '  - **Nueva Orden Directa:** Botón para crear una Orden de Trabajo directamente en el área "Entrada a Taller", sin pasar por una Solicitud de Servicio previa.',
        '  - **Formulario de Creación/Edición de OT (Página Completa):**',
        '    - IDs, selección de cliente (con opción de agregar nuevo), información de equipo dinámica (con autocompletar y opción de agregar nuevos tipos/marcas/modelos), historial de equipo por serial, falla reportada, accesorios, fotos, notas internas, prioridad, asignación de técnico, información de pago.',
        '    - **Servicios a Domicilio Integrados:** Permite especificar si la OT es para servicio \'En Taller\' o \'A Domicilio\'. Para servicios a domicilio, se pueden especificar y agendar la `Dirección del Servicio` y la `Fecha y Hora de la Cita`.',
        '    - **Gestión de Estado y Área:** El campo "Área" es el principal para determinar la ubicación de la OT. El campo "Estado" en el formulario se actualiza dinámicamente según el "Área" seleccionada, ofreciendo solo los estados permitidos para esa área. Para OTs marcadas como "Entregada", estos campos se bloquean.',
        '    - **Presupuesto Detallado:** Se pueden añadir repuestos del inventario (el precio unitario se pre-llena pero es editable) y servicios manuales. Se pueden incluir "Notas en Factura" para cada ítem. Total del presupuesto calculado automáticamente.',
        '  - **Ticket de Orden de Trabajo:** Generación de un ticket detallado para cualquier OT, con opción de impresión (simulada) y envío (simulado) por canales digitales. El ticket incluye sección de "Notas en Factura" por ítem de presupuesto.',
        '  - **Indicador Visual de Origen:** Las OTs creadas a partir de un Servicio Programado muestran un ícono especial de calendario. Las OTs para servicio a domicilio muestran un ícono de camión.',
        '  - **Modales de Confirmación:** Acciones críticas como eliminar OT, cancelar solicitud, notificar, entregar, o mover a bodega, presentan un modal para confirmar la acción, previniendo errores.',
        '  - **Aprobación Manual de Presupuesto (Modal):** Para OTs "Esperando Aprobación", el personal puede aprobar manualmente el presupuesto a través de un modal que muestra el detalle completo antes de confirmar.',
      ],
      users: 'Recepcionistas, Técnicos, Administradores.',
    },
    {
      title: 'Clientes',
      description: `Módulo para administrar la base de datos de clientes. La página de detalle de cada cliente se organiza en pestañas para una mejor visualización de la información. Los montos se muestran en ${formatCurrencyCOP(0).split(' ')[0]} (COP).`,
      features: [
        '**Listado Principal de Clientes:**',
        '  - Tabla de "Clientes con Saldos Pendientes" destacada.',
        '  - Búsqueda global de clientes. Botón "Nuevo Cliente".',
        '**Formulario de Cliente:** Campos estándar como nombre, contacto, ID Fiscal, categoría, preferencias de comunicación.',
        '**Página de Detalle del Cliente (Organizada en Pestañas):**',
        '  - **1. Información General:** Datos principales del cliente, botón para "Editar Cliente".',
        '  - **2. Equipos Registrados:** Lista de equipos del cliente. Acciones: "Registrar Nuevo Equipo", "Ver Órdenes del Equipo" (filtra en módulo de OTs), "Programar Servicio" (crea un `ScheduledService`), "Editar/Eliminar Equipo".',
        '  - **3. Servicios Programados:** Lista de diagnósticos/mantenimientos programados. Acciones: "Convertir en OT", "Ver OT" (si ya fue convertida), "Editar/Eliminar Servicio".',
        '  - **4. Estado Financiero:** Resumen de deudas pendientes del cliente. Acción para "Enviar Recordatorio de Pago" (simulado).',
      ],
      users: 'Recepcionistas, Administradores, personal de atención al cliente.',
    },
    {
      title: 'Inventario',
      description: `Control y gestión del stock de repuestos y componentes. Los precios se muestran en ${formatCurrencyCOP(0).split(' ')[0]} (COP).`,
      features: [
        'Registro y edición de artículos: Nombre, SKU, descripción, categoría, precio de venta, precio de costo (Admin), información de compra (Admin).',
        'Control de stock: Cantidad actual y nivel mínimo. Alertas visuales para bajo stock.',
        'Tarjeta de Alertas de Stock Crítico en la vista principal del módulo.',
        'Ajuste de Stock: Modal para incrementar/decrementar cantidades.',
        'Filtros (por bajo stock) y búsqueda.',
        'Visualización de ganancia estimada por artículo para Administradores.',
      ],
      users: 'Técnicos, Recepcionistas, Administradores.',
    },
    {
      title: 'Contabilidad y Caja',
      description: `Registro y seguimiento de los movimientos financieros. Montos en ${formatCurrencyCOP(0).split(' ')[0]} (COP).`,
      features: [
        'Registro de transacciones (ingresos/egresos).',
        'Historial de movimientos con filtros por periodo (Todo, Hoy, Semana, Mes, Personalizado).',
        'Resumen Financiero en tarjetas: Ingresos, Egresos y Balance del periodo seleccionado. Balance de Caja Global.',
        'Vinculación a OTs e ítems de inventario (para CMV).',
        'Generación de informe simple de transacciones en un modal.',
      ],
      users: 'Contadores, Administradores.',
    },
    {
      title: 'Configuración de Empresa (Módulo Conceptual)',
      description: `Este módulo conceptual centralizaría todas las configuraciones globales del sistema, permitiendo a los administradores adaptar ${APP_NAME} a las necesidades específicas del taller. (Funcionalidad futura / en planificación).`,
      features: [
        "**Datos de la Empresa:** Configuración del nombre del taller, dirección, información de contacto, logo, y otros detalles que aparecerán en documentos y comunicaciones.",
        "**Configuración de Notificaciones:**",
        "  - **Plantillas de Correo Electrónico:** Personalización de las plantillas de correo para diferentes tipos de notificaciones (ej. OT lista, presupuesto disponible, recordatorios).",
        "  - **Integración WhatsApp (Platzhalter):** Configuración de la conexión con servicios de API de WhatsApp Business para el envío de notificaciones automáticas (requiere configuración externa y cuenta de WhatsApp Business API).",
        "  - **Preferencias Generales de Notificación:** Definir qué eventos disparan notificaciones automáticas y por qué canales por defecto.",
        "**Parámetros del Sistema:**",
        "  - **Formatos de ID de OT:** Definir prefijos o secuencias para los IDs de las órdenes de trabajo.",
        "  - **Términos y Condiciones:** Edición de los términos y condiciones que aparecen en los tickets de OT y otros documentos.",
        "  - **Configuración de Moneda y Fiscal:** Definir la moneda principal (por defecto ${formatCurrencyCOP(0).split(' ')[0]}) y otros parámetros fiscales relevantes.",
        "**Integraciones (Platzhalter):** Sección para futuras integraciones con otras herramientas (ej. software contable externo, pasarelas de pago).",
      ],
      users: 'Exclusivamente Administradores.',
    },
     {
      id: 'client-portal-section', // Added ID for direct linking
      title: 'Portal del Cliente',
      description: 'Un módulo dedicado para que los clientes interactúen con el sistema de forma autónoma, mejorando la comunicación y la transparencia.',
      features: [
        '**Acceso Seguro:** Login independiente para clientes (email + ID Fiscal).',
        '**Dashboard del Cliente:** Vista general de sus equipos, servicios activos y notificaciones. Incluye acciones rápidas para navegar a otras secciones del portal.',
        '**Mis Equipos:** Visualización de equipos registrados por el cliente. Opción para "Solicitar Servicio" para un equipo existente.',
        '**Mis Servicios / OTs:** Seguimiento en tiempo real del estado de sus equipos actualmente en servicio. Acceso a detalles de la OT y opción para **aprobar/rechazar presupuestos pendientes** mediante un modal interactivo, incluyendo la posibilidad de añadir un motivo de rechazo.',
        '**Solicitar Nuevo Servicio:** Formulario para que los clientes puedan describir problemas o requerir nuevos servicios para sus equipos registrados, para equipos nuevos (proporcionando detalles básicos del nuevo equipo), o solicitar una visita técnica general (sin especificar equipo).',
        '**Historial de Servicios:** Acceso a un registro detallado de todos los servicios y reparaciones realizados (funcionalidad básica actual).',
        '**Mi Información:** Visualización de sus datos de contacto registrados.',
        '**Guía del Portal:** Acceso a esta misma guía desde el portal.',
        '**Presupuesto Personal:** Los clientes también pueden acceder a su módulo de presupuesto personal desde el portal.',
      ],
      users: 'Clientes del taller.',
    },
    {
      id: 'client-portal-management-section',
      title: 'Gestión Portal Clientes (Admin)',
      description: 'Sección para que los Administradores supervisen y configuren aspectos del Portal de Clientes.',
      features: [
        '**Estadísticas (Simuladas):** Visualización de métricas como usuarios activos del portal, solicitudes de servicio y presupuestos gestionados a través del portal.',
        '**Acciones Rápidas:** Enlaces para "Gestionar Usuarios Clientes" (lleva a Gestión de Usuarios filtrado por Clientes, conceptualmente), "Configurar Portal" (lleva a la sección correspondiente en Configuración IA), y "Ver Guía del Portal".',
        '**Actividad Reciente (Simulada):** Log de las últimas acciones de los clientes en el portal.',
      ],
      users: 'Exclusivamente Administradores.',
    },
     {
      title: 'Gestión de Usuarios y Roles',
      description: 'Administración centralizada de las cuentas de usuario del sistema (personal interno) y sus respectivos niveles de acceso, garantizando la seguridad y la correcta asignación de responsabilidades.',
      features: [
        '**Gestión de Usuarios Internos:**',
        '  - Creación, edición y eliminación de cuentas de usuario para el personal del taller (Admin, Técnico, Recepcionista, etc.).',
        '  - Campos gestionables: Nombre de usuario, email (opcional), rol, contraseña (con confirmación).',
        '  - La tabla muestra username, email, rol, último login (simulado) y estado (simulado).',
        '**Gestión de Roles (Visualización):**',
        '  - Visualización de roles predefinidos (Admin, Técnico, etc.) y sus descripciones.',
        '  - (Futuro) Configuración detallada de permisos para cada rol.',
      ],
      users: 'Exclusivamente Administradores.',
    },
    {
      title: 'Configuración IA (Inteligencia Artificial)',
      description: 'Herramientas potenciadas por IA (Inteligencia Artificial Gemini) para asistir en tareas técnicas. Solo accesible para Administradores.',
      features: [
        '**Generador de Plantillas de Diagnóstico (IA):** Genera plantillas de diagnóstico estructuradas basadas en la descripción de un problema técnico.',
        '**Búsqueda Web Asistida por IA (Google Search):** Realiza búsquedas web para obtener información técnica actualizada, mostrando resultados y fuentes citadas.',
        '**Configuración del Portal de Clientes (Simulada):** Permite habilitar/deshabilitar el portal, personalizar el mensaje de bienvenida y simular la activación de funcionalidades específicas del portal.',
        '**Seguridad y Permisos (Simulada):** Muestra información conceptual sobre 2FA y la gestión de roles.',
      ],
      users: 'Exclusivamente Administradores.',
    },
    {
      title: 'Presupuesto Personal',
      description: 'Un módulo disponible para todos los usuarios (personal interno y clientes) para ayudarles a gestionar sus finanzas personales. Este módulo es independiente de la contabilidad del taller.',
      features: [
        '**Registro de Gastos:** Permite agregar gastos personales detallando categoría, descripción, monto, fecha del gasto, fecha de vencimiento (opcional).',
        '**Gastos Recurrentes:** Opción para marcar gastos como recurrentes y definir su periodicidad (Diario, Semanal, Mensual, etc.).',
        '**Estado de Pago:** Marcar gastos como Pagados, Pendientes o Vencidos (si aplica fecha de vencimiento).',
        '**Alertas de Pagos (Visuales):** Tarjeta que muestra pagos vencidos y próximos vencimientos (en 7 días).',
        '**Resumen Mensual:** Tarjetas con total gastado en el mes actual, gastos pendientes del mes, y valor de vencimientos próximos.',
        '**Filtros:** Filtrar gastos por periodo (mes actual, mes anterior, todo, personalizado), categoría y estado de pago.',
        '**Tabla de Gastos:** Visualización de todos los gastos con opción de editar y eliminar.',
        '**Integración con Calendario (Google):** Botón para añadir gastos con fecha de vencimiento a Google Calendar.',
      ],
      users: 'Todos los usuarios (Personal Interno y Clientes).',
    },
    {
      title: 'Próximas Mejoras y Sugerencias',
      description: `Estas son algunas de las funcionalidades y mejoras que están en nuestro radar para futuras versiones de ${APP_NAME}, con el objetivo de seguir potenciando la eficiencia y capacidad de tu taller:`,
      features: [
        "**Plantillas de Documentos Personalizables:**",
        "  - Configuración de plantillas para la Entrada de Equipos, Diagnósticos Técnicos detallados, y Actas de Entrega.",
        "  - (Futuro) Opción para incluir firmas digitales para una gestión sin papel.",
        "**Optimización Móvil Completa:**",
        "  - Asegurar que todos los módulos del sistema, incluyendo el Portal del Cliente, sean completamente responsivos y ofrezcan una experiencia de usuario óptima en dispositivos móviles y tablets.",
        "**Notificaciones Avanzadas y Reales:**",
        "  - Implementación completa de la integración con servicios de Email transaccional.",
        "  - Integración con API de WhatsApp Business para notificaciones automáticas y manuales (requerirá configuración y cuenta por parte del taller).",
        "**Gestión de Pagos Integrada (Mejorada):**",
        "  - Posibilidad de registrar pagos parciales y completos directamente en la Orden de Trabajo, con reflejo automático en el módulo de Contabilidad.",
        "  - (Futuro) Integración con pasarelas de pago online para que los clientes puedan realizar abonos o pagos completos a través del Portal del Cliente.",
        "**Flujo de Actualización de Datos de Equipos por Cliente:**",
        "  - Permitir a los clientes, a través de su portal, solicitar cambios o actualizaciones en la información de sus equipos registrados (ej. cambio de ubicación, corrección de modelo).",
        "  - Estas solicitudes requerirían validación y aprobación manual por parte del personal del taller antes de aplicarse.",
        "**Panel Especializado para Clientes Empresariales:**",
        "  - Una vista adaptada en el Portal del Cliente para usuarios de tipo 'Empresa' o 'Empresa Plus', que les permita gestionar y visualizar el estado de múltiples equipos y servicios de forma consolidada y eficiente.",
        "**Módulo de Compras y Proveedores:**",
        "  - Gestión de la base de datos de proveedores.",
        "  - Creación y seguimiento de órdenes de compra para repuestos y suministros.",
        "  - Vinculación de costos de compra con los precios de venta en el inventario para un mejor cálculo de márgenes.",
        "**Integración con Calendario Externo para Técnicos:**",
        "  - (Futuro) Permitir la sincronización de servicios a domicilio o tareas asignadas con calendarios externos (Google Calendar, Outlook Calendar) para los técnicos.",
        "**Dashboard Personalizable:**",
        "  - (Futuro) Opción para que los usuarios puedan seleccionar y organizar los widgets o métricas que desean ver en su dashboard principal.",
      ],
      users: 'Todos los usuarios se beneficiarán de estas mejoras progresivas.',
    }
  ];

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-primary dark:text-primary-light mb-2">Guía de Funcionalidades de {APP_NAME}</h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Descubre todo lo que puedes hacer con nuestra plataforma de gestión de talleres.
        </p>
      </div>

      <div className="space-y-8">
        {sections.map((section, index) => (
          <Card key={index} title={section.title} className="shadow-xl hover:shadow-2xl transition-shadow duration-300" id={section.id /* Added id here */}>
            {section.description && <p className="text-slate-700 dark:text-slate-300 mb-4">{section.description}</p>}
            
            {section.features.length > 0 && (
              <>
                <h4 className="font-semibold text-md text-slate-800 dark:text-slate-100 mb-2">
                  {section.title === `Bienvenido a ${APP_NAME}` || section.title === 'Filosofía del Sistema: Administrable y Configurable' ? 'Principios Clave:' : 'Funcionalidades Clave:'}
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 mb-4">
                  {section.features.map((feature, fIndex) => (
                    <li key={fIndex} dangerouslySetInnerHTML={{ __html: feature.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/(\s*-\s*)/g, '<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- ') }}></li>
                  ))}
                </ul>
              </>
            )}
            
            {section.users && (
              <p className="text-sm text-slate-500 dark:text-slate-500">
                <span className="font-semibold">Usuarios Típicos:</span> {section.users}
              </p>
            )}
          </Card>
        ))}
      </div>

       <footer className="mt-12 py-6 text-center text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
        <p>&copy; {new Date().getFullYear()} {APP_NAME}. Esperamos que esta guía te sea de utilidad.</p>
      </footer>
    </div>
  );
};

export default AppGuidePage;