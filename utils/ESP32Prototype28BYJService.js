/**
 * ESP32Prototype28BYJService.js
 * Proporciona funciones de comunicación para interactuar con el prototipo ESP32 que usa motores 28BYJ-48 a través del backend.
 * Maneja el envío de comandos de movimiento, actualizaciones de velocidad y pruebas de conexión.
 */

import { Platform } from 'react-native';
import { checkNetworkStatus } from './networkHelper';
import apiClient from './apiClient';

// Modos de movimiento disponibles en el prototipo
export const PROTOTYPE_MODES = {
  LEFT: 'left',
  RIGHT: 'right',
  CRAZY: 'crazy',
  NORMAL: 'normal',
  STOP: 'stop',
  SWING: 'swing'
};

/**
 * Envía un comando de movimiento al dispositivo prototipo ESP32
 * @param {Object} options - Opciones de configuración del movimiento
 * @param {string} options.ip - La dirección IP del ESP32
 * @param {string} options.mode - El modo de movimiento (left, right, crazy, normal, stop, swing)
 * @param {number} [options.speed] - Velocidad del movimiento (1-100)
 * @param {number} [options.timeout=10000] - Tiempo máximo de espera en milisegundos
 * @returns {Promise<Object>} Objeto resultado con estado de éxito y mensaje
 */
export const sendPrototypeCommand = async (options) => {
  const { 
    ip, 
    mode, 
    speed,
    timeout = 10000 
  } = options;

  // Validar ID del dispositivo antes de continuar
  if (!ip) {
    return { success: false, message: 'No se ha configurado el ID del reloj' };
  }

  // Comprobar la conectividad de red primero
  try {
    const networkState = await checkNetworkStatus();
    if (!networkState.isConnected) {
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión' };
    }
  } catch (error) {
    return { success: false, message: 'Error verificando conexión de red', error };
  }

  // Validar que el modo sea compatible con el prototipo (si se proporciona)
  if (mode && mode !== 'speed' && !Object.values(PROTOTYPE_MODES).includes(mode.toLowerCase())) {
    return { 
      success: false, 
      message: `Modo no soportado por el prototipo: ${mode}. Modos disponibles: ${Object.values(PROTOTYPE_MODES).join(', ')}` 
    };
  }
  
  // Preparar datos para el backend
  const commandData = {
    deviceId: ip,  // Ahora ip es en realidad un ID de dispositivo para el backend
    deviceType: 'prototype',  // Indicar que es un prototipo con 28BYJ-48
    command: {
      mode: mode ? mode.toLowerCase() : undefined,
      speed: speed
    }
  };
  
  console.log('Enviando comando al prototipo a través del backend:', mode || 'speed', ip);

  try {
    // Usar apiClient para comunicarse con el backend
    const response = await apiClient.post('/clock/command', commandData, { 
      timeout: timeout 
    });
    
    if (response.data && response.data.success) {
      return {
        success: true,
        message: `Comando ${mode || 'speed'} enviado correctamente`,
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error enviando comando al reloj',
        error: response.data?.error
      };
    }
  } catch (error) {
    console.error('Error enviando comando al prototipo:', error);
    
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
 * Envía un comando de actualización de velocidad al dispositivo prototipo ESP32
 * @param {string} ip - La dirección IP del ESP32
 * @param {number} speed - Valor de velocidad (1-100)
 * @param {number} [timeout=10000] - Tiempo máximo de espera en milisegundos
 * @returns {Promise<Object>} Objeto resultado con estado de éxito y mensaje
 */
export const sendSpeedToPrototype = async (deviceId, speed, timeout = 10000) => {
  if (!deviceId) {
    return { success: false, message: 'No se ha configurado el ID del reloj' };
  }

  try {
    const networkState = await checkNetworkStatus();
    if (!networkState.isConnected) {
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión' };
    }
    
    // Validar que la velocidad esté dentro del rango permitido para este prototipo (1-100)
    const validatedSpeed = Math.min(Math.max(parseInt(speed) || 50, 1), 100);
    
    // Simplemente usar la función sendPrototypeCommand con el modo "speed"
    const result = await sendPrototypeCommand({
      ip: deviceId,
      mode: 'speed',
      speed: validatedSpeed,
      timeout
    });
    
    return {
      success: result.success,
      message: result.success 
        ? `Velocidad ${validatedSpeed} configurada correctamente` 
        : result.message || 'Error enviando velocidad al reloj'
    };
  
  } catch (error) {
    console.error('Error enviando velocidad al prototipo ESP32:', error);
    
    let errorMessage = 'Error enviando velocidad al reloj';
    
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
 * Prueba la conexión con el dispositivo prototipo ESP32
 * @param {string} ip - La dirección IP del ESP32
 * @param {number} [timeout=5000] - Tiempo máximo de espera en milisegundos
 * @returns {Promise<Object>} Objeto resultado con estado de éxito y mensaje
 */
export const testPrototypeConnection = async (deviceId, timeout = 5000) => {
  if (!deviceId) {
    return { success: false, message: 'No se ha configurado el ID del reloj' };
  }

  try {
    // Comprobar la conectividad de red primero
    const networkStatus = await checkNetworkStatus();
    if (!networkStatus.isConnected) {
      return { success: false, message: 'Sin conexión de red. Verifica tu conexión a internet.' };
    }

    console.log('Probando conexión con prototipo a través del backend:', deviceId);
    
    // Usar apiClient para verificar la conexión con el reloj mediante el backend
    const response = await apiClient.get(`/clock/status/${deviceId}?type=prototype`, {
      timeout: timeout
    });
    
    if (response.data && response.data.success) {
      return {
        success: true,
        message: 'Conexión exitosa con el reloj prototipo',
        data: response.data
      };
    } else {
      return {
        success: false,
        message: response.data?.message || 'Error de conexión con el reloj prototipo',
        error: response.data?.error
      };
    }
  } catch (error) {
    console.error('Error probando conexión con el prototipo:', error);
    
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
 * Aplica un movimiento predefinido al prototipo (normal, left, right, crazy, stop, swing)
 * @param {string} ip - La dirección IP del ESP32
 * @param {string} mode - El modo de movimiento
 * @param {number} [speed] - Velocidad opcional (1-100)
 * @param {number} [timeout=10000] - Tiempo máximo de espera en milisegundos
 * @returns {Promise<Object>} Objeto resultado con estado de éxito y mensaje
 */
export const sendModeToPrototype = async (deviceId, mode, speed, timeout = 10000) => {
  if (!deviceId) {
    return { success: false, message: 'No se ha configurado el ID del reloj' };
  }

  // Validar que el modo sea compatible con el prototipo
  if (!Object.values(PROTOTYPE_MODES).includes(mode.toLowerCase())) {
    return { 
      success: false, 
      message: `Modo no soportado por el prototipo: ${mode}. Modos disponibles: ${Object.values(PROTOTYPE_MODES).join(', ')}` 
    };
  }

  try {
    const networkState = await checkNetworkStatus();
    if (!networkState.isConnected) {
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión' };
    }
    
    // Primero, enviar el comando de modo
    const modeResult = await sendPrototypeCommand({
      ip: deviceId,  // Usar el ID del dispositivo en lugar de la IP
      mode: mode.toLowerCase(),
      timeout
    });
    
    // Si hay una velocidad especificada y el modo fue exitoso, actualizar la velocidad
    if (modeResult.success && speed !== undefined) {
      const speedResult = await sendSpeedToPrototype(deviceId, speed, timeout);
      
      if (!speedResult.success) {
        return {
          success: true,
          message: `Modo ${mode} activado, pero hubo un problema al ajustar la velocidad: ${speedResult.message}`,
          partialSuccess: true
        };
      }
    }
    
    return modeResult;
  } catch (error) {
    console.error(`Error enviando modo ${mode} al prototipo:`, error);
    
    let errorMessage = `Error enviando modo ${mode} al reloj`;
    
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
 * Adaptador para comunicación con reloj prototipo que usa la misma interfaz que ESP32Service
 * Esta función actúa como un puente entre la interfaz genérica y el prototipo
 */
export const sendMovementToPrototype = async (options) => {
  const { 
    ip, 
    nombre, 
    velocidad,
    timeout = 10000 
  } = options;

  if (!ip) {
    return { success: false, message: 'No se ha configurado el ID del reloj' };
  }

  try {
    // Mapear el nombre del movimiento a un modo del prototipo
    let mode;
    const lowerNombre = nombre?.toLowerCase() || '';
    
    // Mapeo de modos estándar
    if (lowerNombre === 'left' || lowerNombre === 'izquierda') {
      mode = PROTOTYPE_MODES.LEFT;
    } else if (lowerNombre === 'right' || lowerNombre === 'derecha') {
      mode = PROTOTYPE_MODES.RIGHT;
    } else if (lowerNombre === 'crazy' || lowerNombre === 'loco') {
      mode = PROTOTYPE_MODES.CRAZY;
    } else if (lowerNombre === 'normal') {
      mode = PROTOTYPE_MODES.NORMAL;
    } else if (lowerNombre === 'stop' || lowerNombre === 'parar') {
      mode = PROTOTYPE_MODES.STOP;
    } else if (lowerNombre === 'swing' || lowerNombre === 'pendulo') {
      mode = PROTOTYPE_MODES.SWING;
    } else {
      // Para movimientos personalizados, usar el modo "crazy" como base
      mode = PROTOTYPE_MODES.CRAZY;
      console.log(`Movimiento personalizado "${nombre}" mapeado a modo "${mode}" en el prototipo`);
    }
    
    // Enviar el modo y la velocidad al prototipo
    return await sendModeToPrototype(ip, mode, velocidad, timeout);
  } catch (error) {
    console.error('Error adaptando movimiento para el prototipo:', error);
    return {
      success: false,
      message: 'Error al enviar movimiento al reloj prototipo',
      error
    };
  }
};

export default {
  sendPrototypeCommand,
  sendSpeedToPrototype,
  testPrototypeConnection,
  sendModeToPrototype,
  sendMovementToPrototype,
  PROTOTYPE_MODES
};
