import React, { useState, useCallback, useEffect } from "react";
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { Platform } from 'react-native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  TextInput
} from "react-native";
import Slider from "@react-native-community/slider";
import NavigationBar from "../../components/NavigationBar";
import AnalogClock from "../../components/analogClock";
import { Ionicons } from '@expo/vector-icons';
import FrameImage from '../../assets/marcoReloj.png';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  checkNetworkStatus, 
  validateIPFormat, 
  pingESP32, 
  connectToESP32Android, 
  scanLocalNetwork,
  scanLocalNetworkFast,
  scanMultipleNetworks,
  getScanStatistics,
  isLocalNetwork
} from '../../utils/networkHelper';





const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';
// Dirección IP del ESP, se carga desde AsyncStorage
const ESP_IP_KEY = 'esp_ip_address';
let ESP_IP = "";

const MainRest = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState("Normal");
  const [speed, setSpeed] = useState(50);
  const [loading, setLoading] = useState(false);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customMovements, setCustomMovements] = useState([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  // Estado para el modal de configuración de IP
  const [ipModalVisible, setIpModalVisible] = useState(false);
  const [espIp, setEspIp] = useState("");
  const [ipInput, setIpInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevices, setScannedDevices] = useState([]);
  const [scanProgress, setScanProgress] = useState(null);
  const [deviceSelectionVisible, setDeviceSelectionVisible] = useState(false);
  const [fastScanMode, setFastScanMode] = useState(false);
  
const [alertMessage, setAlertMessage] = useState('');
const [alertType, setAlertType] = useState(''); // 'error', 'success', etc.

  // Función para escanear red local
  const scanForESP32 = async (fastMode = false) => {
    setIsScanning(true);
    setScannedDevices([]);
    setScanProgress(null);
    setAlertMessage(`Iniciando escaneo ${fastMode ? 'rápido' : 'completo'}...`);
    setAlertType('info');
    
    try {
      // Verificar conectividad
      const networkStatus = await checkNetworkStatus();
      if (!networkStatus.isConnected) {
        setAlertMessage('Sin conexión WiFi. Conecta a una red primero.');
        setAlertType('error');
        setTimeout(() => setAlertMessage(''), 4000);
        return;
      }

      // Escanear múltiples redes con callback de progreso
      const devices = await scanMultipleNetworks((progress) => {
        setScanProgress(progress);
        setAlertMessage(`${progress.message} ${fastMode ? '(Modo rápido)' : '(Modo completo)'}`);
      }, fastMode);
      
      setScannedDevices(devices);
      
      if (devices.length > 0) {
        setAlertMessage(`Encontrados ${devices.length} dispositivos. Selecciona el tuyo.`);
        setAlertType('success');
        setDeviceSelectionVisible(true);
      } else {
        setAlertMessage('No se encontraron dispositivos. Ingresa la IP manualmente.');
        setAlertType('warning');
      }
      
      setTimeout(() => setAlertMessage(''), 6000);
    } catch (error) {
      console.error('Error escaneando red:', error);
      setAlertMessage('Error escaneando red. Intenta ingresar la IP manualmente.');
      setAlertType('error');
      setTimeout(() => setAlertMessage(''), 4000);
    } finally {
      setIsScanning(false);
      setScanProgress(null);
    }
  };

  // Función para seleccionar un dispositivo de la lista
  const selectDevice = (device) => {
    setIpInput(device.ip);
    setDeviceSelectionVisible(false);
    setAlertMessage(`Dispositivo seleccionado: ${device.ip}`);
    setAlertType('success');
    setTimeout(() => setAlertMessage(''), 3000);
  };

  // Cargar la IP guardada al iniciar y pedir permisos de ubicación
  useEffect(() => {
    const loadEspIpAndRequestLocation = async () => {
      try {
        // Verificar conectividad de red
        const networkState = await Network.getNetworkStateAsync();
        if (!networkState.isConnected) {
          Alert.alert('Sin conexión', 'Por favor, conecta tu dispositivo a WiFi para comunicarse con el reloj.');
          return;
        }

        // Solicitar permisos de ubicación en tiempo de ejecución
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permiso requerido', 'Se requiere el permiso de ubicación para comunicarse con el reloj por WiFi.');
        }
        
        const savedIp = await AsyncStorage.getItem(ESP_IP_KEY);
        if (savedIp) {
          setEspIp(savedIp);
          // Probar conexión con la IP guardada
          await testEspConnection(savedIp);
        } else {
          // Si no hay IP guardada, mostrar el modal
          setIpModalVisible(true);
        }
      } catch (e) {
        console.error("Error loading ESP IP o solicitando permisos:", e);
      }
    };
    loadEspIpAndRequestLocation();
  }, []);

  // Función para probar la conexión con el ESP32
  const testEspConnection = async (ip) => {
    try {
      if (!validateIPFormat(ip)) {
        setAlertMessage('Formato de IP inválido. Use formato: 192.168.1.100');
        setAlertType('error');
        setTimeout(() => setAlertMessage(''), 4000);
        return false;
      }

      if (!isLocalNetwork(ip)) {
        setAlertMessage('Advertencia: La IP no parece ser de red local');
        setAlertType('warning');
        setTimeout(() => setAlertMessage(''), 4000);
      }

      // Verificar conectividad de red primero
      const networkStatus = await checkNetworkStatus();
      if (!networkStatus.isConnected) {
        setAlertMessage('Sin conexión de red. Conecta a WiFi primero.');
        setAlertType('error');
        setTimeout(() => setAlertMessage(''), 4000);
        return false;
      }

      console.log('Probando conexión con ESP32:', ip);
      
      // Usar la función específica para Android
      if (Platform.OS === 'android') {
        const result = await connectToESP32Android(ip, '', 8000);
        console.log('Resultado conexión Android:', result);
        return result.success;
      } else {
        // Para iOS o desarrollo, usar ping normal
        const result = await pingESP32(ip, 5000);
        console.log('Resultado ping:', result);
        return result.success;
      }
    } catch (error) {
      console.error('Error probando conexión ESP32:', error);
      
      if (error.name === 'AbortError') {
        setAlertMessage('Timeout - El reloj no responde. Verifica la IP y que esté conectado a la misma red WiFi.');
        setAlertType('error');
        setTimeout(() => setAlertMessage(''), 6000);
      } else {
        setAlertMessage(`Error de conexión: ${error.message}`);
        setAlertType('error');
        setTimeout(() => setAlertMessage(''), 6000);
      }
      return false;
    }
  };

  // Actualizar la variable global ESP_IP cuando cambie espIp
  useEffect(() => {
    ESP_IP = espIp;
  }, [espIp]);

  const currentUser = {
    id: 1,
    name: 'Almendro Isaac Medina Ramírez',
    email: 'AlmIsaMedRam@gmail.com'
  };

  const options = [
    ["Left", "Right"],
    ["Crazy", "Swing"],
    ["Custom","Normal"]
  ];

  // Preset names to exclude from custom movements
  const PRESET_NAMES = ["left", "right", "crazy", "swing", "normal"];

  // Get authentication token from AsyncStorage
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
                  setAlertMessage("Authentication error please log in again.");
        setAlertType("error");
        setTimeout(() => setAlertMessage(''), 4000);
        navigation.replace('Login');
        return null;
      }
      return token;
    } catch (error) {
      console.error("Error getting auth token:", error);
      setAlertMessage("Error, failed to get authentication token.");
      setAlertType("error");
      setTimeout(() => setAlertMessage(''), 4000);
      return null;
    }
  };

  // Fetch custom movements from backend
  const fetchCustomMovements = async () => {
    setLoadingMovements(true);
    setCustomMovements([]); // Limpiar la lista antes de cargar nuevos datos
    
    try {
      console.log("Fetching custom movements...");
      const token = await getAuthToken();
      if (!token) {
        console.log("No authentication token available");
        setLoadingMovements(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/movements`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to fetch movements:", data);
        setAlertMessage(data.error || "Failed to load custom movements.");
        setAlertType("error"); // puedes personalizar si deseas otro tipo
        setTimeout(() => setAlertMessage(''), 4000);
        setLoadingMovements(false);
        return;
      }

      if (data.success && Array.isArray(data.data)) {
        // Filter out preset movements
        const filteredMovements = data.data.filter(movement => 
          !PRESET_NAMES.includes(movement.nombre?.toLowerCase())
        );
        console.log("Custom movements loaded:", filteredMovements.length);
        if (filteredMovements.length === 0) {
          console.log("No custom movements after filtering");
        }
        setCustomMovements(filteredMovements);
      } else {
        console.error("Invalid movements data format:", data);
        setAlertMessage("Invalid data format from movements API.");
        setAlertType("error");
        setTimeout(() => setAlertMessage(''), 4000);
      }
    } catch (error) {
      console.error("Network error fetching movements:", error);
      setAlertMessage("Network error failed to connect to server. Please check your internet connection.");
      setAlertType("error");
      setTimeout(() => setAlertMessage(''), 4000);
    } finally {
      setLoadingMovements(false);
    }
  };

  // Handle preset button press: POST /api/movimiento-actual/:preset with optional speed
  const handlePresetSelect = async (preset) => {
    // If Custom is selected, show modal instead of making API call
    if (preset === "Custom") {
      setCustomModalVisible(true);
      fetchCustomMovements();
      return;
    }

    setLoading(true);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const payload = { velocidad: speed };
      
      const response = await fetch(`${BACKEND_URL}/movimiento-actual/${preset.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Preset update error:", data);
        if (response.status === 404) {
          setAlertMessage(`Movement preset '${preset}' not found.`);
          setAlertType("error");
          setTimeout(() => setAlertMessage(''), 4000);
        } else if (response.status === 401) {
          setAlertMessage("Authentication error please log in again.");
          setAlertType("error");
          setTimeout(() => setAlertMessage(''), 4000);
          navigation.replace('Login');
        } else {
          setAlertMessage("Error", data.error || "Failed to update movement preset.");
          setAlertType("error");
          setTimeout(() => setAlertMessage(''), 4000);
        }
        setLoading(false);
        return;
      }

      // Update local state with returned data
      if (data.success && data.data) {
        setSelectedOption(preset);
        if (data.data.movimiento?.horas?.velocidad) {
          setSpeed(data.data.movimiento.horas.velocidad);
        }
        console.log("Preset updated successfully:", preset);
      } else {
        setSelectedOption(preset);
        console.log("Preset updated (no data returned):", preset);
      }

    } catch (error) {
      console.error("Network error updating preset:", error);
      setAlertMessage("Network error failed to connect to server. Please check your internet connection.");
      setAlertType("error");
      setTimeout(() => setAlertMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Handle custom movement selection
  const handleCustomMovementSelect = async (movement) => {
    setLoading(true);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const payload = { velocidad: speed };
      
      const response = await fetch(`${BACKEND_URL}/movimiento-actual/${movement.nombre}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Custom movement update error:", data);
        if (response.status === 404) {
          setAlertMessage(`Movement '${movement.nombre}' not found.`);
          setAlertType("error");
          setTimeout(() => setAlertMessage(''), 4000);
        } else if (response.status === 401) {
          setAlertMessage("Authentication error please log in again.");
          setAlertType("error");
          setTimeout(() => setAlertMessage(''), 4000);
          navigation.replace('Login');
        } else {
          setAlertMessage(data.error || "Failed to update movement.");
          setAlertType("error");
          setTimeout(() => setAlertMessage(''), 4000);
        }
        setLoading(false);
        return;
      }

      // Update local state with returned data
      if (data.success && data.data) {
        setSelectedOption("Custom");
        if (data.data.movimiento?.horas?.velocidad) {
          setSpeed(data.data.movimiento.horas.velocidad);
        }
        console.log("Custom movement updated successfully:", movement.nombre);
      } else {
        setSelectedOption("Custom");
        console.log("Custom movement updated (no data returned):", movement.nombre);
      }

      // Close modal
      setCustomModalVisible(false);

    } catch (error) {
      console.error("Network error updating custom movement:", error);
     setAlertMessage("Network error failed to connect to server. Please check your internet connection.");
      setAlertType("error");
      setTimeout(() => setAlertMessage(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  // Handle speed change: PATCH /api/movimiento-actual/velocidad
  const sendSpeedUpdate = async (newSpeed) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return;
      }

      const response = await fetch(`${BACKEND_URL}/movimiento-actual/velocidad`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ velocidad: newSpeed }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Speed update error:", data);
        if (response.status === 404) {
          // Gracefully handle 404 - movement document might not exist yet
          console.log("Movement document not found, speed update skipped");
        } else if (response.status === 401) {
          setAlertMessage("Authentication error please log in again.");
          setAlertType("error");
          setTimeout(() => setAlertMessage(''), 4000);
          navigation.replace('Login');
        } else {
          setAlertMessage("Error", data.error || "Failed to update speed.");
          setAlertType("error");
          setTimeout(() => setAlertMessage(''), 4000);
        }
        return;
      }

      // Update local state with returned data
      if (data.success && data.data?.movimiento?.horas?.velocidad) {
        setSpeed(data.data.movimiento.horas.velocidad);
      }
      console.log("Speed updated successfully:", newSpeed);

    } catch (error) {
      console.error("Network error updating speed:", error);
      setAlertMessage("Network error failed to update speed. Please check your internet connection.");
      setAlertType("error");
      setTimeout(() => setAlertMessage(''), 4000);
    }
  };

  // Debounce speed update to avoid excessive requests
  const debouncedSpeedUpdate = useCallback(
    debounce((newSpeed) => {
      sendSpeedUpdate(newSpeed);
    }, 500),
    []
  );

  // Handle slider change complete event
  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    debouncedSpeedUpdate(newSpeed);
  };

  const sendCommand = async (command) => {
    if (!espIp) {
      setAlertMessage('No se ha configurado la IP del reloj. Configúrala primero.');
      setAlertType('error');
      setTimeout(() => setAlertMessage(''), 4000);
      return;
    }

    try {
      // Verificar conectividad antes de enviar comando
      const networkState = await checkNetworkStatus();
      if (!networkState.isConnected) {
        setAlertMessage('Sin conexión a internet. Verifica tu conexión WiFi.');
        setAlertType('error');
        setTimeout(() => setAlertMessage(''), 4000);
        return;
      }

      console.log('Enviando comando:', command, 'a IP:', espIp);
      
      // Usar función específica para Android
      if (Platform.OS === 'android') {
        const result = await connectToESP32Android(espIp, command, 10000);
        
        if (result.success) {
          setAlertMessage(`Comando enviado exitosamente: ${result.data}`);
          setAlertType('success');
          console.log(`Comando enviado con método ${result.method}`);
        } else {
          throw new Error('Falló conexión con ESP32');
        }
      } else {
        // Para iOS o desarrollo
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const url = `http://${espIp}/${command.toLowerCase()}`;
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
          setAlertMessage(`Comando enviado: ${text}`);
          setAlertType('success');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
      
      setTimeout(() => setAlertMessage(''), 4000);
    } catch (error) {
      console.error('Error enviando comando:', error);
      
      let errorMessage = 'Error de conexión con el reloj';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Timeout - El reloj no responde. Verifica que esté conectado a la misma red WiFi.';
      } else if (error.message.includes('Network request failed')) {
        errorMessage = 'Error de red. Verifica que tu dispositivo y el reloj estén en la misma red WiFi.';
      } else if (error.message.includes('Falló conexión')) {
        errorMessage = 'No se pudo establecer conexión con el reloj. Verifica la IP y que esté encendido.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      setAlertMessage(errorMessage);
      setAlertType('error');
      setTimeout(() => setAlertMessage(''), 6000);
    }
  };

  const sendSpeed = async (newSpeed) => {
    if (!espIp) {
      console.log('No ESP IP configured for speed adjustment');
      return;
    }

    try {
      // Usar función específica para Android
      if (Platform.OS === 'android') {
        const result = await connectToESP32Android(espIp, `speed?value=${newSpeed}`, 8000);
        
        if (result.success) {
          console.log("Velocidad ajustada:", result.data);
        } else {
          throw new Error('Falló ajuste de velocidad');
        }
      } else {
        // Para iOS o desarrollo
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const url = `http://${espIp}/speed?value=${newSpeed}`;
        console.log('Enviando velocidad a:', url);
        
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const text = await response.text();
          console.log("Velocidad ajustada:", text);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      }
    } catch (error) {
      console.error('Error enviando velocidad:', error);
      
      if (error.name !== 'AbortError') {
        setAlertMessage('Error ajustando velocidad del reloj');
        setAlertType('error');
        setTimeout(() => setAlertMessage(''), 4000);
      }
    }
  };


  const handleOptionSelect = (option) => {
    setSelectedOption(option);
     if(option === "Custom") {
      sendCommand("stop");
    } else {
      sendCommand(option.toLowerCase());
    }
  };

  // Determine props for AnalogClock based on selected option and speed
  const getClockProps = () => {
    const lowerOption = selectedOption.toLowerCase();
    return {
      direction: lowerOption === "left" ? "left" : lowerOption === "right" ? "right" : "normal",
      isCrazy: lowerOption === "crazy",
      isSwing: lowerOption === "swing",
      speed: speed
    };
  };

  // Render custom movement item
  const renderCustomMovementItem = ({ item }) => {
    // Get movement details for display
    const movimiento = item.movimiento || {};
    const horas = movimiento.horas || {};
    const minutos = movimiento.minutos || {};
    
    const hourSpeed = horas.velocidad !== undefined ? horas.velocidad : (item.velocidad ?? '');
    const minuteSpeed = minutos.velocidad !== undefined ? minutos.velocidad : '';
    const hourDirection = horas.direccion || movimiento.direccionGeneral || '';
    const minuteDirection = minutos.direccion || '';

    return (
      <TouchableOpacity
        style={styles.customMovementItem}
        onPress={() => handleCustomMovementSelect(item)}
        disabled={loading}
      >
        <View style={styles.customMovementInfo}>
          <Text style={styles.customMovementName}>{item.nombre}</Text>
          <Text style={styles.customMovementDetails}>
            Hour: {hourDirection} (Speed: {hourSpeed})
          </Text>
          <Text style={styles.customMovementDetails}>
            Minute: {minuteDirection} (Speed: {minuteSpeed})
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </TouchableOpacity>
    );
  };

  // Render device item for selection
  const renderDeviceItem = ({ item }) => {
    const deviceInfo = item.deviceInfo || {};
    const isRecommended = deviceInfo.isTarget;
    
    return (
      <TouchableOpacity
        style={[
          styles.deviceItem,
          isRecommended && styles.deviceItemRecommended
        ]}
        onPress={() => selectDevice(item)}
      >
        <View style={styles.deviceInfo}>
          <View style={styles.deviceHeader}>
            <Text style={[
              styles.deviceIP,
              isRecommended && styles.deviceIPRecommended
            ]}>
              {item.ip}
            </Text>
            {isRecommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>RECOMENDADO</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.deviceDescription}>
            {deviceInfo.description || 'Dispositivo HTTP'}
          </Text>
          
          <View style={styles.deviceStats}>
            <Text style={styles.deviceStat}>
              Tiempo: {item.responseTime}ms
            </Text>
            <Text style={styles.deviceStat}>
              Estado: {item.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.deviceAction}>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={isRecommended ? "#660154" : "#666"} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { fontFamily: 'Cinzel_700Bold' }]}>MALBOUCHE</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('UserDetail', { user: currentUser })}
        >
          <View style={styles.avatarSmall}>
            <Ionicons name="person" size={20} color="#660154" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <LinearGradient
        colors={['#33002A', '#4F0E36', '#B76BA3']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
        >

     <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false} 
        >


          {/* Engrane en la esquina superior derecha */}
          <TouchableOpacity
            style={styles.gearIcon}
            onPress={() => {
              setIpInput(espIp);
              setIpModalVisible(true);
                }}
              >
                <Ionicons name="settings-sharp" size={28} color="#660154" />
              </TouchableOpacity>   

          <View style={styles.clockFrame}>
              {/*<ImageBackground
                source={FrameImage}
                style={styles.clockImageFrame}
                resizeMode="contain"
              > */}
 
              <View style={styles.clockInnerContainer}>
                <AnalogClock {...getClockProps()} />
              </View>
            
             {/*</ImageBackground> */}
          </View>
        <View style={styles.container2}>

          <View style={styles.buttonContainer}>
          {options.map((row, index) => (
            <View key={index} style={styles.buttonRow}>
              {row.map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => {
                    if (item === "Custom") {
                      setCustomModalVisible(true);
                      fetchCustomMovements();
                      setSelectedOption(item);
                    } else {
                      handlePresetSelect(item);
                      handleOptionSelect(item);
                    }
                  }}
                  disabled={loading}
                  style={{ flex: 1 }} // <- Esto es importante
                >
                  <LinearGradient
                    colors={
                      selectedOption === item
                        ? ['rgba(102, 1, 84, 0.9)', 'rgba(102, 1, 84, 0.8)']
                        : ['#fff', '#fff']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={[
                      styles.button,
                      selectedOption === item && styles.activeButton,
                    ]}
                  >
                    <Text
                      style={[
                        [styles.buttonText, { fontFamily: 'Montserrat_400Regular' }],
                        selectedOption === item && { color: "white" },
                      ]}
                    >
                      {item}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

              ))}
            </View>
          ))}
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderBox}>
              <Text style={[styles.sliderLabel, { fontFamily: 'Montserrat_700Bold' }]}>Speed</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={100}
                  step={1}
                  value={speed}
                  onSlidingComplete={(val) => {
                    setSpeed(val);
                    sendSpeed(val);
                    sendSpeedUpdate(val); // Update speed in the database
                  }}
                  minimumTrackTintColor="#000"
                  maximumTrackTintColor="#aaa"
                  thumbTintColor="#660154"
                />
            </View> 
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#660154" />
              
            </View>
          )}
          {alertMessage !== '' && (
            <View
              style={[
                styles.alertContainer,
                null
              ]}
            >
            <Text
              style={[
                styles.alertText,
                alertType === 'error' && { color: '#dd4e5cff' },
                alertType === 'success' && { color: '#5a8d66ff' }
              ]}
            >
              {alertMessage}
            </Text>

            </View>
          )}
        </View>       
               
      </ScrollView>
    </LinearGradient>   

     
        {/* Custom Movements Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={customModalVisible}
          onRequestClose={() => setCustomModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Custom Movement</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setCustomModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                {loadingMovements ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color="#660154" />
                    <Text style={styles.modalLoadingText}>Loading movements...</Text>
                  </View>
                ) : customMovements.length === 0 ? (
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="folder-open-outline" size={48} color="#ccc" />
                    <Text style={styles.emptyStateText}>No custom movements found</Text>
                    <Text style={styles.emptyStateSubtext}>
                      Create custom movements in the Movements section
                    </Text>
                    <TouchableOpacity 
                      style={styles.refreshButton}
                      onPress={fetchCustomMovements}
                    >
                      <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={customMovements}
                    renderItem={renderCustomMovementItem}
                    keyExtractor={(item) => item.id || item.nombre || Math.random().toString()}
                    showsVerticalScrollIndicator={true}
                    style={styles.customMovementsList}
                    contentContainerStyle={{paddingBottom: 20}}
                    ListEmptyComponent={
                      <View style={styles.emptyStateContainer}>
                        <Ionicons name="folder-open-outline" size={48} color="#ccc" />
                        <Text style={styles.emptyStateText}>No custom movements found</Text>
                      </View>
                    }
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal para ingresar la IP del reloj */}

        <Modal
          animationType="fade"
          transparent={true}
          visible={ipModalVisible}
          onRequestClose={() => setIpModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.ipModalContent}>
              <View style={styles.ipModalHeader}>
                <Text style={[styles.modalTitle, { fontFamily: 'Montserrat_700Bold' }]}>Configure Clock IP Address</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIpModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.ipModalBody}>
                <Text style={[styles.ipCurrentLabel, { fontFamily: 'Montserrat_500Medium' }]}>Actual IP Address: <Text style={[styles.ipCurrentValue, { fontFamily: 'Montserrat_700SemiBold' }]}>{espIp || 'Not configured'}</Text></Text>
                <TextInput
                  style={[styles.input, { fontFamily: 'Montserrat_500Medium' }]}
                  placeholder="Ej: 192.168.0.175"
                  value={ipInput}
                  onChangeText={setIpInput}
                  keyboardType="numeric"
                  autoFocus
                  placeholderTextColor="#aaa"
                />
                <Text style={[styles.ipHelpText, { fontFamily: 'Montserrat_400Regular' }]}>
                  Asegúrate de que tu dispositivo y el reloj estén en la misma red WiFi.
                </Text>
                
                <View style={styles.scanButtonsContainer}>
                  <TouchableOpacity
                    style={[styles.scanButton, styles.scanButtonFast, isScanning && styles.scanButtonDisabled]}
                    onPress={() => scanForESP32(true)}
                    disabled={isScanning}
                  >
                    <Text style={[styles.scanButtonText, { fontFamily: 'Montserrat_600SemiBold' }]}>
                      {isScanning ? 'Escaneando...' : 'Escaneo Rápido'}
                    </Text>
                    <Text style={[styles.scanButtonSubtext, { fontFamily: 'Montserrat_400Regular' }]}>
                      ~2 min
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.scanButton, styles.scanButtonComplete, isScanning && styles.scanButtonDisabled]}
                    onPress={() => scanForESP32(false)}
                    disabled={isScanning}
                  >
                    <Text style={[styles.scanButtonText, { fontFamily: 'Montserrat_600SemiBold' }]}>
                      {isScanning ? (scanProgress ? scanProgress.message : 'Escaneando...') : 'Escaneo Completo'}
                    </Text>
                    <Text style={[styles.scanButtonSubtext, { fontFamily: 'Montserrat_400Regular' }]}>
                      ~4 min
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.testButton}
                  onPress={async () => {
                    if (!ipInput.trim()) {
                      setAlertMessage('Ingresa una dirección IP válida');
                      setAlertType('error');
                      setTimeout(() => setAlertMessage(''), 4000);
                      return;
                    }
                    
                    setAlertMessage('Probando conexión...');
                    setAlertType('info');
                    
                    const isConnected = await testEspConnection(ipInput);
                    
                    if (isConnected) {
                      setAlertMessage('¡Conexión exitosa! IP válida.');
                      setAlertType('success');
                    } else {
                      setAlertMessage('No se pudo conectar. Verifica la IP y que el reloj esté encendido.');
                      setAlertType('error');
                    }
                    setTimeout(() => setAlertMessage(''), 6000);
                  }}
                >
                  <Text style={[styles.testButtonText, { fontFamily: 'Montserrat_600SemiBold' }]}>Probar Conexión</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={async () => {
                    if (!ipInput.trim()) {
                      setAlertMessage('Ingresa una dirección IP válida');
                      setAlertType('error');
                      setTimeout(() => setAlertMessage(''), 4000);
                      return;
                    }
                    
                    try {
                      await AsyncStorage.setItem(ESP_IP_KEY, ipInput);
                      setEspIp(ipInput);
                      setIpModalVisible(false);
                      setAlertMessage('IP guardada exitosamente.');
                      setAlertType('success');
                      setTimeout(() => setAlertMessage(''), 4000);
                    } catch (e) {
                      setAlertMessage('Error al guardar la IP.');
                      setAlertType('error');
                      setTimeout(() => setAlertMessage(''), 4000);
                    }
                  }}
                >
                  <Text style={[styles.saveButtonText, { fontFamily: 'Montserrat_700Bold' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal para seleccionar dispositivo */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={deviceSelectionVisible}
          onRequestClose={() => setDeviceSelectionVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.deviceModalContent}>
              <View style={styles.deviceModalHeader}>
                <Text style={[styles.modalTitle, { fontFamily: 'Montserrat_700Bold' }]}>
                  Seleccionar Dispositivo
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setDeviceSelectionVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.deviceModalBody}>
                <Text style={[styles.deviceModalSubtitle, { fontFamily: 'Montserrat_500Medium' }]}>
                  Encontrados {scannedDevices.length} dispositivos:
                </Text>
                
                {scannedDevices.length > 0 && (
                  <View style={styles.scanInfoContainer}>
                    <Text style={[styles.scanInfoText, { fontFamily: 'Montserrat_400Regular' }]}>
                      💡 Los dispositivos marcados como "RECOMENDADO" son más probables de ser tu reloj ESP32
                    </Text>
                  </View>
                )}
                
                <FlatList
                  data={scannedDevices}
                  renderItem={renderDeviceItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.devicesList}
                  contentContainerStyle={styles.devicesListContent}
                />
                
                <TouchableOpacity
                  style={styles.manualButton}
                  onPress={() => {
                    setDeviceSelectionVisible(false);
                    // IP modal ya está abierto, solo cerramos este
                  }}
                >
                  <Text style={[styles.manualButtonText, { fontFamily: 'Montserrat_600SemiBold' }]}>
                    Ingresar IP Manualmente
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <NavigationBar/>
      </View>
    </SafeAreaView>
  );
};

// Simple debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const styles = StyleSheet.create({
  // Modal especial para la IP, más pequeño y centrado
  ipModalContent: {
    width: '92%',
    maxWidth: 380,
    backgroundColor: 'white',
    borderRadius: 18,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    marginVertical: 40,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  ipModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ipModalBody: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: 'white',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    alignItems: 'stretch',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
    color: '#333',
    width: '100%',
    minHeight: 44,
  },
  ipCurrentLabel: {
    marginBottom: 10,
    fontSize: 15,
    color: '#333',
  },
  ipCurrentValue: {
    fontWeight: 'bold',
    color: '#660154',
  },
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  container2: {
    backgroundColor: "#f4f4f4",
    borderTopLeftRadius: 150,   
    borderTopRightRadius: 150, 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 90,
    marginHorizontal: 15,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    marginTop: 180,
    zIndex: 0,
    position: 'relative',
    
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 100,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 45,
  },
  title: {
    fontSize: 22,
    color: "#333",
  },
  profileButton: {
    marginLeft: 10,
    marginBottom: 10,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockFrame: {
  width: 300,
  height: 300,
  position: 'absolute',     
  left: '50%',
  transform: [{ translateX: -150 }], 
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 10,
  },
  clockImageFrame: {
    width: '98%',
    height: '98%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 20,
    overflow: 'hidden',
  },
  
  gearIcon: {
    alignContent: 'flex-end',
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 3,
  },
  clockInnerContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight:2,
    marginTop: 15,
  },
  buttonContainer: {
    marginTop: 45,
    width: "100%",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 18,
    zIndex: 0,
  },
button: {
  flex: 1,
  backgroundColor: "#fff",
  borderRadius: 30,
  paddingVertical: 20,
  justifyContent: "center",
  alignItems: "center",
  minHeight: 50,
  borderWidth: 0.8,
  borderColor: "rgba(209, 148, 22, 0.5)",
  shadowColor: "#660154",
  elevation: 4,
},
activeButton: {
  backgroundColor: "#fff",
  shadowColor: "#660154",
  elevation: 4,
  borderColor: "#660154",
},
  buttonText: {
    color: "#660154",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
    fontFamily: "Poppins_600SemiBold",
  },
  sliderContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  sliderBox: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
  
   
    shadowColor: "#660154",
    elevation: 5,
    overflow: "hidden",
    paddingBottom: 20,
  },
  sliderLabel: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  slider: {
    width: "85%",
    height: 30,
    alignSelf: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    gap: 8,
  },
  loadingText: {
    color: "#660154",
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    minHeight: 300, // Añadir altura mínima
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    flex: 1,
    padding: 20,
    minHeight: 200, // Añadir altura mínima para el cuerpo
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalLoadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  refreshButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#660154',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  customMovementsList: {
    flex: 1,
    minHeight: 150, // Asegurar una altura mínima para la lista
    width: '100%',
  },
  customMovementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  customMovementInfo: {
    flex: 1,
  },
  customMovementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  customMovementDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  // Input y botón para el modal de IP
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  ipHelpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scanButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  scanButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  scanButtonFast: {
    backgroundColor: '#28a745',
  },
  scanButtonComplete: {
    backgroundColor: '#007bff',
  },
  scanButtonDisabled: {
    backgroundColor: '#6c757d',
    opacity: 0.7,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  scanButtonSubtext: {
    color: '#fff',
    fontSize: 10,
    opacity: 0.8,
  },
  testButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#660154',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  // Estilos para el modal de selección de dispositivos
  deviceModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
  },
  deviceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  deviceModalBody: {
    flex: 1,
  },
  deviceModalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  scanInfoContainer: {
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  scanInfoText: {
    fontSize: 12,
    color: '#0056b3',
    lineHeight: 16,
  },
  devicesList: {
    flex: 1,
    marginBottom: 15,
  },
  devicesListContent: {
    paddingBottom: 10,
  },
  deviceItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceItemRecommended: {
    backgroundColor: '#f0f8ff',
    borderColor: '#660154',
    borderWidth: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deviceIP: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceIPRecommended: {
    color: '#660154',
  },
  recommendedBadge: {
    backgroundColor: '#660154',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  deviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  deviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deviceStat: {
    fontSize: 12,
    color: '#888',
  },
  deviceAction: {
    padding: 10,
  },
  manualButton: {
    backgroundColor: '#6c757d',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  manualButtonText: {
    color: '#fff',
    fontSize: 14,
  },
alertContainer: {
  padding: 10,
  marginTop: 10,
  alignItems: 'center',
  justifyContent: 'center',
  marginHorizontal: 20,
},
alertText: {
  fontSize: 14,
  textAlign: 'center',
},


});

export default MainRest;