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
    const startTime = Date.now();
    
    const response = await fetch(`http://${ip}/`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const responseText = await response.text();
      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        responseText,
        deviceInfo: parseDeviceInfo(responseText),
      };
    } else {
      return {
        success: false,
        status: response.status,
        statusText: response.statusText,
        responseTime,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timeout: error.name === 'AbortError',
    };
  }
};

// Función para intentar identificar el tipo de dispositivo
const parseDeviceInfo = (responseText) => {
  if (!responseText) return { type: 'unknown', description: 'Dispositivo desconocido' };
  
  const text = responseText.toLowerCase();
  
  if (text.includes('esp32') || text.includes('clock') || text.includes('malbouche')) {
    return {
      type: 'esp32_clock',
      description: 'Reloj ESP32',
      isTarget: true
    };
  } else if (text.includes('esp32')) {
    return {
      type: 'esp32',
      description: 'ESP32',
      isTarget: false
    };
  } else if (text.includes('router') || text.includes('gateway')) {
    return {
      type: 'router',
      description: 'Router/Gateway',
      isTarget: false
    };
  } else if (text.includes('server') || text.includes('http')) {
    return {
      type: 'server',
      description: 'Servidor HTTP',
      isTarget: false
    };
  } else {
    return {
      type: 'unknown',
      description: 'Dispositivo HTTP',
      isTarget: false
    };
  }
};

// Función para escanear red local y encontrar ESP32
export const scanLocalNetwork = async (baseIP = '192.168.1') => {
  const promises = [];
  const results = [];
  
  // Generar rango más completo de IPs comunes
  const commonIPs = [];
  
  // IPs muy comunes (1-10)
  for (let i = 1; i <= 10; i++) {
    commonIPs.push(i);
  }
  
  // IPs comunes en routers/gateways (11-30)
  for (let i = 11; i <= 30; i++) {
    commonIPs.push(i);
  }
  
  // IPs medias con algunos saltos (31-100)
  for (let i = 31; i <= 100; i += 2) { // cada 2 números
    commonIPs.push(i);
  }
  
  // IPs altas con más cobertura (101-200)
  for (let i = 101; i <= 200; i += 3) { // cada 3 números
    commonIPs.push(i);
  }
  
  // IPs muy altas selectivas (201-254)
  const highIPs = [201, 210, 220, 230, 240, 250, 254];
  commonIPs.push(...highIPs);
  
  // Asegurar que tenemos algunas IPs específicas importantes
  const essentialIPs = [1, 2, 100, 101, 110, 150, 159, 200, 254];
  essentialIPs.forEach(ip => {
    if (!commonIPs.includes(ip)) {
      commonIPs.push(ip);
    }
  });
  
  // Ordenar para escanear de forma lógica
  commonIPs.sort((a, b) => a - b);
  
  for (const lastOctet of commonIPs) {
    const ip = `${baseIP}.${lastOctet}`;
    promises.push(
      pingESP32(ip, 3000).then(result => {
        if (result.success) {
          results.push({ 
            ip, 
            ...result,
            id: `${ip}-${Date.now()}` // ID único para React
          });
        }
      }).catch(() => {})
    );
  }
  
  await Promise.all(promises);
  
  // Ordenar resultados: ESP32 Clock primero, luego por tiempo de respuesta
  results.sort((a, b) => {
    if (a.deviceInfo?.isTarget && !b.deviceInfo?.isTarget) return -1;
    if (!a.deviceInfo?.isTarget && b.deviceInfo?.isTarget) return 1;
    return a.responseTime - b.responseTime;
  });
  
  return results;
};

// Función para escanear múltiples redes
export const scanMultipleNetworks = async (progressCallback, fastMode = false) => {
  const commonNetworks = ['192.168.1', '192.168.0', '10.0.0', '192.168.43'];
  const allResults = [];
  
  for (let i = 0; i < commonNetworks.length; i++) {
    const network = commonNetworks[i];
    if (progressCallback) {
      progressCallback({
        current: i + 1,
        total: commonNetworks.length,
        network: network,
        message: `Escaneando red ${network}.x...`
      });
    }
    
    // Usar escaneo rápido o completo según el modo
    const results = fastMode 
      ? await scanLocalNetworkFast(network)
      : await scanLocalNetwork(network);
    
    allResults.push(...results);
  }
  
  // Eliminar duplicados si los hay
  const uniqueResults = allResults.filter((result, index, self) => 
    index === self.findIndex(r => r.ip === result.ip)
  );
  
  return uniqueResults;
};

// Función específica para Android que intenta múltiples métodos de conexión
export const connectToESP32Android = async (ip, command, timeout = 8000) => {
  const methods = [
    // Método 1: Fetch normal
    () => fetch(`http://${ip}/${command}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Connection': 'close'
      }
    }),
    
    // Método 2: Con User-Agent específico
    () => fetch(`http://${ip}/${command}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'User-Agent': 'MalboucheApp/1.0',
        'Connection': 'close'
      }
    }),
    
    // Método 3: Con parámetros adicionales
    () => fetch(`http://${ip}/${command}?t=${Date.now()}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    })
  ];
  
  for (let i = 0; i < methods.length; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await methods[i]();
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const text = await response.text();
        return { success: true, data: text, method: i + 1 };
      }
    } catch (error) {
      console.log(`Método ${i + 1} falló:`, error.message);
      if (i === methods.length - 1) {
        throw error;
      }
    }
  }
  
  throw new Error('Todos los métodos de conexión fallaron');
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

// Función para escaneo rápido con menos IPs (versión optimizada)
export const scanLocalNetworkFast = async (baseIP = '192.168.1') => {
  const promises = [];
  const results = [];
  
  // Versión más rápida con menos IPs pero buena cobertura
  const quickIPs = [
    1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 35,
    40, 41, 42, 43, 44, 45, 50, 51, 52, 53, 54, 55, 60, 61, 62, 63, 64, 65, 70, 71, 72, 73, 74, 75,
    80, 81, 82, 83, 84, 85, 90, 91, 92, 93, 94, 95, 100, 101, 102, 103, 104, 105,
    110, 111, 112, 113, 114, 115, 120, 121, 122, 123, 124, 125, 130, 131, 132, 133, 134, 135,
    140, 141, 142, 143, 144, 145, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165,
    170, 171, 172, 173, 174, 175, 180, 181, 182, 183, 184, 185, 190, 191, 192, 193, 194, 195,
    200, 201, 202, 203, 204, 205, 210, 220, 230, 240, 250, 254
  ];
  
  for (const lastOctet of quickIPs) {
    const ip = `${baseIP}.${lastOctet}`;
    promises.push(
      pingESP32(ip, 2000).then(result => { // timeout más corto para velocidad
        if (result.success) {
          results.push({ 
            ip, 
            ...result,
            id: `${ip}-${Date.now()}`
          });
        }
      }).catch(() => {})
    );
  }
  
  await Promise.all(promises);
  
  // Ordenar resultados
  results.sort((a, b) => {
    if (a.deviceInfo?.isTarget && !b.deviceInfo?.isTarget) return -1;
    if (!a.deviceInfo?.isTarget && b.deviceInfo?.isTarget) return 1;
    return a.responseTime - b.responseTime;
  });
  
  return results;
};

// Función para obtener estadísticas del escaneo
export const getScanStatistics = (fastMode = false) => {
  const networks = ['192.168.1', '192.168.0', '10.0.0', '192.168.43'];
  
  if (fastMode) {
    const quickIPs = [
      1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 20, 21, 22, 23, 24, 25, 30, 31, 32, 33, 34, 35,
      40, 41, 42, 43, 44, 45, 50, 51, 52, 53, 54, 55, 60, 61, 62, 63, 64, 65, 70, 71, 72, 73, 74, 75,
      80, 81, 82, 83, 84, 85, 90, 91, 92, 93, 94, 95, 100, 101, 102, 103, 104, 105,
      110, 111, 112, 113, 114, 115, 120, 121, 122, 123, 124, 125, 130, 131, 132, 133, 134, 135,
      140, 141, 142, 143, 144, 145, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 160, 161, 162, 163, 164, 165,
      170, 171, 172, 173, 174, 175, 180, 181, 182, 183, 184, 185, 190, 191, 192, 193, 194, 195,
      200, 201, 202, 203, 204, 205, 210, 220, 230, 240, 250, 254
    ];
    
    return {
      mode: 'Rápido',
      networks: networks.length,
      ipsPerNetwork: quickIPs.length,
      totalIPs: networks.length * quickIPs.length,
      timeoutPerIP: '2 segundos',
      estimatedTime: `${Math.round((networks.length * quickIPs.length * 2) / 60)} minutos`
    };
  } else {
    // Calcular para modo completo
    let totalIPs = 0;
    
    // IPs muy comunes (1-10)
    totalIPs += 10;
    
    // IPs comunes en routers/gateways (11-30)
    totalIPs += 20;
    
    // IPs medias con algunos saltos (31-100)
    totalIPs += Math.floor((100 - 31) / 2) + 1;
    
    // IPs altas con más cobertura (101-200)
    totalIPs += Math.floor((200 - 101) / 3) + 1;
    
    // IPs muy altas selectivas (201-254)
    totalIPs += 7;
    
    // IPs esenciales adicionales
    totalIPs += 5; // aproximado
    
    return {
      mode: 'Completo',
      networks: networks.length,
      ipsPerNetwork: totalIPs,
      totalIPs: networks.length * totalIPs,
      timeoutPerIP: '3 segundos',
      estimatedTime: `${Math.round((networks.length * totalIPs * 3) / 60)} minutos`
    };
  }
};
