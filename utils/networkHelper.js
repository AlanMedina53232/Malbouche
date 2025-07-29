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
  if (!responseText) return { type: 'unknown', description: 'Dispositivo HTTP', isTarget: false };
  
  const text = responseText.toLowerCase();
  
  // Detectar ESP32 Clock específico de Malbouche
  if (text.includes('esp32') && (text.includes('clock') || text.includes('malbouche') || text.includes('reloj'))) {
    return {
      type: 'esp32_clock',
      description: 'Reloj ESP32 Malbouche',
      isTarget: true
    };
  }
  
  // Detectar otros ESP32
  if (text.includes('esp32') || text.includes('espressif')) {
    return {
      type: 'esp32',
      description: 'Dispositivo ESP32',
      isTarget: false
    };
  }
  
  // Detectar Arduino
  if (text.includes('arduino')) {
    return {
      type: 'arduino',
      description: 'Dispositivo Arduino',
      isTarget: false
    };
  }
  
  // Detectar routers y gateways
  if (text.includes('router') || text.includes('gateway') || text.includes('admin') || 
      text.includes('login') || text.includes('wireless') || text.includes('wi-fi') ||
      text.includes('tp-link') || text.includes('d-link') || text.includes('netgear') ||
      text.includes('linksys') || text.includes('asus') || text.includes('mikrotik')) {
    return {
      type: 'router',
      description: 'Router/Gateway',
      isTarget: false
    };
  }
  
  // Detectar cámaras IP
  if (text.includes('camera') || text.includes('webcam') || text.includes('hikvision') ||
      text.includes('dahua') || text.includes('axis') || text.includes('ipcam')) {
    return {
      type: 'camera',
      description: 'Cámara IP',
      isTarget: false
    };
  }
  
  // Detectar impresoras
  if (text.includes('printer') || text.includes('print') || text.includes('hp') ||
      text.includes('canon') || text.includes('epson') || text.includes('brother')) {
    return {
      type: 'printer',
      description: 'Impresora de red',
      isTarget: false
    };
  }
  
  // Detectar NAS y servidores de archivos
  if (text.includes('nas') || text.includes('synology') || text.includes('qnap') ||
      text.includes('file server') || text.includes('storage')) {
    return {
      type: 'nas',
      description: 'NAS/Servidor de archivos',
      isTarget: false
    };
  }
  
  // Detectar dispositivos móviles
  if (text.includes('android') || text.includes('iphone') || text.includes('mobile') ||
      text.includes('phone') || text.includes('tablet')) {
    return {
      type: 'mobile',
      description: 'Dispositivo móvil',
      isTarget: false
    };
  }
  
  // Detectar computadoras
  if (text.includes('windows') || text.includes('linux') || text.includes('ubuntu') ||
      text.includes('debian') || text.includes('centos') || text.includes('apache') ||
      text.includes('nginx') || text.includes('server')) {
    return {
      type: 'computer',
      description: 'Computadora/Servidor',
      isTarget: false
    };
  }
  
  // Detectar televisores inteligentes
  if (text.includes('smart tv') || text.includes('samsung') || text.includes('lg') ||
      text.includes('sony') || text.includes('android tv') || text.includes('webos')) {
    return {
      type: 'smart_tv',
      description: 'Televisor inteligente',
      isTarget: false
    };
  }
  
  // Detectar dispositivos IoT genéricos
  if (text.includes('iot') || text.includes('smart') || text.includes('home') ||
      text.includes('automation') || text.includes('sensor')) {
    return {
      type: 'iot',
      description: 'Dispositivo IoT',
      isTarget: false
    };
  }
  
  // Dispositivo HTTP genérico
  return {
    type: 'unknown',
    description: 'Dispositivo HTTP',
    isTarget: false
  };
};

// Función para escanear red local y encontrar ESP32 (escaneo profundo completo)
export const scanLocalNetwork = async (baseIP = '192.168.1', progressCallback = null) => {
  const promises = [];
  const results = [];
  
  // Escaneo completo: todas las IPs de 1 a 254
  const allIPs = [];
  for (let i = 1; i <= 254; i++) {
    allIPs.push(i);
  }
  
  // Dividir en lotes para no sobrecargar la red y poder mostrar progreso
  const batchSize = 50;
  const batches = [];
  for (let i = 0; i < allIPs.length; i += batchSize) {
    batches.push(allIPs.slice(i, i + batchSize));
  }
  
  let completedBatches = 0;
  
  for (const batch of batches) {
    const batchPromises = batch.map(lastOctet => {
      const ip = `${baseIP}.${lastOctet}`;
      return pingESP32(ip, 2500).then(result => {
        if (result.success) {
          results.push({ 
            ip, 
            ...result,
            id: `${ip}-${Date.now()}` // ID único para React
          });
        }
      }).catch(() => {});
    });
    
    await Promise.all(batchPromises);
    completedBatches++;
    
    // Reportar progreso si se proporciona callback
    if (progressCallback) {
      progressCallback({
        current: completedBatches,
        total: batches.length,
        percentage: Math.round((completedBatches / batches.length) * 100),
        message: `Escaneando ${baseIP}.x - Lote ${completedBatches}/${batches.length}`,
        foundDevices: results.length
      });
    }
  }
  
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
  const commonNetworks = ['192.168.1', '192.168.0', '10.0.0', '192.168.43', '172.16.0', '192.168.100'];
  const allResults = [];
  
  for (let i = 0; i < commonNetworks.length; i++) {
    const network = commonNetworks[i];
    
    // Crear callback de progreso específico para cada red
    const networkProgressCallback = fastMode ? null : (progress) => {
      if (progressCallback) {
        progressCallback({
          networkCurrent: i + 1,
          networkTotal: commonNetworks.length,
          network: network,
          batchCurrent: progress.current,
          batchTotal: progress.total,
          batchPercentage: progress.percentage,
          message: `Red ${i + 1}/${commonNetworks.length}: ${progress.message}`,
          foundDevices: allResults.length + progress.foundDevices,
          overallProgress: Math.round(((i + (progress.current / progress.total)) / commonNetworks.length) * 100)
        });
      }
    };
    
    // Usar escaneo rápido o completo según el modo
    const results = fastMode 
      ? await scanLocalNetworkFast(network)
      : await scanLocalNetwork(network, networkProgressCallback);
    
    allResults.push(...results);
    
    // Progreso entre redes para modo rápido
    if (fastMode && progressCallback) {
      progressCallback({
        networkCurrent: i + 1,
        networkTotal: commonNetworks.length,
        network: network,
        message: `Completada red ${network}.x`,
        foundDevices: allResults.length,
        overallProgress: Math.round(((i + 1) / commonNetworks.length) * 100)
      });
    }
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
  const networks = ['192.168.1', '192.168.0', '10.0.0', '192.168.43', '172.16.0', '192.168.100'];
  
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
      estimatedTime: `${Math.round((networks.length * quickIPs.length * 2) / 60)} minutos`,
      coverage: '~80% de IPs comunes'
    };
  } else {
    // Modo completo: escanea todas las IPs (1-254)
    const totalIPsPerNetwork = 254;
    
    return {
      mode: 'Profundo (Completo)',
      networks: networks.length,
      ipsPerNetwork: totalIPsPerNetwork,
      totalIPs: networks.length * totalIPsPerNetwork,
      timeoutPerIP: '2.5 segundos',
      estimatedTime: `${Math.round((networks.length * totalIPsPerNetwork * 2.5) / 60)} minutos`,
      coverage: '100% de IPs (1-254)',
      batchSize: 50,
      description: 'Escanea todas las direcciones IP posibles en cada red'
    };
  }
};

// Función para escaneo exhaustivo personalizable
export const scanNetworkExhaustive = async (baseIP = '192.168.1', options = {}) => {
  const {
    startIP = 1,
    endIP = 254,
    timeout = 2500,
    batchSize = 50,
    progressCallback = null,
    includeOfflineAttempts = false
  } = options;
  
  const promises = [];
  const results = [];
  const offlineAttempts = [];
  
  // Validar rango
  if (startIP < 1 || startIP > 254 || endIP < 1 || endIP > 254 || startIP > endIP) {
    throw new Error('Rango de IP inválido. Debe estar entre 1-254 y startIP <= endIP');
  }
  
  // Generar lista de IPs a escanear
  const ipsToScan = [];
  for (let i = startIP; i <= endIP; i++) {
    ipsToScan.push(i);
  }
  
  // Dividir en lotes
  const batches = [];
  for (let i = 0; i < ipsToScan.length; i += batchSize) {
    batches.push(ipsToScan.slice(i, i + batchSize));
  }
  
  let completedBatches = 0;
  
  for (const batch of batches) {
    const batchPromises = batch.map(lastOctet => {
      const ip = `${baseIP}.${lastOctet}`;
      return pingESP32(ip, timeout).then(result => {
        if (result.success) {
          results.push({ 
            ip, 
            ...result,
            id: `${ip}-${Date.now()}`
          });
        } else if (includeOfflineAttempts) {
          offlineAttempts.push({
            ip,
            error: result.error || 'No respuesta',
            timeout: result.timeout || false
          });
        }
      }).catch((error) => {
        if (includeOfflineAttempts) {
          offlineAttempts.push({
            ip,
            error: error.message,
            timeout: false
          });
        }
      });
    });
    
    await Promise.all(batchPromises);
    completedBatches++;
    
    // Reportar progreso
    if (progressCallback) {
      progressCallback({
        current: completedBatches,
        total: batches.length,
        percentage: Math.round((completedBatches / batches.length) * 100),
        message: `Escaneando ${baseIP}.${batch[0]}-${batch[batch.length - 1]}`,
        foundDevices: results.length,
        scannedIPs: completedBatches * batchSize,
        totalIPs: ipsToScan.length
      });
    }
  }
  
  // Ordenar resultados
  results.sort((a, b) => {
    if (a.deviceInfo?.isTarget && !b.deviceInfo?.isTarget) return -1;
    if (!a.deviceInfo?.isTarget && b.deviceInfo?.isTarget) return 1;
    return a.responseTime - b.responseTime;
  });
  
  return {
    devices: results,
    offlineAttempts: includeOfflineAttempts ? offlineAttempts : [],
    scanRange: `${baseIP}.${startIP}-${endIP}`,
    scannedCount: ipsToScan.length,
    foundCount: results.length,
    successRate: Math.round((results.length / ipsToScan.length) * 100)
  };
};
