/**
 * ESP32Prototype28BYJService.js
 * Proporciona funciones de comunicación para interactuar con el prototipo ESP32 que usa motores 28BYJ-48.
 * Maneja el envío de comandos de movimiento, actualizaciones de velocidad y pruebas de conexión.
 */

import { Platform } from 'react-native';
import { checkNetworkStatus, validateIPFormat, isLocalNetwork, connectToESP32Android } from './networkHelper';

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

  // Validar IP y verificar conexión antes de continuar
  if (!ip) {
    return { success: false, message: 'No se ha configurado la IP del reloj' };
  }

  if (!validateIPFormat(ip)) {
    return { success: false, message: 'Formato de IP inválido. Use formato: 192.168.1.100' };
  }

  // Comprobar la conectividad de red primero
  try {
    const networkState = await checkNetworkStatus();
    if (!networkState.isConnected) {
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión WiFi' };
    }
  } catch (error) {
    return { success: false, message: 'Error verificando conexión de red', error };
  }

  // Validar que el modo sea compatible con el prototipo
  if (mode && !Object.values(PROTOTYPE_MODES).includes(mode.toLowerCase())) {
    return { 
      success: false, 
      message: `Modo no soportado por el prototipo: ${mode}. Modos disponibles: ${Object.values(PROTOTYPE_MODES).join(', ')}` 
    };
  }

  // Construir el endpoint basado en el modo
  let endpoint = mode ? mode.toLowerCase() : '';
  
  // Si se especifica velocidad, construir una URL diferente
  if (mode === 'speed' || speed !== undefined) {
    endpoint = 'speed';
    if (speed !== undefined) {
      endpoint += `?value=${speed}`;
    }
  }

  // Construir la URL completa
  const url = `http://${ip}/${endpoint}`;
  
  console.log('Enviando comando al prototipo:', url);

  try {
    // Usar implementación específica para la plataforma
    if (Platform.OS === 'android') {
      // Para Android, usar la función connectToESP32Android
      const result = await connectToESP32Android(ip, endpoint, timeout);
      
      return {
        success: result.success,
        message: result.success 
          ? `Modo ${mode || 'speed'} activado correctamente` 
          : result.message || 'Error enviando comando al reloj'
      };
    } else {
      // Para iOS u otras plataformas, usar fetch con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const text = await response.text();
        return {
          success: true,
          message: `Comando ${mode || 'speed'} enviado correctamente`,
          response: text
        };
      } else {
        return {
          success: false,
          message: `Error ${response.status}: ${response.statusText}`,
          statusCode: response.status
        };
      }
    }
  } catch (error) {
    console.error('Error enviando comando al prototipo ESP32:', error);
    
    let errorMessage = 'Error de conexión con el reloj';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout - El reloj no responde. Verifica que esté conectado a la misma red WiFi.';
    } else if (error.message && error.message.includes('Network request failed')) {
      errorMessage = 'Error de red - No se pudo conectar al reloj. Verifica la IP y la conexión WiFi.';
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
export const sendSpeedToPrototype = async (ip, speed, timeout = 10000) => {
  if (!ip) {
    return { success: false, message: 'No se ha configurado la IP del reloj' };
  }

  try {
    const networkState = await checkNetworkStatus();
    if (!networkState.isConnected) {
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión WiFi' };
    }
    
    // Validar que la velocidad esté dentro del rango permitido para este prototipo (1-100)
    const validatedSpeed = Math.min(Math.max(parseInt(speed) || 50, 1), 100);
    
    // Enviar velocidad al prototipo
    return await sendPrototypeCommand({
      ip,
      mode: 'speed',
      speed: validatedSpeed,
      timeout
    });
  } catch (error) {
    console.error('Error enviando velocidad al prototipo ESP32:', error);
    return {
      success: false,
      message: 'Error enviando velocidad al reloj',
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
export const testPrototypeConnection = async (ip, timeout = 5000) => {
  if (!ip) {
    return { success: false, message: 'No se ha configurado la IP del reloj' };
  }

  if (!validateIPFormat(ip)) {
    return { success: false, message: 'Formato de IP inválido. Use formato: 192.168.1.100' };
  }

  if (!isLocalNetwork(ip)) {
    console.warn('Advertencia: La IP no parece ser de red local');
  }

  try {
    // Comprobar la conectividad de red primero
    const networkStatus = await checkNetworkStatus();
    if (!networkStatus.isConnected) {
      return { success: false, message: 'Sin conexión de red. Conecta a WiFi primero.' };
    }

    console.log('Probando conexión con prototipo ESP32:', ip);
    
    // Usar implementación específica para la plataforma
    if (Platform.OS === 'android') {
      const result = await connectToESP32Android(ip, '', timeout);
      console.log('Resultado conexión Android:', result);
      return result;
    } else {
      // Para iOS o desarrollo, usar fetch estándar con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const url = `http://${ip}/`;
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const text = await response.text();
        return {
          success: true,
          message: 'Conexión exitosa con el reloj prototipo',
          response: text
        };
      } else {
        return {
          success: false,
          message: `Error ${response.status}: ${response.statusText}`,
          statusCode: response.status
        };
      }
    }
  } catch (error) {
    console.error('Error probando conexión con prototipo ESP32:', error);
    
    let errorMessage = 'Error de conexión con el reloj';
    
    if (error.name === 'AbortError') {
      errorMessage = 'Timeout - El reloj no responde. Verifica la IP y que esté conectado a la misma red WiFi.';
    } else if (error.message && error.message.includes('Network request failed')) {
      errorMessage = 'Error de red - No se pudo conectar al reloj. Verifica la IP y la conexión WiFi.';
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
export const sendModeToPrototype = async (ip, mode, speed, timeout = 10000) => {
  if (!ip) {
    return { success: false, message: 'No se ha configurado la IP del reloj' };
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
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión WiFi' };
    }
    
    // Primero, enviar el comando de modo
    const modeResult = await sendPrototypeCommand({
      ip,
      mode: mode.toLowerCase(),
      timeout
    });
    
    // Si hay una velocidad especificada y el modo fue exitoso, actualizar la velocidad
    if (modeResult.success && speed !== undefined) {
      const speedResult = await sendSpeedToPrototype(ip, speed, timeout);
      
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
    return {
      success: false,
      message: `Error enviando modo ${mode} al reloj`,
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
    return { success: false, message: 'No se ha configurado la IP del reloj' };
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
