"use client"
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AnalogClock from "../../components/analogClock";
import NavigationBar from "../../components/NavigationBar";
import Slider from "@react-native-community/slider";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';

const { height } = Dimensions.get("window");

const MOVE_TYPES = [
  { label: "Left", value: "Left" },
  { label: "Right", value: "Right" },
];

const EditMovementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { movement } = route.params || {};
  
  const [moveName, setMoveName] = useState("");
  const [movements, setMovements] = useState([
    { hand: "Hour", type: "Left", speed: "", angulo: "360", showDropdown: false },
    { hand: "Minute", type: "Right", speed: "", angulo: "360", showDropdown: false },
  ]);

  // Precargar datos del movimiento
  useEffect(() => {
    if (movement) {
      setMoveName(movement.nombre || "");

      // Load nested movimiento fields according to API_GUIDE structure
      const movimiento = movement.movimiento || {};
      const horas = movimiento.horas || {};
      const minutos = movimiento.minutos || {};

      // Correct mapping according to API_GUIDE: "derecha" = Right, "izquierda" = Left
      const hourType = horas.direccion === "izquierda" ? "Left" : "Right";
      const minuteType = minutos.direccion === "izquierda" ? "Left" : "Right";

      const hourSpeed = horas.velocidad !== undefined ? String(horas.velocidad) : "50";
      const minuteSpeed = minutos.velocidad !== undefined ? String(minutos.velocidad) : "50";
      
      const hourAngulo = horas.angulo !== undefined ? String(horas.angulo) : "360";
      const minuteAngulo = minutos.angulo !== undefined ? String(minutos.angulo) : "360";

      const newMovements = [
        {
          hand: "Hour",
          type: hourType,
          speed: hourSpeed,
          angulo: hourAngulo,
          showDropdown: false,
        },
        {
          hand: "Minute",
          type: minuteType,
          speed: minuteSpeed,
          angulo: minuteAngulo,
          showDropdown: false,
        }
      ];

      setMovements(newMovements);
    }
  }, [movement]);

  const updateMovement = (index, field, value) => {
    const updatedMovements = [...movements];
    updatedMovements[index][field] = value;
    setMovements(updatedMovements);
  };

  // Obtener callbacks del padre de manera segura
  const getParentCallbacks = () => {
    try {
      const parent = navigation.getParent();
      if (!parent) {
        console.log("Warning: No parent navigator found");
        return {};
      }
      const parentState = parent.getState();
      const parentRoute = parentState?.routes.find(r => r.name === "Movements");
      const callbacks = parentRoute?.params || {};
      console.log("Parent callbacks found:", Object.keys(callbacks));
      return callbacks;
    } catch (error) {
      console.log("Error getting parent callbacks:", error);
      return {};
    }
  };

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!moveName.trim()) {
      Alert.alert("Error", "Please enter a movement name");
      return;
    }

    const hasValidMovement = movements.some(m => m.speed && parseInt(m.speed) > 0);
    if (!hasValidMovement) {
      Alert.alert("Error", "Please fill at least one movement with speed greater than 0");
      return;
    }

    // Validate that we have both hour and minute data
    const hour = movements.find(m => m.hand === "Hour");
    const minute = movements.find(m => m.hand === "Minute");
    
    if (!hour || !minute) {
      Alert.alert("Error", "Both hour and minute movements are required");
      return;
    }

    if (!hour.speed || !minute.speed) {
      Alert.alert("Error", "Both hour and minute movements need speed values");
      return;
    }

    setLoading(true);

    // Validate and convert values
    const hourSpeed = parseInt(hour?.speed);
    const minuteSpeed = parseInt(minute?.speed);
    const hourAngulo = parseFloat(hour?.angulo);
    const minuteAngulo = parseFloat(minute?.angulo);

    // Validate converted values according to API_GUIDE specifications
    if (isNaN(hourSpeed) || hourSpeed < 1 || hourSpeed > 100) {
      Alert.alert("Error", "Hour speed must be between 1-100");
      setLoading(false);
      return;
    }

    if (isNaN(minuteSpeed) || minuteSpeed < 1 || minuteSpeed > 100) {
      Alert.alert("Error", "Minute speed must be between 1-100");
      setLoading(false);
      return;
    }

    if (isNaN(hourAngulo) || hourAngulo < 0.1 || hourAngulo > 360) {
      Alert.alert("Error", "Hour angle must be between 0.1-360 degrees");
      setLoading(false);
      return;
    }

    if (isNaN(minuteAngulo) || minuteAngulo < 0.1 || minuteAngulo > 360) {
      Alert.alert("Error", "Minute angle must be between 0.1-360 degrees");
      setLoading(false);
      return;
    }

    if (moveName.trim().length < 2 || moveName.trim().length > 100) {
      Alert.alert("Error", "Movement name must be between 2 and 100 characters");
      setLoading(false);
      return;
    }

    // Validate direction values
    const hourDirection = hour?.type.toLowerCase() === "left" ? "izquierda" : "derecha";
    const minuteDirection = minute?.type.toLowerCase() === "left" ? "izquierda" : "derecha";
    
    if (!["derecha", "izquierda"].includes(hourDirection)) {
      Alert.alert("Error", "Invalid hour direction");
      setLoading(false);
      return;
    }

    if (!["derecha", "izquierda"].includes(minuteDirection)) {
      Alert.alert("Error", "Invalid minute direction");
      setLoading(false);
      return;
    }

    // Build payload according to API_GUIDE structure
    const updatedMovement = {
      nombre: moveName.trim(),
      duracion: movement.duracion || 30,
      movimiento: {
        direccionGeneral: hourDirection,
        horas: {
          direccion: hourDirection,
          velocidad: hourSpeed,
          angulo: hourAngulo
        },
        minutos: {
          direccion: minuteDirection,
          velocidad: minuteSpeed,
          angulo: minuteAngulo
        }
      }
    };

    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert("Error", "No se encontró token de autenticación. Por favor inicie sesión nuevamente.");
        setLoading(false);
        return;
      }

      if (!movement || !movement.id) {
        Alert.alert("Error", "Movement ID is required for update. Please go back and try again.");
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${BACKEND_URL}/movements/${movement.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedMovement)
      });

      const responseText = await response.text();
      
      let data;
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (parseError) {
        if (!response.ok) {
          Alert.alert("Error", `Server error (${response.status}): ${response.statusText}`);
          setLoading(false);
          return;
        }
        data = {};
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${data.error || response.statusText || "Error actualizando movimiento"}`;
        if (data.details) {
          errorMessage += `\nAPI Details: ${data.details}`;
        }
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage += `\nValidation errors: ${data.errors.map(e => e.msg || e.message || e).join(', ')}`;
        }
        
        Alert.alert("API Error", errorMessage);
        setLoading(false);
        return;
      }

      if (data.success === false) {
        let errorMessage = `Backend Error: ${data.error || "Error actualizando movimiento"}`;
        if (data.details) {
          errorMessage += `\nDetails: ${data.details}`;
        }
        
        Alert.alert("Error", errorMessage);
        setLoading(false);
        return;
      }

      const updatedMovementData = data.data || data.movement || data;
      
      const { onMovementUpdated } = getParentCallbacks();
      if (onMovementUpdated) {
        onMovementUpdated({ id: movement.id, ...updatedMovementData });
      }

      Alert.alert("Éxito", "Movimiento actualizado exitosamente", [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          }
        }
      ]);
    } catch (error) {
      console.error("Error updating movement:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Movement",
      "Are you sure you want to delete this movement?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          onPress: async () => {
            setLoading(true);
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert("Error", "No se encontró token de autenticación. Por favor inicie sesión nuevamente.");
                setLoading(false);
                return;
              }

              const response = await fetch(`${BACKEND_URL}/movements/${movement.id}`, {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${token}`
                }
              });

              if (!response.ok) {
                const data = await response.json();
                Alert.alert("Error", data.error || "Error eliminando movimiento");
                setLoading(false);
                return;
              }

              // For DELETE, check if there's response body
              let data = null;
              try {
                const responseText = await response.text();
                if (responseText) {
                  data = JSON.parse(responseText);
                  
                  // Check if backend returned success: false in response body
                  if (data.success === false) {
                    Alert.alert("Error", data.error || "Error eliminando movimiento");
                    setLoading(false);
                    return;
                  }
                }
              } catch (parseError) {
                // Response might be empty for successful delete, which is fine
              }

              const { onMovementDeleted } = getParentCallbacks();
              if (onMovementDeleted) {
                onMovementDeleted(movement.id);
              }

              Alert.alert("Éxito", "Movimiento eliminado exitosamente");
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting movement:", error);
              Alert.alert("Error", "No se pudo conectar con el servidor");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.arrowButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.iconSmall}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </View>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>EDIT MOVEMENT</Text>
          </View>
        </View>

        <View style={styles.clockContainer}>
          <AnalogClock 
            direction={movements[0]?.type?.toLowerCase()}
            speed={parseInt(movements[0]?.speed) || 50}
          />
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Move Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter movement name"
              value={moveName}
              onChangeText={setMoveName}
            />

            {movements.map((movementItem, index) => (
              <View key={`${movementItem.hand}-${index}`} style={styles.movementBox}>
                <Text style={styles.movementLabel}>
                  Move type for {movementItem.hand.toLowerCase()} hand
                </Text>

                <View style={styles.movementControls}>
                  <View style={styles.dropdownRow}>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => updateMovement(index, "showDropdown", !movementItem.showDropdown)}
                      >
                        <Text style={styles.dropdownText}>
                          {MOVE_TYPES.find(t => t.value === movementItem.type)?.label || movementItem.type}
                        </Text>

                      </TouchableOpacity>

                      {movementItem.showDropdown && (
                        <View style={styles.dropdownList}>
                          {MOVE_TYPES.map(type => (
                            <TouchableOpacity
                              key={type.value}
                              style={styles.dropdownItem}
                              onPress={() => {
                                updateMovement(index, "type", type.value);
                                updateMovement(index, "showDropdown", false);
                              }}
                            >
                              <Text style={styles.dropdownText}>{type.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>Speed</Text>
                    <View style={styles.sliderWrapper}>
                      <Slider 
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={100}
                        step={1}
                        value={movementItem.speed ? parseInt(movementItem.speed) : 1}
                        onSlidingComplete={(value) => updateMovement(index, "speed", String(value))}
                        minimumTrackTintColor="#660154"
                        maximumTrackTintColor="#ddd"
                        thumbTintColor="#660154"
                      />
                      <Text style={styles.sliderValue}>{movementItem.speed || 1}</Text>
                    </View>
                  </View>

                  <View style={styles.sliderRow}>
                    <Text style={styles.sliderLabel}>Angle (degrees) - Optional</Text>
                    <View style={styles.sliderWrapper}>
                      <Slider 
                        style={styles.slider}
                        minimumValue={0.1}
                        maximumValue={360}
                        step={0.1}
                        value={movementItem.angulo ? parseFloat(movementItem.angulo) : 360}
                        onSlidingComplete={(value) => updateMovement(index, "angulo", String(value))}
                        minimumTrackTintColor="#660154"
                        maximumTrackTintColor="#ddd"
                        thumbTintColor="#660154"
                      />
                      <Text style={styles.sliderValue}>{movementItem.angulo || 360}°</Text>
                    </View>
                    <Text style={styles.angleDescription}>
                      {movementItem.angulo == 360 ? "Full rotation" : 
                       movementItem.angulo == 180 ? "Half rotation" : 
                       movementItem.angulo == 90 ? "Quarter rotation" : 
                       movementItem.angulo < 90 ? "Oscillation movement" : "Partial rotation"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton, loading && styles.disabledButton]} 
                onPress={handleDelete}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? "Eliminando..." : "Delete"}</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton, loading && styles.disabledButton]} 
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.buttonText}>{loading ? "Guardando..." : "Save Changes"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <NavigationBar />
    </SafeAreaView>
  );
};


// Estilos (los mismos que CreateMovementScreen con pequeños ajustes)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  container: {
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
  arrowButton: {
    marginRight: 10,
    marginBottom: 10,
  },
  iconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  clockContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  divider: {
    borderBottomWidth: 0.6,
    borderBottomColor: '#ddd', 
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  formContainer: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
    marginTop: 5,
  },
  input: {
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 18,
  },
  movementBox: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  movementLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  movementControls: {
    gap: 16,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownContainer: {
    flex: 1,
    position: "relative",
  },
  dropdown: {
    borderWidth: 0.8,
    borderColor: "rgba(204, 204, 204, 0.8)",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
    minWidth: 90,
    zIndex: 2,
  },
  dropdownText: {
    fontSize: 15,
    color: "#333",
  },
  dropdownList: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 0.8,
    borderColor: "rgba(204, 204, 204, 0.8)",
    borderRadius: 5,
    zIndex: 10,
  },
  dropdownItem: {
    padding: 12,
  },
  sliderRow: {
    gap: 8,
  },
  sliderWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sliderLabel: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  slider: {
    flex: 1,
    height: 30,
  },
  sliderValue: {
    width: 40,
    textAlign: "center",
    fontSize: 15,
    color: "#333",
  },
  angleDescription: {
    fontSize: 11,
    color: "#888",
    fontStyle: "italic",
    marginTop: 4,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#400135",
  },
  deleteButton: {
    backgroundColor: "#ff4444",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
})

export default EditMovementScreen