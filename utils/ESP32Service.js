/**
 * ESP32Service.js
 * Provides communication functions for interacting with the ESP32 device.
 * Handles sending movement commands, speed updates, and connection testing.
 */

import { Platform } from 'react-native';
import { checkNetworkStatus, connectToESP32Android, validateIPFormat, isLocalNetwork } from './networkHelper';

/**
 * Sends a movement command to the ESP32 device
 * @param {Object} options - Movement configuration options
 * @param {string} options.ip - The IP address of the ESP32
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

  // Validate IP and check connection before proceeding
  if (!ip) {
    return { success: false, message: 'No se ha configurado la IP del reloj' };
  }

  if (!validateIPFormat(ip)) {
    return { success: false, message: 'Formato de IP inválido. Use formato: 192.168.1.100' };
  }

  // Check network connectivity first
  try {
    const networkState = await checkNetworkStatus();
    if (!networkState.isConnected) {
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión WiFi' };
    }
  } catch (error) {
    return { success: false, message: 'Error verificando conexión de red', error };
  }

  // Construct the URL with parameters for the ESP32
  let endpoint = 'update-movement';
  let params = new URLSearchParams();
  
  // Add movement name
  if (nombre) params.append('nombre', nombre.toLowerCase());
  
  // Add direction parameters if provided
  if (dirHoras) params.append('dirHoras', dirHoras);
  if (dirMinutos) params.append('dirMinutos', dirMinutos);
  
  // Add speed parameters if provided
  if (velHoras !== undefined) params.append('velHoras', velHoras);
  if (velMinutos !== undefined) params.append('velMinutos', velMinutos);
  
  // Add general speed if provided
  if (velocidad !== undefined) params.append('velocidad', velocidad);
  
  // Construct the full URL
  const queryString = params.toString();
  const url = `http://${ip}/${endpoint}${queryString ? '?' + queryString : ''}`;
  
  console.log('Sending movement to ESP32:', url);

  try {
    // Use platform-specific implementation
    if (Platform.OS === 'android') {
      // For Android, use the connectToESP32Android function
      const result = await connectToESP32Android(ip, `${endpoint}?${queryString}`, timeout);
      
      return {
        success: result.success,
        message: result.success 
          ? `Movimiento ${nombre} enviado correctamente` 
          : result.message || 'Error enviando movimiento al reloj'
      };
    } else {
      // For iOS or other platforms, use fetch with timeout
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
          message: `Movimiento ${nombre} enviado correctamente`,
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
    console.error('Error enviando movimiento al ESP32:', error);
    
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
 * Sends a speed update command to the ESP32 device
 * @param {string} ip - The IP address of the ESP32
 * @param {number} speed - Speed value (0-100)
 * @param {number} [timeout=10000] - Timeout in milliseconds
 * @returns {Promise<Object>} Result object with success status and message
 */
export const sendSpeedToESP32 = async (ip, speed, timeout = 10000) => {
  if (!ip) {
    return { success: false, message: 'No se ha configurado la IP del reloj' };
  }

  try {
    const networkState = await checkNetworkStatus();
    if (!networkState.isConnected) {
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión WiFi' };
    }
    
    // Call sendMovementToESP32 with just the speed parameter
    return await sendMovementToESP32({
      ip,
      nombre: 'speed',
      velocidad: speed,
      timeout
    });
  } catch (error) {
    console.error('Error enviando velocidad al ESP32:', error);
    return {
      success: false,
      message: 'Error enviando velocidad al reloj',
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
export const testESP32Connection = async (ip, timeout = 5000) => {
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
    // Check network connectivity first
    const networkStatus = await checkNetworkStatus();
    if (!networkStatus.isConnected) {
      return { success: false, message: 'Sin conexión de red. Conecta a WiFi primero.' };
    }

    console.log('Probando conexión con ESP32:', ip);
    
    // Use platform-specific implementation
    if (Platform.OS === 'android') {
      const result = await connectToESP32Android(ip, '', timeout);
      console.log('Resultado conexión Android:', result);
      return result;
    } else {
      // For iOS or development, use standard fetch with timeout
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
          message: 'Conexión exitosa con el reloj',
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
    console.error('Error probando conexión ESP32:', error);
    
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
 * Sends a preset command to the ESP32 device (normal, left, right, crazy, stop)
 * @param {string} ip - The IP address of the ESP32
 * @param {string} preset - The preset name (normal, left, right, crazy, stop)
 * @param {number} [speed] - Optional speed value (0-100)
 * @param {number} [timeout=10000] - Timeout in milliseconds
 * @returns {Promise<Object>} Result object with success status and message
 */
export const sendPresetToESP32 = async (ip, preset, speed, timeout = 10000) => {
  if (!ip) {
    return { success: false, message: 'No se ha configurado la IP del reloj' };
  }

  try {
    const networkState = await checkNetworkStatus();
    if (!networkState.isConnected) {
      return { success: false, message: 'Sin conexión a internet. Verifica tu conexión WiFi' };
    }
    
    const options = {
      ip,
      nombre: preset.toLowerCase(),
      timeout
    };
    
    // Add speed if provided
    if (speed !== undefined) {
      options.velocidad = speed;
    }
    
    return await sendMovementToESP32(options);
  } catch (error) {
    console.error(`Error enviando preset ${preset} al ESP32:`, error);
    return {
      success: false,
      message: `Error enviando modo ${preset} al reloj`,
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
