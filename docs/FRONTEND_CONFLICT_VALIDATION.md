# 🔧 Frontend Actualizado - Soporte p**Funciones principales:**
```javascript
// Operaciones de eventos (ahora con auto-refresh)
await createEvent(eventData)         // Dispara refresh automático
await updateEvent(eventId, eventData) // Dispara refresh automático 
await deleteEvent(eventId)           // Dispara refresh automático
await getAllEvents()

// Operaciones de movimientos
await getAllMovements()

// Manejo de errores
handleEventConflictError(error)
handleApiError(error)

// Servicio de refresh
eventRefreshService.requestRefresh()
eventRefreshService.subscribe(callback)
```ción de Conflictos de Eventos

## 📋 Resumen de Cambios

El frontend ha sido actualizado para soportar completamente la nueva **validación automática de conflictos de horarios** implementada en el backend. Esto incluye manejo inteligente de errores, mensajes informativos para el usuario y navegación mejorada.

## 🆕 Nuevos Archivos Creados

### 1. `utils/apiClient.js`
**Propósito:** Cliente API centralizado con soporte para validación de conflictos.

**Características principales:**
- ✅ Funciones API unificadas (`createEvent`, `updateEvent`, `deleteEvent`, etc.)
- ✅ Manejo automático de autenticación JWT
- ✅ Detección específica de errores de conflicto
- ✅ Funciones de utilidad para manejo de errores
- ✅ **Auto-refresh automático** después de operaciones exitosas

### 2. `utils/eventErrorHandler.js`
**Propósito:** Componentes y hooks para manejo de errores con interfaz de usuario.

**Características principales:**
- ✅ Alertas específicas para conflictos de horarios
- ✅ Opciones de navegación inteligente
- ✅ Hook personalizado para operaciones de eventos
- ✅ Mensajes de error amigables
- ✅ **Soporte para navegación automática** a pantalla de eventos

### 3. `utils/eventRefreshService.js` 🆕
**Propósito:** Servicio centralizado para manejo de recargas de eventos.

**Características principales:**
- ✅ Patrón Observer para notificar cambios
- ✅ Singleton para mantener estado global
- ✅ Suscripción/desuscripción automática
- ✅ Logging para debugging

**Funciones principales:**
```javascript
// Mostrar alertas específicas
showEventConflictAlert(conflictInfo, onViewEvents, onEditEvent)
showValidationErrorAlert(errorInfo)
showGenericErrorAlert(errorInfo)

// Hook para manejo de operaciones
const { handleEventOperationResult } = useEventErrorHandler()
```

## 🔄 Archivos Actualizados

### 1. `principals/restricted/newEventScreen.js`
**Cambios realizados:**
- ✅ Importación de nuevas funciones API
- ✅ Uso del hook `useEventErrorHandler`
- ✅ Manejo específico de conflictos con alertas informativas
- ✅ Estado de carga con botón deshabilitado
- ✅ **Navegación automática a Events screen** después de creación exitosa

**Mejoras visibles:**
- Botón "Creating..." durante creación
- Alertas detalladas con opciones de navegación
- Manejo robusto de errores de validación
- **Recarga automática** de la lista de eventos

### 2. `principals/restricted/editEventModal.js`
**Cambios realizados:**
- ✅ Migración a nuevas funciones API
- ✅ Detección inteligente de conflictos durante edición
- ✅ Estado de carga mejorado
- ✅ Manejo simplificado de eliminación
- ✅ **Navegación automática a Events screen** después de editar/eliminar

**Mejoras visibles:**
- Botón "Updating..." durante actualización
- Alertas específicas para conflictos
- Opción de navegar a eventos existentes
- **Recarga automática** después de operaciones

### 3. `principals/restricted/eventsScreen.js`
**Cambios realizados:**
- ✅ Uso de funciones API centralizadas
- ✅ Manejo mejorado de errores en `fetchData`
- ✅ Simplificación de `toggleEventStatus`
- ✅ Eliminación de código duplicado
- ✅ **Implementación de `useFocusEffect`** para recarga automática
- ✅ **Suscripción al servicio de refresh** para actualizaciones inmediatas

**Mejoras visibles:**
- Carga más robusta de datos
- Manejo consistente de errores
- Mejor experiencia de usuario
- **Recarga automática** al volver a la pantalla

## 🔄 Sistema de Recarga Automática

### Mecanismos Implementados

**1. Navegación Automática**
- Después de crear, editar o eliminar un evento, el usuario es dirigido automáticamente a la pantalla `Events`
- Esto asegura que siempre vea la información más actualizada

**2. useFocusEffect Hook**
- La pantalla `EventsScreen` se recarga automáticamente cuando recibe el foco
- Funciona cuando el usuario navega de vuelta desde otras pantallas

**3. Event Refresh Service**
- Servicio centralizado que notifica cambios usando el patrón Observer
- Las operaciones exitosas de API disparan automáticamente una señal de recarga
- La pantalla de eventos se suscribe a estas señales para recargar inmediatamente

### Flujo de Actualización

```
1. Usuario crea/edita/elimina evento
     ↓
2. API operation successful
     ↓
3. eventRefreshService.requestRefresh()
     ↓
4. EventsScreen recibe notificación
     ↓
5. fetchData() ejecutado automáticamente
     ↓
6. Lista actualizada sin intervención del usuario
```

### Ventajas del Sistema

- ✅ **Inmediato:** No hay delay en ver los cambios
- ✅ **Automático:** No requiere pull-to-refresh manual
- ✅ **Confiable:** Múltiples mecanismos de respaldo
- ✅ **Eficiente:** Solo recarga cuando es necesario
- ✅ **User-friendly:** Experiencia fluida y transparente

## 🎯 Funcionalidades de Validación de Conflictos

### Detección Automática
El sistema ahora detecta automáticamente cuando un evento tendría conflictos de horario:

**Criterios de conflicto:**
- ✅ **Solapamiento de días:** Eventos que comparten al menos un día de la semana
- ✅ **Solapamiento de horarios:** Rangos de tiempo que se superponen
- ✅ **Solo eventos activos:** Solo considera eventos con `activo: true`

### Ejemplos de Comportamiento

**❌ Conflicto detectado:**
```
Evento existente: 09:00-10:00, días ["Lunes", "Martes"]
Nuevo evento:     09:30-10:30, días ["Lunes"] 
→ Error: "Conflicto de horarios detectado con el evento..."
```

**✅ Permitido:**
```
Evento existente: 09:00-10:00, días ["Lunes"]
Nuevo evento:     10:00-11:00, días ["Lunes"] 
→ OK: Eventos consecutivos permitidos
```

### Respuesta del Usuario
Cuando se detecta un conflicto, el usuario ve:

1. **Alerta informativa** con detalles del conflicto
2. **Opciones de navegación:**
   - "Ver Eventos Existentes" → Navega a `Events`
   - "Modificar Horarios" → Permanece en pantalla actual
   - "Entendido" → Cierra la alerta

## 🔄 Flujo de Trabajo Mejorado

### Crear Nuevo Evento
1. Usuario completa formulario
2. Hace clic en "Create event"
3. **Validación automática en backend**
4. Si hay conflicto → Alerta con opciones
5. Si es exitoso → Confirmación y navegación

### Editar Evento Existente
1. Usuario modifica campos
2. Hace clic en "Update Event"
3. **Validación inteligente:** Solo si cambió horarios/días
4. Si hay conflicto → Alerta con sugerencias
5. Si es exitoso → Confirmación y navegación

### Activar/Desactivar Evento
1. Usuario hace toggle del switch
2. **Validación automática** al activar
3. Si hay conflicto → Alerta y reversión
4. Si es exitoso → Estado actualizado

## 🎨 Mejoras de Interfaz de Usuario

### Estados de Carga
- Botones muestran "Creating...", "Updating..." durante operaciones
- Botones se deshabilitan durante carga
- Estilo visual diferente para botones deshabilitados

### Manejo de Errores
- Alertas específicas por tipo de error
- Títulos descriptivos ("Conflicto de Horarios", "Error de Validación")
- Opciones de navegación contextual
- Mensajes amigables y claros

### Navegación Inteligente
- Redirección automática tras operaciones exitosas
- Opciones de navegación en alertas de error
- Preservación del contexto del usuario

## 🧪 Casos de Prueba Recomendados

### Prueba de Conflictos
1. **Crear evento con horario superpuesto:**
   - Crear evento: "Prueba 1" (09:00-10:00, Lunes)
   - Intentar crear: "Prueba 2" (09:30-10:30, Lunes)
   - **Esperado:** Alerta de conflicto con opciones

2. **Editar evento para crear conflicto:**
   - Editar evento existente para superponer con otro
   - **Esperado:** Alerta de conflicto, evento no se actualiza

3. **Eventos consecutivos (permitidos):**
   - Crear evento: "Prueba A" (09:00-10:00, Lunes)
   - Crear evento: "Prueba B" (10:00-11:00, Lunes)
   - **Esperado:** Ambos eventos creados exitosamente

### Prueba de Estados de Carga
1. **Crear evento con conexión lenta:**
   - **Esperado:** Botón muestra "Creating..." y se deshabilita
   
2. **Actualizar evento:**
   - **Esperado:** Botón muestra "Updating..." durante operación

### Prueba de Navegación
1. **Conflicto en nuevo evento:**
   - **Esperado:** Opción "Ver Eventos Existentes" lleva a lista
   
2. **Conflicto en edición:**
   - **Esperado:** Opción "Modificar Horarios" mantiene en pantalla actual

## 📚 Documentación de Referencia

- **Backend API:** Ver `backend/Guide.md` para detalles de la validación
- **Estructura de errores:** Ver `backend/backendreadme.md` 
- **Ejemplos de código:** Ver comentarios en `utils/apiClient.js`

## ✅ Beneficios del Sistema Actualizado

1. **🛡️ Prevención automática** de conflictos de horarios
2. **🎯 Experiencia de usuario mejorada** con alertas informativas
3. **🔄 Navegación inteligente** basada en contexto
4. **📱 Interfaz consistente** en todas las pantallas
5. **🔧 Código mantenible** con funciones centralizadas
6. **⚡ Operaciones optimizadas** con manejo de estados

El frontend ahora está completamente preparado para manejar la validación de conflictos de eventos del backend, proporcionando una experiencia de usuario fluida y informativa.
