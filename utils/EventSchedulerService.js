/**
 * EventSchedulerService.js
 * Servicio para programar y ejecutar eventos de movimientos automáticos en el reloj
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import UnifiedClockService from './UnifiedClockService';

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';
const SCHEDULER_INTERVAL = 30000; // Verificar cada 30 segundos para mayor precisión
const EVENTS_REFRESH_INTERVAL = 300000; // Recargar eventos cada 5 minutos (300000ms)
const EVENTS_STORAGE_KEY = 'cached_events';

class EventSchedulerService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.eventsRefreshIntervalId = null; // Nuevo: intervalo para recargar eventos
    this.cachedEvents = [];
    this.espIp = null;
    this.lastEventsRefresh = null; // Timestamp de última recarga
  }

  /**
   * Inicia el programador de eventos
   * @param {string} espIp - IP del ESP32 para enviar comandos
   */
  async start(espIp) {
    if (this.isRunning) {
      console.log('Event scheduler ya está ejecutándose');
      return;
    }

    this.espIp = espIp;
    this.isRunning = true;
    
    console.log('Iniciando programador de eventos...');
    
    // Cargar eventos iniciales
    await this.loadEvents();
    
    // Verificar eventos inmediatamente
    await this.checkAndExecuteEvents();
    
    // Programar verificaciones periódicas de eventos
    this.intervalId = setInterval(async () => {
      await this.checkAndExecuteEvents();
    }, SCHEDULER_INTERVAL);
    
    // Programar recarga automática de eventos desde el servidor
    this.eventsRefreshIntervalId = setInterval(async () => {
      console.log('🔄 Recarga automática de eventos desde el servidor...');
      await this.loadEvents();
    }, EVENTS_REFRESH_INTERVAL);
    
    console.log(`Programador de eventos iniciado - Verificaciones cada ${SCHEDULER_INTERVAL/1000}s, Recarga cada ${EVENTS_REFRESH_INTERVAL/60000} minutos`);
  }

  /**
   * Detiene el programador de eventos
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    console.log('Deteniendo programador de eventos...');
    
    // Limpiar intervalo de verificación de eventos
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Limpiar intervalo de recarga de eventos
    if (this.eventsRefreshIntervalId) {
      clearInterval(this.eventsRefreshIntervalId);
      this.eventsRefreshIntervalId = null;
    }
    
    this.isRunning = false;
    console.log('Programador de eventos detenido');
  }

  /**
   * Actualiza la IP del ESP32
   * @param {string} espIp - Nueva IP del ESP32
   */
  updateESPIP(espIp) {
    this.espIp = espIp;
    console.log('IP del ESP32 actualizada:', espIp);
  }

  /**
   * Carga eventos desde el backend y los almacena en caché
   */
  async loadEvents() {
    try {
      console.log('📥 Cargando eventos desde el servidor...');
      
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.warn('No hay token de autenticación, usando eventos en caché');
        await this.loadCachedEvents();
        return;
      }

      const response = await fetch(`${BACKEND_URL}/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error cargando eventos:', response.status);
        await this.loadCachedEvents();
        return;
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Filtrar solo eventos activos
        const newEvents = data.data.filter(event => event.activo === true);
        const previousCount = this.cachedEvents.length;
        
        // Comparar si hay cambios
        const hasChanges = this.hasEventsChanged(this.cachedEvents, newEvents);
        
        this.cachedEvents = newEvents;
        this.lastEventsRefresh = new Date();
        
        // Guardar en caché local
        await AsyncStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(this.cachedEvents));
        
        if (hasChanges) {
          console.log(`✅ Eventos actualizados: ${previousCount} → ${this.cachedEvents.length} eventos activos`);
          console.log('📋 Eventos cargados:', this.cachedEvents.map(e => `"${e.nombreEvento}" (${e.horaInicio})`));
        } else {
          console.log(`📋 Eventos verificados: ${this.cachedEvents.length} eventos activos (sin cambios)`);
        }
      } else {
        console.error('Formato de datos de eventos inválido');
        await this.loadCachedEvents();
      }
    } catch (error) {
      console.error('Error de red cargando eventos:', error);
      await this.loadCachedEvents();
    }
  }

  /**
   * Carga eventos desde el almacenamiento local
   */
  async loadCachedEvents() {
    try {
      const cachedData = await AsyncStorage.getItem(EVENTS_STORAGE_KEY);
      if (cachedData) {
        this.cachedEvents = JSON.parse(cachedData);
        console.log(`${this.cachedEvents.length} eventos cargados desde caché`);
      } else {
        this.cachedEvents = [];
        console.log('No hay eventos en caché');
      }
    } catch (error) {
      console.error('Error cargando eventos desde caché:', error);
      this.cachedEvents = [];
    }
  }

  /**
   * Compara dos listas de eventos para detectar cambios
   * @param {Array} oldEvents - Lista anterior de eventos
   * @param {Array} newEvents - Lista nueva de eventos
   * @returns {boolean} True si hay cambios
   */
  hasEventsChanged(oldEvents, newEvents) {
    if (oldEvents.length !== newEvents.length) {
      return true;
    }
    
    // Crear mapas por ID para comparación eficiente
    const oldMap = new Map(oldEvents.map(e => [e.id, e]));
    const newMap = new Map(newEvents.map(e => [e.id, e]));
    
    // Verificar si hay eventos nuevos o eliminados
    for (const id of newMap.keys()) {
      if (!oldMap.has(id)) {
        return true; // Evento nuevo
      }
    }
    
    for (const id of oldMap.keys()) {
      if (!newMap.has(id)) {
        return true; // Evento eliminado
      }
    }
    
    // Verificar si hay cambios en eventos existentes
    for (const [id, newEvent] of newMap.entries()) {
      const oldEvent = oldMap.get(id);
      
      // Comparar campos clave que afectan la ejecución
      if (oldEvent.activo !== newEvent.activo ||
          oldEvent.horaInicio !== newEvent.horaInicio ||
          oldEvent.movementId !== newEvent.movementId ||
          JSON.stringify(oldEvent.diasSemana) !== JSON.stringify(newEvent.diasSemana)) {
        return true; // Evento modificado
      }
    }
    
    return false; // No hay cambios significativos
  }

  /**
   * Verifica y ejecuta eventos que deben activarse
   */
  async checkAndExecuteEvents() {
    if (!this.espIp) {
      console.log('No hay IP del ESP32 configurada, saltando verificación de eventos');
      return;
    }

    const now = new Date();
    const currentTime = this.getCurrentTimeString(now);
    
    // Obtener el día actual en formato de array para logging
    const dayMapping = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    const currentDayFormatted = dayMapping[now.getDay()];
    
    console.log(`🕐 Verificando eventos para ${currentDayFormatted} a las ${currentTime} (${this.cachedEvents.length} eventos cargados)`);

    let eventsChecked = 0;
    let eventsExecuted = 0;

    for (const event of this.cachedEvents) {
      eventsChecked++;
      
      if (this.shouldExecuteEvent(event, currentTime)) {
        console.log(`⚡ EJECUTANDO evento: "${event.nombreEvento}" programado para ${event.horaInicio}`);
        await this.executeEvent(event);
        eventsExecuted++;
      }
    }

    if (eventsExecuted > 0) {
      console.log(`✅ Verificación completada: ${eventsExecuted} eventos ejecutados de ${eventsChecked} verificados`);
    } else {
      console.log(`⏳ Verificación completada: No hay eventos para ejecutar ahora (${eventsChecked} eventos verificados)`);
    }
  }

  /**
   * Determina si un evento debe ejecutarse en el momento actual
   * @param {Object} event - Evento a verificar
   * @param {string} currentTime - Hora actual (ej: "14:30")
   * @param {Date} [dateToCheck] - Fecha específica a verificar (opcional, usa fecha actual por defecto)
   * @returns {boolean} True si el evento debe ejecutarse
   */
  shouldExecuteEvent(event, currentTime, dateToCheck = null) {
    if (!event.activo) {
      return false;
    }

    // Verificar si el evento está programado para el día actual
    const diasSemana = event.diasSemana || [];
    
    // Mapear el día actual al formato usado en los eventos (formato inglés abreviado)
    // Los eventos usan: ["Su", "M", "T", "W", "Th", "F", "Sa"]
    // JavaScript getDay() devuelve: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
    const dayMapping = ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'];
    const dateForCheck = dateToCheck || new Date();
    const currentDayFormatted = dayMapping[dateForCheck.getDay()];
    
    // Verificar si el día actual está en el array de días del evento
    if (!Array.isArray(diasSemana) || !diasSemana.includes(currentDayFormatted)) {
      console.log(`📅 Evento "${event.nombreEvento}" no programado para ${currentDayFormatted}. Días: [${diasSemana.join(', ')}]`);
      return false;
    }

    // Verificar hora de inicio
    const horaInicio = event.horaInicio;
    if (!horaInicio) {
      return false;
    }

    // Convertir horas a minutos para comparación más fácil
    const currentMinutes = this.timeToMinutes(currentTime);
    const startMinutes = this.timeToMinutes(horaInicio);
    
    // El evento debe ejecutarse si es exactamente la hora de inicio
    // (con un margen de 30 segundos para mayor precisión)
    const timeDiff = Math.abs(currentMinutes - startMinutes);
    
    // También verificar que no se haya ejecutado recientemente
    const eventKey = `${event.id}_${currentDayFormatted}_${horaInicio}`;
    const lastExecution = this.lastExecutions?.[eventKey];
    const now = Date.now();
    
    // Evitar ejecutar el mismo evento múltiples veces en la misma hora
    if (lastExecution && (now - lastExecution) < 60000) { // 1 minuto de cooldown
      return false;
    }
    
    const shouldExecute = timeDiff < 0.5; // Menos de 30 segundos de diferencia
    
    if (shouldExecute) {
      // Registrar la ejecución para evitar duplicados
      if (!this.lastExecutions) this.lastExecutions = {};
      this.lastExecutions[eventKey] = now;
    }
    
    return shouldExecute;
  }

  /**
   * Ejecuta un evento específico
   * @param {Object} event - Evento a ejecutar
   */
  async executeEvent(event) {
    try {
      console.log(`🎯 Ejecutando evento: ${event.nombreEvento}`);
      
      // Obtener el ID del movimiento a ejecutar
      const movementId = event.movementId;
      if (!movementId) {
        console.error('Evento sin movimiento asociado:', event.nombreEvento);
        return;
      }

      // Buscar el movimiento en el backend
      const movement = await this.getMovementById(movementId);
      if (!movement) {
        console.error('Movimiento no encontrado:', movementId);
        return;
      }

      console.log(`📋 Ejecutando movimiento: ${movement.nombre}`);

      // 1. PRIMERO: Actualizar el movimiento en la base de datos (como en main.js)
      const updateResult = await this.updateMovementInBackend(movement);
      if (!updateResult.success) {
        console.error(`Error actualizando movimiento en BD: ${updateResult.message}`);
        await this.logEventExecution(event, false, updateResult.message);
        return;
      }

      // 2. SEGUNDO: Enviar el movimiento al ESP32 usando UnifiedClockService
      const espResult = await this.executeMovementOnESP32(movement);
      
      if (espResult.success) {
        console.log(`✅ Evento "${event.nombreEvento}" ejecutado exitosamente`);
        await this.logEventExecution(event, true);
      } else {
        console.warn(`⚠️ Movimiento actualizado en BD, pero error en ESP32: ${espResult.message}`);
        await this.logEventExecution(event, false, `ESP32 error: ${espResult.message}`);
      }
    } catch (error) {
      console.error(`❌ Error ejecutando evento "${event.nombreEvento}":`, error);
      await this.logEventExecution(event, false, error.message);
    }
  }

  /**
   * Actualiza el movimiento en la base de datos del backend (paso 1 del patrón correcto)
   * @param {Object} movement - Datos del movimiento
   * @returns {Object} Resultado de la actualización
   */
  async updateMovementInBackend(movement) {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        return {
          success: false,
          message: 'No hay token de autenticación disponible'
        };
      }

      // Determinar la velocidad a usar
      const speed = movement.movimiento?.horas?.velocidad || 50;
      const payload = { velocidad: speed };

      // Usar el endpoint /movimiento-actual/{nombre} como en main.js
      const response = await fetch(`${BACKEND_URL}/movimiento-actual/${movement.nombre}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error actualizando movimiento en BD:", data);
        return {
          success: false,
          message: data.error || `HTTP ${response.status}: Error actualizando movimiento`
        };
      }

      console.log(`📦 Movimiento "${movement.nombre}" actualizado en BD exitosamente`);
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error de red actualizando movimiento en BD:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión al backend'
      };
    }
  }

  /**
   * Ejecuta un movimiento específico en el ESP32 (paso 2 del patrón correcto)
   * @param {Object} movement - Datos del movimiento
   * @returns {Object} Resultado de la ejecución
   */
  async executeMovementOnESP32(movement) {
    try {
      if (!this.espIp) {
        return {
          success: false,
          message: 'No hay IP del ESP32 configurada'
        };
      }

      // Detectar si es un preset o un movimiento personalizado
      const presets = ['left', 'right', 'crazy', 'normal', 'stop', 'swing'];
      const movementName = movement.nombre?.toLowerCase();
      
      if (presets.includes(movementName)) {
        // Es un preset
        const speed = movement.movimiento?.horas?.velocidad || 50;
        return await UnifiedClockService.sendPreset(this.espIp, movementName, speed);
      } else {
        // Es un movimiento personalizado
        const movimiento = movement.movimiento || {};
        const horas = movimiento.horas || {};
        const minutos = movimiento.minutos || {};
        
        const movementOptions = {
          ip: this.espIp,
          nombre: movement.nombre,
          dirHoras: horas.direccion || movimiento.direccionGeneral,
          dirMinutos: minutos.direccion || movimiento.direccionGeneral,
          velHoras: horas.velocidad !== undefined ? horas.velocidad : 50,
          velMinutos: minutos.velocidad !== undefined ? minutos.velocidad : 50
        };
        
        return await UnifiedClockService.sendMovement(movementOptions);
      }
    } catch (error) {
      console.error('Error ejecutando movimiento en ESP32:', error);
      return {
        success: false,
        message: error.message || 'Error inesperado comunicándose con el ESP32'
      };
    }
  }

  /**
   * Obtiene un movimiento por su ID
   * @param {string} movementId - ID del movimiento
   * @returns {Object|null} Datos del movimiento o null si no se encuentra
   */
  async getMovementById(movementId) {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error('No hay token de autenticación para obtener movimiento');
        return null;
      }

      // Usar el endpoint /movements que sí funciona y filtrar por ID
      const response = await fetch(`${BACKEND_URL}/movements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Error obteniendo movimientos:', response.status);
        return null;
      }

      const data = await response.json();
      
      if (!data.success || !Array.isArray(data.data)) {
        console.error('Formato de respuesta de movimientos inválido:', data);
        return null;
      }

      // Buscar el movimiento específico por ID
      const movement = data.data.find(mov => mov.id === movementId);
      
      if (!movement) {
        console.error(`Movimiento con ID ${movementId} no encontrado en ${data.data.length} movimientos disponibles`);
        console.log('Movimientos disponibles:', data.data.map(m => `${m.id}: "${m.nombre}"`));
        return null;
      }

      console.log(`✅ Movimiento encontrado: "${movement.nombre}" (ID: ${movementId})`);
      return movement;
      
    } catch (error) {
      console.error('Error de red obteniendo movimiento:', error);
      return null;
    }
  }

  /**
   * Registra la ejecución de un evento (opcional, para auditoría)
   * @param {Object} event - Evento ejecutado
   * @param {boolean} success - Si la ejecución fue exitosa
   * @param {string} errorMessage - Mensaje de error si la ejecución falló
   */
  async logEventExecution(event, success, errorMessage = null) {
    try {
      const logData = {
        eventId: event.id,
        nombreEvento: event.nombreEvento,
        fechaEjecucion: new Date().toISOString(),
        exitoso: success,
        mensajeError: errorMessage
      };

      // Aquí podrías enviar el log al backend si es necesario
      console.log('Ejecución de evento registrada:', logData);
      
      // Por ahora solo lo guardamos localmente
      const logs = await AsyncStorage.getItem('event_execution_logs') || '[]';
      const parsedLogs = JSON.parse(logs);
      parsedLogs.push(logData);
      
      // Mantener solo los últimos 100 logs
      if (parsedLogs.length > 100) {
        parsedLogs.splice(0, parsedLogs.length - 100);
      }
      
      await AsyncStorage.setItem('event_execution_logs', JSON.stringify(parsedLogs));
    } catch (error) {
      console.error('Error registrando ejecución de evento:', error);
    }
  }

  /**
   * Obtiene la clave del día actual (Lu, Ma, Mi, Ju, Vi, Sa, Do)
   * @param {Date} date - Fecha
   * @returns {string} Clave del día
   */
  getCurrentDayKey(date) {
    const days = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    return days[date.getDay()];
  }

  /**
   * Obtiene la hora actual en formato HH:MM
   * @param {Date} date - Fecha
   * @returns {string} Hora en formato HH:MM
   */
  getCurrentTimeString(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Convierte una hora en formato HH:MM a minutos desde medianoche
   * @param {string} timeString - Hora en formato HH:MM
   * @returns {number} Minutos desde medianoche
   */
  timeToMinutes(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Fuerza la recarga de eventos desde el servidor
   */
  async refreshEvents() {
    console.log('🔄 Forzando recarga manual de eventos...');
    await this.loadEvents();
  }

  /**
   * Notifica al scheduler que se ha creado/modificado un evento
   * para que recargue inmediatamente
   */
  async notifyEventChanged() {
    console.log('🔔 Notificación de cambio en eventos - Recargando...');
    await this.loadEvents();
  }

  /**
   * Obtiene el estado actual del programador
   * @returns {Object} Estado del programador
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      eventsCount: this.cachedEvents.length,
      espIp: this.espIp,
      nextCheck: this.intervalId ? new Date(Date.now() + SCHEDULER_INTERVAL) : null,
      lastEventsRefresh: this.lastEventsRefresh,
      nextEventsRefresh: this.eventsRefreshIntervalId ? new Date(Date.now() + EVENTS_REFRESH_INTERVAL) : null
    };
  }

  /**
   * Ejecuta un evento específico inmediatamente (para testing)
   * @param {string} eventId - ID del evento a ejecutar
   * @returns {Object} Resultado de la ejecución
   */
  async executeEventNow(eventId) {
    try {
      const event = this.cachedEvents.find(e => e.id === eventId);
      if (!event) {
        return { success: false, message: 'Evento no encontrado' };
      }

      console.log(`Ejecutando evento inmediatamente: ${event.nombreEvento}`);
      await this.executeEvent(event);
      
      return { success: true, message: `Evento "${event.nombreEvento}" ejecutado` };
    } catch (error) {
      console.error('Error ejecutando evento inmediatamente:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Obtiene todos los eventos activos cargados
   * @returns {Array} Lista de eventos activos
   */
  getAllEvents() {
    return [...this.cachedEvents]; // Retorna una copia para evitar modificaciones externas
  }

  /**
   * Obtiene los próximos eventos programados
   * @param {number} hours - Horas hacia adelante a buscar (default: 24)
   * @returns {Array} Lista de próximos eventos
   */
  getUpcomingEvents(hours = 24) {
    const now = new Date();
    const upcoming = [];
    
    for (let i = 0; i < hours * 60; i += 30) { // Verificar cada 30 minutos
      const checkTime = new Date(now.getTime() + (i * 60 * 1000));
      const checkTimeStr = this.getCurrentTimeString(checkTime);
      
      for (const event of this.cachedEvents) {
        // Temporalmente cambiar la fecha global para que shouldExecuteEvent use el tiempo correcto
        const originalDate = Date;
        const mockDate = (...args) => args.length ? new originalDate(...args) : checkTime;
        mockDate.prototype = originalDate.prototype;
        global.Date = mockDate;
        
        const shouldExecute = this.shouldExecuteEvent(event, checkTimeStr);
        
        // Restaurar la fecha original
        global.Date = originalDate;
        
        if (shouldExecute) {
          upcoming.push({
            event,
            scheduledTime: checkTime,
            timeUntil: i
          });
        }
      }
    }
    
    return upcoming.sort((a, b) => a.timeUntil - b.timeUntil);
  }
}

// Crear una instancia única del servicio
const eventScheduler = new EventSchedulerService();

export default eventScheduler;
