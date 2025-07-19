/**
 * UnifiedClockService.js
 * Servicio unificado para comunicación con relojes ESP32, detectando automáticamente
 * si se trata de un dispositivo con motores paso a paso o un prototipo con motores 28BYJ-48.
 */

import { Platform } from 'react-native';
import ESP32Service from './ESP32Service';
import ESP32Prototype28BYJService from './ESP32Prototype28BYJService';

// Tipos de dispositivo soportados
export const DEVICE_TYPES = {
  STEPPER: 'stepper',  // Dispositivo con motores paso a paso (versión normal)
  PROTOTYPE: 'prototype'  // Dispositivo con motores 28BYJ-48 (prototipo)
};

// Objeto para almacenar el tipo de dispositivo detectado por IP
const detectedDeviceTypes = {};

/**
 * Detecta el tipo de dispositivo basado en la respuesta de la página principal
 * @param {string} ip - La dirección IP del dispositivo
 * @param {Object} response - La respuesta obtenida al consultar la página principal
 * @returns {string} El tipo de dispositivo detectado (DEVICE_TYPES)
 */
function detectDeviceTypeFromResponse(ip, response) {
  const responseText = typeof response === 'string' ? response : 
                      (response?.response || response?.data || '');
  
  // Si la respuesta contiene "28BYJ-48", es el prototipo
  if (responseText.includes('28BYJ-48')) {
    console.log(`Dispositivo en ${ip} detectado como PROTOTIPO (28BYJ-48)`);
    return DEVICE_TYPES.PROTOTYPE;
  }
  
  // Si la respuesta contiene "ESP32" y no contiene "28BYJ-48", es el dispositivo normal
  if (responseText.includes('ESP32')) {
    console.log(`Dispositivo en ${ip} detectado como ESTÁNDAR (motores paso a paso)`);
    return DEVICE_TYPES.STEPPER;
  }
  
  // Por defecto, asumimos que es el dispositivo estándar
  console.log(`No se pudo determinar tipo de dispositivo en ${ip}, usando ESTÁNDAR por defecto`);
  return DEVICE_TYPES.STEPPER;
}

/**
 * Detecta el tipo de dispositivo conectado a una IP específica
 * @param {string} ip - La dirección IP del dispositivo
 * @returns {Promise<string>} Tipo de dispositivo (DEVICE_TYPES)
 */
export const detectDeviceType = async (ip) => {
  // Si ya hemos detectado este dispositivo antes, usar el tipo almacenado
  if (detectedDeviceTypes[ip]) {
    return detectedDeviceTypes[ip];
  }
  
  try {
    // Intentar conectar con el dispositivo para analizar su respuesta
    const result = await ESP32Service.testESP32Connection(ip);
    
    if (result.success) {
      // Detectar tipo basado en la respuesta
      const deviceType = detectDeviceTypeFromResponse(ip, result);
      // Almacenar el tipo para futuras consultas
      detectedDeviceTypes[ip] = deviceType;
      return deviceType;
    }
    
    // Si la conexión falla, intentar con el servicio del prototipo
    const protoResult = await ESP32Prototype28BYJService.testPrototypeConnection(ip);
    
    if (protoResult.success) {
      // Si la conexión con el prototipo tiene éxito, es un prototipo
      detectedDeviceTypes[ip] = DEVICE_TYPES.PROTOTYPE;
      return DEVICE_TYPES.PROTOTYPE;
    }
    
    // Si ambas conexiones fallan, asumir que es el dispositivo estándar
    detectedDeviceTypes[ip] = DEVICE_TYPES.STEPPER;
    return DEVICE_TYPES.STEPPER;
  } catch (error) {
    console.error('Error detectando tipo de dispositivo:', error);
    // Por defecto, asumir que es el dispositivo estándar
    return DEVICE_TYPES.STEPPER;
  }
};

/**
 * Fuerza el tipo de dispositivo para una IP específica
 * @param {string} ip - La dirección IP del dispositivo
 * @param {string} deviceType - El tipo de dispositivo (DEVICE_TYPES)
 */
export const setDeviceType = (ip, deviceType) => {
  if (!Object.values(DEVICE_TYPES).includes(deviceType)) {
    console.error(`Tipo de dispositivo no válido: ${deviceType}`);
    return;
  }
  
  detectedDeviceTypes[ip] = deviceType;
  console.log(`Tipo de dispositivo para ${ip} configurado manualmente como: ${deviceType}`);
};

/**
 * Obtiene el servicio adecuado para un dispositivo basado en su tipo
 * @param {string} deviceType - El tipo de dispositivo (DEVICE_TYPES)
 * @returns {Object} El servicio correspondiente al tipo de dispositivo
 */
function getServiceForDeviceType(deviceType) {
  return deviceType === DEVICE_TYPES.PROTOTYPE 
    ? ESP32Prototype28BYJService 
    : ESP32Service;
}

/**
 * Prueba la conexión con un dispositivo, detectando automáticamente su tipo
 * @param {string} ip - La dirección IP del dispositivo
 * @param {number} [timeout=5000] - Tiempo máximo de espera en milisegundos
 * @returns {Promise<Object>} Resultado de la prueba de conexión
 */
export const testConnection = async (ip, timeout = 5000) => {
  try {
    // Detectar tipo de dispositivo
    const deviceType = await detectDeviceType(ip);
    
    // Obtener el servicio adecuado
    const service = getServiceForDeviceType(deviceType);
    
    // Probar conexión con el servicio correspondiente
    return deviceType === DEVICE_TYPES.PROTOTYPE
      ? await service.testPrototypeConnection(ip, timeout)
      : await service.testESP32Connection(ip, timeout);
  } catch (error) {
    console.error('Error en prueba de conexión unificada:', error);
    return {
      success: false,
      message: 'Error al conectar con el dispositivo',
      error
    };
  }
};

/**
 * Envía un movimiento a un dispositivo, detectando automáticamente su tipo
 * @param {Object} options - Opciones del movimiento
 * @returns {Promise<Object>} Resultado de la operación
 */
export const sendMovement = async (options) => {
  const { ip } = options;
  
  if (!ip) {
    return { success: false, message: 'No se ha configurado la IP del reloj' };
  }
  
  try {
    // Detectar tipo de dispositivo
    const deviceType = await detectDeviceType(ip);
    
    // Obtener el servicio adecuado
    const service = getServiceForDeviceType(deviceType);
    
    // Enviar movimiento con el servicio correspondiente
    return deviceType === DEVICE_TYPES.PROTOTYPE
      ? await service.sendMovementToPrototype(options)
      : await service.sendMovementToESP32(options);
  } catch (error) {
    console.error('Error en envío de movimiento unificado:', error);
    return {
      success: false,
      message: 'Error al enviar movimiento al dispositivo',
      error
    };
  }
};

/**
 * Envía un movimiento preestablecido a un dispositivo
 * @param {string} ip - La dirección IP del dispositivo
 * @param {string} preset - El movimiento preestablecido
 * @param {number} [speed] - Velocidad opcional
 * @param {number} [timeout=10000] - Tiempo máximo de espera en milisegundos
 * @returns {Promise<Object>} Resultado de la operación
 */
export const sendPreset = async (ip, preset, speed, timeout = 10000) => {
  if (!ip) {
    return { success: false, message: 'No se ha configurado la IP del reloj' };
  }
  
  try {
    // Detectar tipo de dispositivo
    const deviceType = await detectDeviceType(ip);
    
    // Obtener el servicio adecuado
    const service = getServiceForDeviceType(deviceType);
    
    // Enviar preset con el servicio correspondiente
    return deviceType === DEVICE_TYPES.PROTOTYPE
      ? await service.sendModeToPrototype(ip, preset, speed, timeout)
      : await service.sendPresetToESP32(ip, preset, speed, timeout);
  } catch (error) {
    console.error('Error en envío de preset unificado:', error);
    return {
      success: false,
      message: `Error al enviar modo ${preset} al dispositivo`,
      error
    };
  }
};

/**
 * Envía una actualización de velocidad a un dispositivo
 * @param {string} ip - La dirección IP del dispositivo
 * @param {number} speed - Valor de velocidad
 * @param {number} [timeout=10000] - Tiempo máximo de espera en milisegundos
 * @returns {Promise<Object>} Resultado de la operación
 */
export const sendSpeed = async (ip, speed, timeout = 10000) => {
  if (!ip) {
    return { success: false, message: 'No se ha configurado la IP del reloj' };
  }
  
  try {
    // Detectar tipo de dispositivo
    const deviceType = await detectDeviceType(ip);
    
    // Obtener el servicio adecuado
    const service = getServiceForDeviceType(deviceType);
    
    // Enviar velocidad con el servicio correspondiente
    return deviceType === DEVICE_TYPES.PROTOTYPE
      ? await service.sendSpeedToPrototype(ip, speed, timeout)
      : await service.sendSpeedToESP32(ip, speed, timeout);
  } catch (error) {
    console.error('Error en envío de velocidad unificado:', error);
    return {
      success: false,
      message: 'Error al ajustar la velocidad del dispositivo',
      error
    };
  }
};

// Exportar el servicio unificado
export default {
  testConnection,
  sendMovement,
  sendPreset,
  sendSpeed,
  detectDeviceType,
  setDeviceType,
  DEVICE_TYPES
};
