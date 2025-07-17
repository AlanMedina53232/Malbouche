import * as Network from 'expo-network';

// Función para verificar el estado de la red
export const checkNetworkStatus = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return {
      isConnected: networkState.isConnected,
      type: networkState.type,
      isInternetReachable: networkState.isInternetReachable,
    };
  } catch (error) {
    console.error('Error checking network status:', error);
    return {
      isConnected: false,
      type: 'unknown',
      isInternetReachable: false,
    };
  }
};

// Función para obtener la IP local (útil para debugging)
export const getLocalIP = async () => {
  try {
    const ip = await Network.getIpAddressAsync();
    return ip;
  } catch (error) {
    console.error('Error getting local IP:', error);
    return null;
  }
};

// Función para validar formato de IP
export const validateIPFormat = (ip) => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipRegex.test(ip);
};

// Función para detectar si estamos en una red local
export const isLocalNetwork = (ip) => {
  const localNetworks = [
    /^192\.168\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^127\./
  ];
  
  return localNetworks.some(network => network.test(ip));
};

// Función para ping básico al ESP32
export const pingESP32 = async (ip, timeout = 5000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(`http://${ip}/`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timeout: error.name === 'AbortError',
    };
  }
};

// Función para obtener información detallada de la red
export const getNetworkInfo = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    const localIP = await getLocalIP();
    
    return {
      networkState,
      localIP,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error getting network info:', error);
    return null;
  }
};
