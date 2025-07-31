/**
 * useEventScheduler.js
 * Hook simplificado para obtener eventos y configurar ESP32
 * El programador corre 100% en el backend
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';
const ESP_IP_KEY = 'esp_ip_address';

export const useEventScheduler = () => {
  const [allEvents, setAllEvents] = useState([]); // Solo cache de eventos para mostrar

  /**
   * Realiza petición a la API del backend con autenticación
   */
  const apiRequest = useCallback(async (endpoint, options = {}) => {
    try {
      // Obtener token de autenticación
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
          ...options.headers
        },
        ...options
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Error en API ${endpoint}:`, error);
      throw error;
    }
  }, []);

  /**
   * Configura la IP del ESP32 en el backend (función principal)
   */
  const updateESPIP = useCallback(async (newIp, deviceType = 'standard') => {
    try {
      // Configurar ESP32 en el backend
      const result = await apiRequest('/scheduler/esp32/configure', {
        method: 'POST',
        body: JSON.stringify({ 
          ip: newIp, 
          type: deviceType 
        })
      });
      
      console.log(`✅ ESP32 configurado en backend: ${newIp} (${deviceType})`);
      return { success: true, message: result.message };
    } catch (error) {
      console.error('❌ Error configurando ESP32 en backend:', error);
      return { success: false, message: error.message };
    }
  }, [apiRequest]);

  /**
   * Carga eventos desde el backend (solo para mostrar en modal)
   */
  const loadAllEvents = useCallback(async () => {
    try {
      const response = await apiRequest('/events');
      const events = response.data || []; // Corregido: backend devuelve { success: true, data: eventos }
      setAllEvents(events);
      console.log(`📅 Eventos cargados: ${events.length}`);
      return events;
    } catch (error) {
      console.error('❌ Error cargando eventos:', error);
      setAllEvents([]);
      return [];
    }
  }, [apiRequest]);

  /**
   * Obtiene todos los eventos (síncrono para compatibilidad con renderizado)
   */
  const getAllEvents = useCallback(() => {
    return allEvents;
  }, [allEvents]);

  /**
   * Refresca la lista de eventos cuando hay cambios
   */
  const refreshEvents = useCallback(async () => {
    try {
      await loadAllEvents();
      return { success: true, message: 'Eventos actualizados' };
    } catch (error) {
      console.error('❌ Error refrescando eventos:', error);
      return { success: false, message: error.message };
    }
  }, [loadAllEvents]);

  // Auto-configuración ESP32 al iniciar (si hay IP guardada)
  useEffect(() => {
    const autoConfigureESP = async () => {
      try {
        const savedIp = await AsyncStorage.getItem(ESP_IP_KEY);
        if (savedIp) {
          console.log(`🔧 Auto-configurando ESP32 con IP guardada: ${savedIp}`);
          await updateESPIP(savedIp);
        }
      } catch (error) {
        console.error('❌ Error auto-configurando ESP32:', error);
      }
    };

    autoConfigureESP();
    loadAllEvents(); // Cargar eventos para el modal
  }, [updateESPIP, loadAllEvents]);

  // Recargar eventos cada 5 minutos para mantener modal actualizado
  useEffect(() => {
    const eventInterval = setInterval(loadAllEvents, 300000); // 5 minutos
    
    return () => {
      clearInterval(eventInterval);
    };
  }, [loadAllEvents]);

  return {
    // Solo las funciones esenciales
    updateESPIP,     // Configurar IP del ESP32
    getAllEvents,    // Obtener eventos para modal
    refreshEvents,   // Refrescar eventos manualmente
    allEvents        // Cache de eventos
  };
};
