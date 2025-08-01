# Sistema de Eventos Programados - Malbouche

## Descripción General

El sistema de eventos programados permite ejecutar movimientos automáticamente en el reloj ESP32 según horarios específicos y días de la semana configurados.

## Estructura de Datos en Firebase

### Colección: `eventos`

```javascript
{
  id: "eventId123",
  nombreEvento: "Evento Matutino",
  activo: true,
  horaInicio: "08:30",
  horaFin: "08:31", // Opcional
  diasSemana: {
    Lu: true,
    Ma: true,
    Mi: true,
    Ju: true,
    Vi: true,
    Sa: false,
    Do: false
  },
  movementId: "movementId456",
  creadorPor: "userId789",
  fechaCreacion: "2025-01-01T08:00:00.000Z",
  fechaActualizacion: "2025-01-15T10:00:00.000Z"
}
```

## Componentes del Sistema

### 1. EventSchedulerService
- **Ubicación**: `utils/EventSchedulerService.js`
- **Función**: Servicio principal que maneja la lógica de programación y ejecución de eventos
- **Características**:
  - Verificación periódica cada minuto
  - Caché local de eventos para funcionamiento offline
  - Detección automática de horarios
  - Ejecución de movimientos a través de UnifiedClockService
  - Logging de ejecuciones

### 2. useEventScheduler Hook
- **Ubicación**: `hooks/useEventScheduler.js`
- **Función**: Hook de React para manejar el programador desde componentes
- **Características**:
  - Auto-inicio del programador
  - Gestión de estado del programador
  - Actualización de IP del ESP32
  - Recarga manual de eventos

### 3. Integración en Main Screen
- **Ubicación**: `principals/restricted/main.js`
- **Función**: Integración visual y funcional en la pantalla principal
- **Características**:
  - Indicador visual del estado del programador
  - Toggle para activar/desactivar programador
  - Contador de eventos activos

## Funcionamiento

### Inicio del Programador
1. Se carga automáticamente al iniciar la app si hay IP configurada
2. Descarga eventos activos desde Firebase
3. Los almacena en caché local
4. Inicia verificación periódica cada minuto

### Verificación de Eventos
1. Cada minuto verifica la hora y día actuales
2. Compara con los eventos programados
3. Ejecuta eventos que coincidan con el horario actual
4. Registra las ejecuciones

### Ejecución de Movimientos
1. Obtiene datos del movimiento desde el backend
2. Determina si es un preset o movimiento personalizado
3. Envía comando al ESP32 usando UnifiedClockService
4. Registra el resultado de la ejecución

## Uso desde la Interfaz

### Indicador Visual
- **Icono de reloj**: Muestra el estado del programador
- **Número**: Cantidad de eventos activos
- **Color**: Verde cuando está activo, gris cuando está inactivo

### Interacción
- **Tap en indicador**: Activa/desactiva el programador
- **Actualización automática**: Se actualiza cuando se configura nueva IP

## API Endpoints Requeridos

### Obtener Eventos
```
GET /api/events
Authorization: Bearer {token}
Response: {
  success: true,
  data: [eventos...]
}
```

### Obtener Movimiento por ID
```
GET /api/movements/{movementId}
Authorization: Bearer {token}
Response: {
  success: true,
  data: {movimiento...}
}
```

## Configuración de Eventos

### Estructura Recomendada para Firebase
```javascript
// Días de la semana
const diasSemana = {
  Lu: boolean,  // Lunes
  Ma: boolean,  // Martes
  Mi: boolean,  // Miércoles
  Ju: boolean,  // Jueves
  Vi: boolean,  // Viernes
  Sa: boolean,  // Sábado
  Do: boolean   // Domingo
};

// Horarios en formato HH:MM (24 horas)
const horaInicio = "08:30";
const horaFin = "08:31"; // Opcional, para eventos de duración específica
```

## Características Especiales

### Tolerancia de Tiempo
- Los eventos se ejecutan con una tolerancia de ±1 minuto
- Esto evita perder eventos por pequeñas demoras en la verificación

### Funcionamiento Offline
- Los eventos se almacenan en caché local
- Continúan ejecutándose aunque no haya conexión al servidor
- Se sincronizan cuando se restablece la conexión

### Auto-detección de Dispositivo
- El sistema detecta automáticamente el tipo de ESP32 (estándar o prototipo)
- Adapta los comandos según el tipo de dispositivo

### Logging
- Todas las ejecuciones se registran localmente
- Incluye información de éxito/fallo y mensajes de error
- Se mantienen los últimos 100 logs

## Solución de Problemas

### El programador no inicia
- Verificar que hay IP del ESP32 configurada
- Verificar conectividad de red
- Revisar logs en consola

### Los eventos no se ejecutan
- Verificar que los eventos estén marcados como `activo: true`
- Verificar configuración de días de la semana
- Verificar formato de hora (HH:MM)
- Verificar que el movimiento asociado existe

### Error de comunicación con ESP32
- Verificar que el ESP32 esté conectado a la misma red WiFi
- Verificar que la IP sea correcta
- Probar conexión manual desde la app

## Extensiones Futuras

### Posibles Mejoras
1. **Eventos recurrentes**: Soporte para patrones más complejos (cada X días, mensual, etc.)
2. **Notificaciones**: Alertas cuando se ejecutan eventos o fallan
3. **Historial extendido**: Almacenamiento de historial en el servidor
4. **Eventos condicionales**: Ejecución basada en sensores o condiciones externas
5. **Grupos de eventos**: Organización y gestión por categorías
