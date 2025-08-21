/**
 * ESP32Service.js
 * Provides communication functions for interacting with the ESP32 device through the backend.
 * Handles sending movement commands, speed updates, and connection testing.
 */

import { Platform } from 'react-native';
import { checkNetworkStatus } from './networkHelper';
import apiClient from './apiClient';

/**
 * Sends a movement command to the ESP32 device through the backend
 * @param {Object} options - Movement configuration options
 * @param {string} options.ip - The ID or identifier of the device (used by backend)
 * @param {string} options.nombre - The name of the movement (left, right, crazy, normal, etc.)
 * @param {string} [options.dirHoras] - Direction for hours (horario/antihorario)
 * @param {string} [options.dirMinutos] - Direction for minutes (horario/antihorario)
 * @param {number} [options.velHoras] - Speed for hours (0-100)
 * @param {number} [options.velMinutos] - Speed for minutes (0-100)
 * @param {number} [options.velocidad] - General speed for both motors (0-100)
 * @param {number} [options.timeout=10000] - Timeout in milliseconds
 * @returns {Promise<Object>} Result object with success status and message
 */
export const sendMovementToESP32 = async (options) => {
  const { 
    ip, 
    nombre, 
    dirHoras, 
    dirMinutos, 
    velHoras, 
    velMinutos, 
    velocidad,
    timeout = 10000 
  } = options;

  // Validate device ID before proceeding
  if (!ip) {
    return { success: false, message: 'No se ha configurado el ID del reloj' };
  }

  // Check network connectivity first
  try {
    const networkState = await checkNetworkStatus();
    if (!networkState.isConnected) {
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión' };
    }
  } catch (error) {
    return { success: false, message: 'Error verificando conexión de red', error };
  }

  // Preparar datos para el backend
  const movementData = {
    deviceId: ip,  // Ahora ip es en realidad un ID de dispositivo para el backend
    movement: {
      name: nombre ? nombre.toLowerCase() : undefined,
      hourDirection: dirHoras,
      minuteDirection: dirMinutos,
      hourSpeed: velHoras,
      minuteSpeed: velMinutos,
      generalSpeed: velocidad
    }
  };
  
  console.log('Sending movement to backend for device:', ip);

  try {
    // Usar apiClient para comunicarse con el backend
    const response = await apiClient.post('/clock/movement', movementData, { 
      timeout: timeout 
    });

    if (response.data && response.data.success) {
      return {
        success: true,
        message: `Movimiento ${nombre} enviado correctamente`,
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error enviando movimiento al reloj',
        error: response.data?.error
      };
    }
  } catch (error) {
    console.error('Error enviando movimiento al reloj a través del backend:', error);
    
    let errorMessage = 'Error de conexión con el servidor';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Timeout - El servidor no responde. Inténtalo de nuevo más tarde.';
    } else if (error.response) {
      errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
      error
    };
  }
};

/**
 * Sends a speed update command to the ESP32 device
 * @param {string} ip - The IP address of the ESP32
 * @param {number} speed - Speed value (0-100)
 * @param {number} [timeout=10000] - Timeout in milliseconds
 * @returns {Promise<Object>} Result object with success status and message
 */
export const sendSpeedToESP32 = async (deviceId, speed, timeout = 10000) => {
  if (!deviceId) {
    return { success: false, message: 'No se ha configurado el ID del reloj' };
  }

  try {
    const networkState = await checkNetworkStatus();
    if (!networkState.isConnected) {
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión' };
    }
    
    // Call sendMovementToESP32 with just the speed parameter
    return await sendMovementToESP32({
      ip: deviceId,  // Aquí ip es realmente el ID del dispositivo para el backend
      nombre: 'speed',
      velocidad: speed,
      timeout
    });
  } catch (error) {
    console.error('Error enviando velocidad al reloj:', error);
    
    let errorMessage = 'Error enviando velocidad al reloj';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Timeout - El servidor no responde. Inténtalo de nuevo más tarde.';
    } else if (error.response) {
      errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
    }
    
    return {
      success: false,
      message: errorMessage,
      error
    };
  }
};

/**
 * Tests the connection to the ESP32 device
 * @param {string} ip - The IP address of the ESP32
 * @param {number} [timeout=5000] - Timeout in milliseconds
 * @returns {Promise<Object>} Result object with success status and message
 */
export const testESP32Connection = async (deviceId, timeout = 5000) => {
  if (!deviceId) {
    return { success: false, message: 'No se ha configurado el ID del reloj' };
  }

  try {
    // Check network connectivity first
    const networkStatus = await checkNetworkStatus();
    if (!networkStatus.isConnected) {
      return { success: false, message: 'Sin conexión de red. Verifica tu conexión a internet.' };
    }

    console.log('Probando conexión con el reloj a través del backend:', deviceId);
    
    // Usar apiClient para verificar la conexión con el reloj mediante el backend
    const response = await apiClient.get(`/clock/status/${deviceId}`, {
      timeout: timeout
    });
    
    if (response.data && response.data.success) {
      return {
        success: true,
        message: 'Conexión exitosa con el reloj',
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error de conexión con el reloj',
        error: response.data?.error
      };
    }
  } catch (error) {
    console.error('Error probando conexión con el reloj:', error);
    
    let errorMessage = 'Error de conexión con el servidor';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Timeout - El servidor no responde. Inténtalo de nuevo más tarde.';
    } else if (error.response) {
      errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      message: errorMessage,
      error
    };
  }
};

/**
 * Sends a preset command to the ESP32 device (normal, left, right, crazy, stop)
 * @param {string} ip - The IP address of the ESP32
 * @param {string} preset - The preset name (normal, left, right, crazy, stop)
 * @param {number} [speed] - Optional speed value (0-100)
 * @param {number} [timeout=10000] - Timeout in milliseconds
 * @returns {Promise<Object>} Result object with success status and message
 */
export const sendPresetToESP32 = async (deviceId, preset, speed, timeout = 10000) => {
  if (!deviceId) {
    return { success: false, message: 'No se ha configurado el ID del reloj' };
  }

  try {
    const networkState = await checkNetworkStatus();
    if (!networkState.isConnected) {
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión' };
    }
    
    const options = {
      ip: deviceId,  // Aquí ip es realmente el ID del dispositivo para el backend
      nombre: preset.toLowerCase(),
      timeout
    };
    
    // Add speed if provided
    if (speed !== undefined) {
      options.velocidad = speed;
    }
    
    return await sendMovementToESP32(options);
  } catch (error) {
    console.error(`Error enviando preset ${preset} al reloj:`, error);
    
    let errorMessage = `Error enviando modo ${preset} al reloj`;
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Timeout - El servidor no responde. Inténtalo de nuevo más tarde.';
    } else if (error.response) {
      errorMessage = `Error ${error.response.status}: ${error.response.statusText}`;
    }
    
    return {
      success: false,
      message: errorMessage,
      error
    };
  }
};

export default {
  sendMovementToESP32,
  sendSpeedToESP32,
  testESP32Connection,
  sendPresetToESP32
};
