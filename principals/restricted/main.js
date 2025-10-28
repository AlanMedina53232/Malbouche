import React, { useState, useCallback, useEffect } from "react";
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
  validateIPFormat, 
  pingESP32, 
  connectToESP32Android,
  isLocalNetwork
} from '../../utils/networkHelper';

import UnifiedClockService from '../../utils/UnifiedClockService';
import { useEventScheduler } from '../../hooks/useEventScheduler';


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
  const [deviceType, setDeviceType] = useState(null); // Tipo de dispositivo detectado
  
const [alertMessage, setAlertMessage] = useState('');
const [alertType, setAlertType] = useState(''); // 'error', 'success', etc.

  // Estado para el modal de eventos
  const [eventsModalVisible, setEventsModalVisible] = useState(false);

  // Hook simplificado para eventos y configuración ESP32
  const {
    updateESPIP,
    getAllEvents,
    refreshEvents
  } = useEventScheduler();

  // Las funciones de escaneo de red han sido eliminadas

  // Cargar la IP guardada al iniciar
  useEffect(() => {
    const loadEspIp = async () => {
      try {
        const savedIp = await AsyncStorage.getItem(ESP_IP_KEY);
        if (savedIp) {
          setEspIp(savedIp);
          // Ya no probamos la conexión automáticamente
        } else {
          // Si no hay IP guardada, mostrar el modal
          setIpModalVisible(true);
        }
      } catch (e) {
        console.error("Error loading ESP IP:", e);
      }
    };
    loadEspIp();
  }, []);

  // Actualizar ESP_IP cuando cambie espIp
  useEffect(() => {
    ESP_IP = espIp;
  }, [espIp]);
  
  // Configurar el ESP32 en el backend
  const configureESP32InBackend = async (ip, deviceType) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return false;
      }

      // Convertir tipo de dispositivo al formato que espera el backend
      const espType = deviceType === UnifiedClockService.DEVICE_TYPES.PROTOTYPE ? 'prototype' : 'standard';
      
      const response = await fetch(`${BACKEND_URL}/scheduler/esp32/configure`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip: ip,
          type: espType
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        console.warn("Error configuring ESP32 in backend:", result.error);
        return false;
      }
      
      console.log("ESP32 configured successfully in backend");
      return true;
    } catch (error) {
      console.error("Error configuring ESP32 in backend:", error);
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
    ["Crazy", "Custom"],
    ["Normal"]
  ];

  // Function to map internal values to display labels
  const getDisplayLabel = (value) => {
    return value === "Normal" ? "Stop" : value;
  };

  // Preset names to exclude from custom movements
  const PRESET_NAMES = ["left", "right", "crazy", "normal"];

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

    // If stop command, send to the backend stop endpoint
    if (preset === "stop") {
      try {
        const token = await getAuthToken();
        if (!token) {
          return;
        }
        
        const response = await fetch(`${BACKEND_URL}/direct-movement/stop`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        const result = await response.json();
        
        if (result.success) {
          setAlertMessage("Movimiento detenido");
          setAlertType("success");
        } else {
          setAlertMessage(`Error deteniendo movimiento: ${result.error}`);
          setAlertType("error");
        }
        setTimeout(() => setAlertMessage(''), 3000);
      } catch (error) {
        console.error("Error stopping movement:", error);
        setAlertMessage("Error de conexión al detener movimiento");
        setAlertType("error");
        setTimeout(() => setAlertMessage(''), 3000);
      }
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
      
      // 1. First, update the movement in the backend database
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
        console.log("Preset updated successfully in backend:", preset);
        
        // 2. Now send the command through the backend Direct Movement API
        try {
          const token = await getAuthToken();
          if (!token) {
            setLoading(false);
            return;
          }

          const response = await fetch(`${BACKEND_URL}/direct-movement/execute`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              movement: preset.toLowerCase(),
              speed: speed
            })
          });

          const result = await response.json();
          
          if (!result.success) {
            console.warn("Backend direct movement warning:", result.error);
            setAlertMessage(`Movimiento actualizado en servidor, pero hubo un problema enviándolo al reloj: ${result.error}`);
            setAlertType("warning");
            setTimeout(() => setAlertMessage(''), 4000);
          } else {
            console.log("Movement command sent successfully through backend");
          }
        } catch (error) {
          console.error("Error sending movement through backend:", error);
          setAlertMessage("Error de conexión al enviar el comando al backend");
          setAlertType("error");
          setTimeout(() => setAlertMessage(''), 4000);
        }
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
      
      // 1. First update the movement in the backend database
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
        console.log("Custom movement updated successfully in backend:", movement.nombre);
        
        // 2. Now send the command through the backend Direct Movement API
        try {
          const token = await getAuthToken();
          if (!token) {
            setLoading(false);
            return;
          }
          
          // Extract movement parameters
          const movimiento = data.data.movimiento || movement.movimiento || {};
          const horas = movimiento.horas || {};
          const minutos = movimiento.minutos || {};
          
          // Prepare custom movement object for backend
          const customMovement = {
            nombre: movement.nombre,
            movimiento: {
              horas: {
                direccion: horas.direccion || movimiento.direccionGeneral,
                velocidad: horas.velocidad !== undefined ? horas.velocidad : speed
              },
              minutos: {
                direccion: minutos.direccion || movimiento.direccionGeneral,
                velocidad: minutos.velocidad !== undefined ? minutos.velocidad : speed
              }
            }
          };

          const response = await fetch(`${BACKEND_URL}/direct-movement/execute`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              movement: 'custom',
              speed: speed,
              customMovement: customMovement
            })
          });

          const result = await response.json();
          
          if (!result.success) {
            console.warn("Backend custom movement warning:", result.error);
            setAlertMessage(`Movimiento actualizado en servidor, pero hubo un problema enviándolo al reloj: ${result.error}`);
            setAlertType("warning");
            setTimeout(() => setAlertMessage(''), 4000);
          } else {
            console.log("Custom movement sent successfully through backend");
          }
        } catch (error) {
          console.error("Error sending custom movement through backend:", error);
          setAlertMessage("Error de conexión al enviar el movimiento personalizado al backend");
          setAlertType("error");
          setTimeout(() => setAlertMessage(''), 4000);
        }
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

      // 1. First update the speed in the backend database
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
      console.log("Speed updated successfully in backend:", newSpeed);

      // 2. Now send the speed update through the backend
      try {
        const token = await getAuthToken();
        if (!token) {
          return;
        }

        // Obtener el movimiento actual para determinar qué tipo enviar
        const currentMovement = selectedOption.toLowerCase() === "custom" ? "custom" : selectedOption.toLowerCase();
        
        // Enviar actualización de velocidad a través del backend
        const response = await fetch(`${BACKEND_URL}/direct-movement/execute`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            movement: currentMovement,
            speed: newSpeed
          })
        });

        const result = await response.json();
        
        if (!result.success) {
          console.warn("Backend speed update warning:", result.error);
          // Optionally show a warning message to the user
          // setAlertMessage(`Velocidad actualizada en servidor, pero hubo un problema enviándola al reloj: ${result.error}`);
          // setAlertType("warning");
          // setTimeout(() => setAlertMessage(''), 4000);
        } else {
          console.log("Speed updated successfully through backend");
        }
      } catch (error) {
        console.error("Error sending speed update through backend:", error);
      }

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

  // Helper function to handle backend + ESP32 communication
  const executeMovementCommand = async (preset, forceMethod = null) => {
    // Determinar el método de envío
    let useBackend;
    
    if (forceMethod === 'direct') {
      useBackend = false;
    } else if (forceMethod === 'backend') {
      useBackend = true;
    } else {
      // Por defecto usar backend para todos excepto stop
      useBackend = preset !== "stop";
    }

    if (useBackend && preset !== "stop") {
      // Use backend system for all movements except stop
      try {
        return await handlePresetSelect(preset);
      } catch (error) {
        console.warn('Backend failed, falling back to direct communication:', error);
        // Fallback to direct communication
        return await executeMovementCommand(preset, 'direct');
      }
    } else {
      // Direct command through backend API for stop or when regular backend is disabled
      try {
        const token = await getAuthToken();
        if (!token) {
          return;
        }

        const endpoint = preset === "stop" ? 
          `${BACKEND_URL}/direct-movement/stop` : 
          `${BACKEND_URL}/direct-movement/execute`;
        
        console.log(`Enviando comando ${preset} a través del backend`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preset === "stop" ? {} : {
            movement: preset.toLowerCase(),
            speed: speed
          })
        });

        const result = await response.json();
        
        if (result.success) {
          setAlertMessage(`Comando enviado exitosamente: ${result.message || preset}`);
          setAlertType('success');
          console.log('Comando enviado con éxito a través del backend');
        } else {
          setAlertMessage(result.error || "Error enviando comando");
          setAlertType('error');
          console.error('Error enviando comando a través del backend:', result.error);
        }
        
        setTimeout(() => setAlertMessage(''), 4000);
      } catch (error) {
        console.error('Error de conexión enviando comando:', error);
        setAlertMessage('Error de conexión al enviar comando al backend');
        setAlertType('error');
        setTimeout(() => setAlertMessage(''), 4000);
      }
    }
  };

  const sendCommand = async (command) => {
    return await executeMovementCommand(command, 'backend'); // Force backend communication
  };

  const sendSpeed = async (newSpeed) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return;
      }

      console.log('Enviando velocidad a través del backend:', newSpeed);
      
      // Obtener el movimiento actual para determinar qué tipo enviar
      const currentMovement = selectedOption.toLowerCase() === "custom" ? "custom" : selectedOption.toLowerCase();
      
      // Use direct-movement API to send speed update
      const response = await fetch(`${BACKEND_URL}/direct-movement/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movement: currentMovement,
          speed: newSpeed
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log("Velocidad ajustada con éxito:", newSpeed);
      } else {
        console.warn("Error ajustando velocidad:", result.error);
        // Optionally show error to user
        // setAlertMessage(result.error);
        // setAlertType('error');
        // setTimeout(() => setAlertMessage(''), 4000);
      }
    } catch (error) {
      console.error('Error enviando velocidad:', error);
      
      setAlertMessage('Error de conexión al ajustar velocidad');
      setAlertType('error');
      setTimeout(() => setAlertMessage(''), 4000);
    }
  };


  const handleOptionSelect = async (option) => {
    setSelectedOption(option);
    
    if(option === "Custom") {
      // Para Custom, simplemente detenemos cualquier movimiento actual
      await handlePresetSelect("stop");
    } else {
      // Para otros movimientos, usamos el sistema backend
      await handlePresetSelect(option.toLowerCase());
    }
  };

  // Determine props for AnalogClock based on selected option and speed
  const getClockProps = () => {
    const lowerOption = selectedOption.toLowerCase();
    return {
      direction: lowerOption === "left" ? "left" : lowerOption === "right" ? "right" : "normal",
      isCrazy: lowerOption === "crazy",
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

  // El renderizado de dispositivos escaneados ha sido eliminado

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Fondo con gradiente a pantalla completa */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <LinearGradient
          colors={['#8C8C8C', '#3A3A3B', '#2E2E2E']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={[styles.titleGradient, { fontFamily: 'Combo_400Regular' }]}>MALBOUCHE</Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('UserDetail', { user: currentUser })}
          >
            <View style={styles.avatarSmall}>
              <Ionicons name="person" size={20} color="#404040" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.container}>
        <View style={styles.container}
        >

     <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false} 
        >
          {/* Indicador de eventos programados */}
          <TouchableOpacity
            style={styles.eventsIndicator}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => setEventsModalVisible(true)}
          >
            <Ionicons 
              name="time" 
              size={20} 
              color="#404040" 
            />
            <Text style={styles.eventsText}>
              {getAllEvents().length}
            </Text>
          </TouchableOpacity>

          {/* Engrane en la esquina superior derecha */}
          <TouchableOpacity
            style={styles.gearIcon}
            onPress={() => {
              setIpInput(espIp);
              setIpModalVisible(true);
                }}
              >
                <Ionicons name="settings-sharp" size={28} color="#404040" />
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
                  activeOpacity={0.8}
                  style={{ flex: 1 }}
                >
                  <LinearGradient
                    colors={
                      selectedOption === item
                        ? ['#8C8C8C', '#404040']
                        : ['#F2F2F2', '#F2F2F2']
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
                        [styles.buttonText, { fontFamily: 'Combo_400Regular' }],
                        selectedOption === item && { color: "white" },
                      ]}
                    >
                      {getDisplayLabel(item)}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

              ))}
            </View>
          ))}
          </View>

          <View style={styles.sliderContainer}>
            <View style={styles.sliderBox}>
              <Text style={[styles.sliderLabel, { fontFamily: 'Combo_400Regular' }]}>Speed</Text>
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
                  minimumTrackTintColor="#2E2E2E"
                  maximumTrackTintColor="#8C8C8C"
                  thumbTintColor="#404040"
                />
            </View> 
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2e2e2e" />
              
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
    </View>   

     
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
                  <Ionicons name="close" size={24} color="#f2f2f2" />
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
                <Text style={[styles.modalTitle, { fontFamily: 'Combo_400Regular' }]}>Configure Clock IP Address</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIpModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#f2f2f2f2" />
                </TouchableOpacity>
              </View>
              <View style={styles.ipModalBody}>
                <Text style={[styles.ipCurrentLabel, { fontFamily: 'Combo_400Regular' }]}>Actual IP Address: <Text style={[styles.ipCurrentValue, { fontFamily: 'Combo_400Regular' }]}>{espIp || 'Not configured'}</Text></Text>
                <TextInput
                  style={[styles.input, { fontFamily: 'Combo_400Regular' }]}
                  placeholder="Ej: 192.168.0.175"
                  value={ipInput}
                  onChangeText={setIpInput}
                  keyboardType="numeric"
                  autoFocus
                  placeholderTextColor="#bfbfbf"
                />
                <Text style={[styles.ipHelpText, { fontFamily: 'Combo_400Regular' }]}>
                  Ensure that your device and watch are on the same Wi-Fi network.
                </Text>
                
                {/* Los botones de escaneo han sido eliminados */}
                
                {/* Selección de tipo de dispositivo */}
                <View style={styles.deviceTypeContainer}>
                  <Text style={[styles.deviceTypeLabel, { fontFamily: 'Combo_400Regular' }]}>
                    Device type:
                  </Text>
                  <View style={styles.deviceTypeButtons}>
                    <TouchableOpacity 
                      style={[
                        styles.deviceTypeButton, 
                        deviceType === UnifiedClockService.DEVICE_TYPES.STEPPER && styles.deviceTypeButtonActive
                      ]}
                      onPress={() => {
                        setDeviceType(UnifiedClockService.DEVICE_TYPES.STEPPER);
                        if (ipInput) {
                          UnifiedClockService.setDeviceType(ipInput, UnifiedClockService.DEVICE_TYPES.STEPPER);
                          setAlertMessage('Tipo de dispositivo configurado: Estándar (motores paso a paso)');
                          setAlertType('info');
                          setTimeout(() => setAlertMessage(''), 3000);
                        }
                      }}
                    >
                      <Text style={[
                        styles.deviceTypeButtonText,
                        deviceType === UnifiedClockService.DEVICE_TYPES.STEPPER && styles.deviceTypeButtonTextActive,
                        { fontFamily: 'Combo_400Regular' }
                      ]}>
                        Estándar (Paso a Paso)
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.deviceTypeButton, 
                        deviceType === UnifiedClockService.DEVICE_TYPES.PROTOTYPE && styles.deviceTypeButtonActive
                      ]}
                      onPress={() => {
                        setDeviceType(UnifiedClockService.DEVICE_TYPES.PROTOTYPE);
                        if (ipInput) {
                          UnifiedClockService.setDeviceType(ipInput, UnifiedClockService.DEVICE_TYPES.PROTOTYPE);
                          setAlertMessage('Tipo de dispositivo configurado: Prototipo (28BYJ-48)');
                          setAlertType('info');
                          setTimeout(() => setAlertMessage(''), 3000);
                        }
                      }}
                    >
                      <Text style={[
                        styles.deviceTypeButtonText,
                        deviceType === UnifiedClockService.DEVICE_TYPES.PROTOTYPE && styles.deviceTypeButtonTextActive,
                        { fontFamily: 'Combo_400Regular' }
                      ]}>
                        Prototipo (28BYJ-48)
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.deviceTypeInfo, { fontFamily: 'Combo_400Regular' }]}>
                    {deviceType ? 
                      (deviceType === UnifiedClockService.DEVICE_TYPES.PROTOTYPE ? 
                        'The prototype with 28BYJ-48 motors has been selected.' : 
                        'Stepper motors have been selected for this standard device.') : 
                      'Before continuing, please select a device type.'}
                  </Text>
                </View>
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
                      
                      // Actualizar el programador de eventos con la nueva IP
                      await updateESPIP(ipInput);
                      
                      // Si se ha seleccionado un tipo de dispositivo manualmente, guardarlo
                      if (deviceType) {
                        UnifiedClockService.setDeviceType(ipInput, deviceType);
                      } else {
                        // Si no se ha seleccionado manualmente, intentar detectar
                        try {
                          const detectedType = await UnifiedClockService.detectDeviceType(ipInput);
                          setDeviceType(detectedType);
                        } catch (error) {
                          console.warn("No se pudo detectar el tipo de dispositivo:", error);
                        }
                      }
                      
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
                  <Text style={[styles.saveButtonText, { fontFamily: 'Combo_400Regular' }]}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal to view active events list */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={eventsModalVisible}
          onRequestClose={() => setEventsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.eventsModalContent}>
              <View style={styles.eventsModalHeader}>
                <Text style={[styles.modalTitle, { fontFamily: 'Combo_400Regular' }]}>
                  Active Events
                </Text>
                <View style={styles.headerActions}>
                  {getAllEvents().filter(event => event.activo).length > 0 && (
                    <TouchableOpacity
                      style={styles.manageEventsButton}
                      onPress={() => {
                        setEventsModalVisible(false);
                        navigation.navigate('Events');
                      }}
                    >
                      <Ionicons name="settings-outline" size={20} color="#f2f2f2" />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setEventsModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#f2f2f2" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.eventsModalBody}>
                <Text style={[styles.eventsListTitle, { fontFamily: 'Combo_400Regular' }]}>
                  {getAllEvents().filter(event => event.activo).length} active event(s) configured on the server:
                </Text>
                
                {getAllEvents().filter(event => event.activo).length === 0 ? (
                  <View style={styles.emptyEventsContainer}>
                    <Ionicons name="calendar-outline" size={64} color="#f2f2f2f2" />
                    <Text style={[styles.emptyEventsText, { fontFamily: 'Combo_400Regular' }]}>
                      No active events scheduled
                    </Text>
                    <Text style={[styles.emptyEventsSubtext, { fontFamily: 'Combo_400Regular' }]}>
                      Create automated schedules for your clock to move at specific times
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.createEventButton}
                      onPress={() => {
                        setEventsModalVisible(false);
                        navigation.navigate('Events');
                      }}
                    >
                      <Ionicons name="add-circle" size={20} color="#f2f2f2f2" />
                      <Text style={[styles.createEventButtonText, { fontFamily: 'Combo_400Regular' }]}>
                        Create First Event
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={getAllEvents().filter(event => event.activo)}
                    keyExtractor={(item) => item.id || item.nombreEvento}
                    showsVerticalScrollIndicator={false}
                    style={styles.eventsList}
                    renderItem={({ item }) => (
                      <View style={styles.eventItem}>
                        <View style={styles.eventHeader}>
                          <Text style={[styles.eventName, { fontFamily: 'Combo_400Regular' }]}>
                            {item.nombreEvento}
                          </Text>
                          <View style={[styles.eventStatusBadge, styles.activeBadge]}>
                            <Text style={[styles.eventStatusText, { fontFamily: 'Combo_400Regular' }]}>
                              Active
                            </Text>
                          </View>
                        </View>
                        
                        <View style={styles.eventDetails}>
                          <View style={styles.eventTimeRow}>
                            <Ionicons name="time-outline" size={16} color="#666" />
                            <Text style={[styles.eventTime, { fontFamily: 'Combo_400Regular' }]}>
                              {item.horaInicio}
                            </Text>
                          </View>
                          
                          {item.descripcion && (
                            <Text style={[styles.eventDescription, { fontFamily: 'Combo_400Regular' }]}>
                              {item.descripcion}
                            </Text>
                          )}
                          
                          <View style={styles.eventDaysContainer}>
                            <Text style={[styles.eventDaysLabel, { fontFamily: 'Combo_400Regular' }]}>
                              Days: 
                            </Text>
                            <Text style={[styles.eventDays, { fontFamily: 'Combo_400Regular' }]}>
                              {Array.isArray(item.diasSemana) && item.diasSemana.length > 0 
                                ? item.diasSemana.join(', ')
                                : 'None'
                              }
                            </Text>
                          </View>
                        </View>
                      </View>
                        )}
                    />
                )}
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
    backgroundColor: '#404040',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ipModalBody: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: '#f2f2f2f2',
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
    color: '#3A3A3B',
  },
  ipCurrentValue: {
    color: '#2E2E2E',
  },
  container: {
    flex: 1,
  },
  container2: {
    borderTopLeftRadius: 150,   
    borderTopRightRadius: 150, 
    borderBottomLeftRadius: 20, 
    borderBottomRightRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 90,
    marginHorizontal: 15,
    
    marginTop: 180,
    zIndex: 0,
    position: 'relative',
    
  },
  //////////////////////////////////////////////////////////////////
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30, 
    zIndex: 100,
  },

  headerGradient: {
  paddingTop: 38,
  paddingBottom: 10,
  paddingHorizontal: 20,

},

headerContent: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

titleGradient: {
  fontSize: 40,
  color: "#2E2E2E",
  paddingLeft: 35
},

  profileButton: {
    marginLeft: 10,
    marginBottom: 10,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",

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
    top: 5,
    right: 20,
    zIndex: 10,
    backgroundColor: '#BFBFBF',
    borderRadius: 20,
    padding: 4,
    elevation: 3,
  },
  eventsIndicator: {
    position: 'absolute',
    top: 10,
    right: 75,
    zIndex: 15,
    backgroundColor: '#BFBFBF',
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,

  },
  eventsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#404040',
    minWidth: 12,
    textAlign: 'center',
  },
  clockInnerContainer: {
    width: '100%',
    height: '/%',
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
    elevation: 2,

  },
button: {
  flex: 1,
  backgroundColor: "#f2f2f21a",
  borderRadius: 30,
  paddingVertical: 20,
  justifyContent: "center",
  alignItems: "center",
  minHeight: 50,
  borderWidth: 0,
  overflow: 'hidden',
  shadowColor: "#2E2E2E",
  elevation: 3,
  
},
activeButton: {
  borderWidth: 0,
},
  buttonText: {
    color: "#404040",
    fontSize: 18,
    textAlign: "center",
  },
  sliderContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: 20,
  },
  sliderBox: {
    backgroundColor: "#F2F2F2",
    width: "90%",
    borderRadius: 20,
    shadowColor: "#2E2E2E",
    elevation: 3,
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
    color: "#BFBFBF",
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
    color: '#f2f2f2',
  },
  closeButton: {
    padding: 5,
    borderRadius: 25,
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
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
    
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
  saveButton: {
    backgroundColor: '#404040',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#f2f2f2f2',
    fontSize: 16,
  },
  // Estilos para el modal de selección de dispositivos
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
    color: '#f2f2f2f2',
    fontSize: 14,
  },
  deviceTypeContainer: {
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  deviceTypeLabel: {
    fontSize: 16,
    marginBottom: 10,
    color: '#2e2e2e',
  },
  deviceTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  deviceTypeButton: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#404040',
  },
  deviceTypeButtonActive: {
    backgroundColor: '#404040',
  },
  deviceTypeButtonText: {
    fontSize: 12,
    color: '#2e2e2e',
    textAlign: 'center',
  },
  deviceTypeButtonTextActive: {
    color: '#f2f2f2f2',
  },
  deviceTypeInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
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

// Estilos para el modal de eventos
eventsModalContent: {
  width: '92%',
  maxWidth: 400,
  minHeight: 500,
  backgroundColor: '#f2f2f2',
  borderRadius: 20,
  maxHeight: '85%',
  shadowColor: '#404040',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 8,
},
eventsModalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 20,
  paddingVertical: 15,
  borderBottomWidth: 1,
  borderBottomColor: '#f0f0f0',
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  backgroundColor: '#404040',
},
headerActions: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 10,
},
manageEventsButton: {
  padding: 8,
  borderRadius: 25,
},
eventsModalBody: {
  flex: 1,
  paddingHorizontal: 20,
  paddingVertical: 15,
},

schedulerStatusRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
schedulerStatusText: {
  fontSize: 14,
  color: '#333',
},
toggleButton: {
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 20,
  minWidth: 80,
  alignItems: 'center',
},
startButton: {
  backgroundColor: '#28a745',
},
stopButton: {
  backgroundColor: '#dc3545',
},
toggleButtonText: {
  color: '#f2f2f2f2',
  fontSize: 12,
},
eventsListTitle: {
  fontSize: 16,
  color: '#333',
  marginBottom: 15,
},
emptyEventsContainer: {
  justifyContent: 'center',
  alignItems: 'center',
  paddingVertical: 60,
  paddingHorizontal: 20,
  minHeight: 300,
},
emptyEventsText: {
  fontSize: 18,
  color: '#333',
  marginTop: 20,
  textAlign: 'center',
},
emptyEventsSubtext: {
  fontSize: 14,
  color: '#666',
  marginTop: 10,
  marginBottom: 25,
  textAlign: 'center',
  lineHeight: 20,
},
createEventButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#660154',
  paddingHorizontal: 20,
  paddingVertical: 12,
  borderRadius: 25,
  gap: 8,
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 3,
},
createEventButtonText: {
  color: '#f2f2f2f2',
  fontSize: 16,
},
eventsList: {
  maxHeight: 400,
  minHeight: 200,
},
eventItem: {
  backgroundColor: '#f8f9fa',
  borderRadius: 12,
  padding: 15,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: '#e9ecef',
},
eventHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},
eventName: {
  fontSize: 16,
  color: '#333',
  flex: 1,
  marginRight: 10,
},
eventStatusBadge: {
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 12,
},
activeBadge: {
  backgroundColor: '#404040',
},
inactiveBadge: {
  backgroundColor: '#8c8c8c',
},
eventStatusText: {
  fontSize: 10,
  color: '#f2f2f2f2',
},
eventDetails: {
  gap: 8,
},
eventTimeRow: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
eventTime: {
  fontSize: 14,
  color: '#666',
},
eventDescription: {
  fontSize: 12,
  color: '#888',
  fontStyle: 'italic',
},
eventDaysContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
},
eventDaysLabel: {
  fontSize: 12,
  color: '#262626',
},
eventDays: {
  fontSize: 12,
  color: '#404040',
  fontWeight: '600',
},


});

export default MainRest;