import * as Network from 'expo-network';

// Función para verificar el estado de la red (simplificada, solo verifica conectividad)
export const checkNetworkStatus = async () => {
  try {
    const networkState = await Network.getNetworkStateAsync();
    return {
      isConnected: networkState.isConnected,
      isInternetReachable: networkState.isInternetReachable,
    };
  } catch (error) {
    console.error('Error checking network status:', error);
    return {
      isConnected: false,
      isInternetReachable: false,
    };
  }
};

// Esta versión simplificada del archivo ya no incluye funciones relacionadas
// con validación de IPs y escaneo de red, ya que ahora los comandos al reloj se enviarán 
// a través del backend.
