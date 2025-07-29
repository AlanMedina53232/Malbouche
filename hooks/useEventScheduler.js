/**
 * useEventScheduler.js
 * Hook personalizado para manejar el programador de eventos
 */

import { useState, useEffect, useCallback } from 'react';
import eventScheduler from '../utils/EventSchedulerService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ESP_IP_KEY = 'esp_ip_address';

export const useEventScheduler = () => {
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const [schedulerStatus, setSchedulerStatus] = useState({
    isRunning: false,
    eventsCount: 0,
    espIp: null,
    nextCheck: null
  });

  /**
   * Inicia el programador de eventos
   */
  const startScheduler = useCallback(async () => {
    try {
      // Obtener la IP del ESP32 desde AsyncStorage
      const espIp = await AsyncStorage.getItem(ESP_IP_KEY);
      
      if (!espIp) {
        console.warn('No hay IP del ESP32 configurada para iniciar el programador');
        return { success: false, message: 'IP del ESP32 no configurada' };
      }

      await eventScheduler.start(espIp);
      setIsSchedulerRunning(true);
      updateStatus();
      
      return { success: true, message: 'Programador de eventos iniciado' };
    } catch (error) {
      console.error('Error iniciando programador de eventos:', error);
      return { success: false, message: error.message };
    }
  }, []);

  /**
   * Detiene el programador de eventos
   */
  const stopScheduler = useCallback(() => {
    try {
      eventScheduler.stop();
      setIsSchedulerRunning(false);
      updateStatus();
      
      return { success: true, message: 'Programador de eventos detenido' };
    } catch (error) {
      console.error('Error deteniendo programador de eventos:', error);
      return { success: false, message: error.message };
    }
  }, []);

  /**
   * Actualiza la IP del ESP32 en el programador
   */
  const updateESPIP = useCallback(async (newIp) => {
    try {
      eventScheduler.updateESPIP(newIp);
      
      // Si el programador está corriendo, reiniciarlo con la nueva IP
      if (isSchedulerRunning) {
        eventScheduler.stop();
        await eventScheduler.start(newIp);
      }
      
      updateStatus();
      
      return { success: true, message: 'IP del ESP32 actualizada' };
    } catch (error) {
      console.error('Error actualizando IP del ESP32:', error);
      return { success: false, message: error.message };
    }
  }, [isSchedulerRunning]);

  /**
   * Recarga los eventos desde el servidor
   */
  const refreshEvents = useCallback(async () => {
    try {
      await eventScheduler.refreshEvents();
      updateStatus();
      
      return { success: true, message: 'Eventos actualizados' };
    } catch (error) {
      console.error('Error recargando eventos:', error);
      return { success: false, message: error.message };
    }
  }, []);

  /**
   * Actualiza el estado del programador
   */
  const updateStatus = useCallback(() => {
    const status = eventScheduler.getStatus();
    setSchedulerStatus(status);
    setIsSchedulerRunning(status.isRunning);
  }, []);

  /**
   * Alternar el estado del programador (iniciar/detener)
   */
  const toggleScheduler = useCallback(async () => {
    if (isSchedulerRunning) {
      return stopScheduler();
    } else {
      return await startScheduler();
    }
  }, [isSchedulerRunning, startScheduler, stopScheduler]);

  /**
   * Ejecuta un evento específico inmediatamente (para testing)
   */
  const executeEventNow = useCallback(async (eventId) => {
    try {
      const result = await eventScheduler.executeEventNow(eventId);
      updateStatus();
      return result;
    } catch (error) {
      console.error('Error ejecutando evento inmediatamente:', error);
      return { success: false, message: error.message };
    }
  }, [updateStatus]);

  /**
   * Obtiene todos los eventos activos
   */
  const getAllEvents = useCallback(() => {
    try {
      return eventScheduler.getAllEvents();
    } catch (error) {
      console.error('Error obteniendo todos los eventos:', error);
      return [];
    }
  }, []);

  /**
   * Obtiene los próximos eventos programados
   */
  const getUpcomingEvents = useCallback((hours = 24) => {
    try {
      return eventScheduler.getUpcomingEvents(hours);
    } catch (error) {
      console.error('Error obteniendo próximos eventos:', error);
      return [];
    }
  }, []);

  /**
   * Fuerza verificación inmediata de eventos
   */
  const checkEventsNow = useCallback(async () => {
    try {
      await eventScheduler.checkAndExecuteEvents();
      updateStatus();
      return { success: true, message: 'Verificación de eventos completada' };
    } catch (error) {
      console.error('Error verificando eventos:', error);
      return { success: false, message: error.message };
    }
  }, [updateStatus]);

  /**
   * Notifica que se ha creado/modificado un evento para recarga inmediata
   */
  const notifyEventChanged = useCallback(async () => {
    try {
      await eventScheduler.notifyEventChanged();
      updateStatus();
      return { success: true, message: 'Eventos actualizados después del cambio' };
    } catch (error) {
      console.error('Error notificando cambio de evento:', error);
      return { success: false, message: error.message };
    }
  }, [updateStatus]);

  // Efecto para inicializar el estado al montar el componente
  useEffect(() => {
    updateStatus();
    
    // Actualizar el estado cada minuto
    const statusInterval = setInterval(updateStatus, 60000);
    
    return () => {
      clearInterval(statusInterval);
    };
  }, [updateStatus]);

  // Efecto para auto-iniciar el programador si hay IP configurada
  useEffect(() => {
    const autoStartScheduler = async () => {
      const espIp = await AsyncStorage.getItem(ESP_IP_KEY);
      if (espIp && !isSchedulerRunning) {
        console.log('Auto-iniciando programador de eventos...');
        await startScheduler();
      }
    };

    autoStartScheduler();
  }, []);

  return {
    // Estado
    isSchedulerRunning,
    schedulerStatus,
    
    // Acciones
    startScheduler,
    stopScheduler,
    toggleScheduler,
    updateESPIP,
    refreshEvents,
    updateStatus,
    
    // Funciones de debug/testing
    executeEventNow,
    getAllEvents,
    getUpcomingEvents,
    checkEventsNow,
    
    // Notificaciones
    notifyEventChanged
  };
};
