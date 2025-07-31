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
      console.log("=== LOADING MOVEMENT DATA DEBUG START ===");
      console.log("1. Original movement object:", JSON.stringify(movement, null, 2));

      setMoveName(movement.nombre || "");

      // Load nested movimiento fields according to API_GUIDE structure
      const movimiento = movement.movimiento || {};
      const horas = movimiento.horas || {};
      const minutos = movimiento.minutos || {};

      console.log("2. Extracted movimiento:", movimiento);
      console.log("3. Extracted horas:", horas);
      console.log("4. Extracted minutos:", minutos);

      const hourType = horas.direccion === "izquierda" ? "Left" : "Right";
      const minuteType = minutos.direccion === "izquierda" ? "Left" : "Right";

      const hourSpeed = horas.velocidad !== undefined ? String(horas.velocidad) : "50";
      const minuteSpeed = minutos.velocidad !== undefined ? String(minutos.velocidad) : "50";
      
      const hourAngulo = horas.angulo !== undefined ? String(horas.angulo) : "360";
      const minuteAngulo = minutos.angulo !== undefined ? String(minutos.angulo) : "360";

      console.log("5. Mapped values:");
      console.log("   - hourType:", hourType, "from direccion:", horas.direccion);
      console.log("   - minuteType:", minuteType, "from direccion:", minutos.direccion);
      console.log("   - hourSpeed:", hourSpeed, "from velocidad:", horas.velocidad);
      console.log("   - minuteSpeed:", minuteSpeed, "from velocidad:", minutos.velocidad);
      console.log("   - hourAngulo:", hourAngulo, "from angulo:", horas.angulo);
      console.log("   - minuteAngulo:", minuteAngulo, "from angulo:", minutos.angulo);

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

      console.log("6. Final movements state to set:", newMovements);
      setMovements(newMovements);
      console.log("=== LOADING MOVEMENT DATA DEBUG END ===");
    }
  }, [movement]);

  const updateMovement = (index, field, value) => {
    const updatedMovements = [...movements];
    updatedMovements[index][field] = value;
    setMovements(updatedMovements);
  };

  // Obtener callbacks del padre de manera segura
  const getParentCallbacks = () => {
    const parent = navigation.getParent();
    if (!parent) return {};
    const parentState = parent.getState();
    const parentRoute = parentState?.routes.find(r => r.name === "Movements");
    return parentRoute?.params || {};
  };

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    console.log("=== EDIT MOVEMENT DEBUG START ===");
    console.log("1. Movement name:", moveName);
    console.log("2. Movements state:", movements);
    
    if (!moveName.trim()) {
      Alert.alert("Error", "Please enter a movement name");
      return;
    }

    const hasValidMovement = movements.some(m => m.speed && parseInt(m.speed) > 0);
    if (!hasValidMovement) {
      console.log("2.1. ERROR: No valid movement with speed > 0");
      Alert.alert("Error", "Please fill at least one movement with speed greater than 0");
      return;
    }

    // Validate that we have both hour and minute data
    const hour = movements.find(m => m.hand === "Hour");
    const minute = movements.find(m => m.hand === "Minute");
    
    if (!hour || !minute) {
      console.log("2.2. ERROR: Missing hour or minute data");
      Alert.alert("Error", "Both hour and minute movements are required");
      return;
    }

    if (!hour.speed || !minute.speed) {
      console.log("2.3. ERROR: Missing speed for hour or minute");
      Alert.alert("Error", "Both hour and minute movements need speed values");
      return;
    }

    setLoading(true);

    console.log("3. Hour data:", hour);
    console.log("4. Minute data:", minute);

    // Validate and convert values
    const hourSpeed = parseInt(hour?.speed);
    const minuteSpeed = parseInt(minute?.speed);
    const hourAngulo = parseFloat(hour?.angulo);
    const minuteAngulo = parseFloat(minute?.angulo);

    // Validate converted values according to API_GUIDE specifications
    if (isNaN(hourSpeed) || hourSpeed < 1 || hourSpeed > 100) {
      console.log("4.1. ERROR: Invalid hour speed:", hourSpeed);
      Alert.alert("Error", "Hour speed must be between 1-100 (API_GUIDE specification)");
      setLoading(false);
      return;
    }

    if (isNaN(minuteSpeed) || minuteSpeed < 1 || minuteSpeed > 100) {
      console.log("4.2. ERROR: Invalid minute speed:", minuteSpeed);
      Alert.alert("Error", "Minute speed must be between 1-100 (API_GUIDE specification)");
      setLoading(false);
      return;
    }

    if (isNaN(hourAngulo) || hourAngulo < 0.1 || hourAngulo > 360) {
      console.log("4.3. ERROR: Invalid hour angle:", hourAngulo);
      Alert.alert("Error", "Hour angle must be between 0.1-360 degrees (API_GUIDE specification)");
      setLoading(false);
      return;
    }

    if (isNaN(minuteAngulo) || minuteAngulo < 0.1 || minuteAngulo > 360) {
      console.log("4.4. ERROR: Invalid minute angle:", minuteAngulo);
      Alert.alert("Error", "Minute angle must be between 0.1-360 degrees (API_GUIDE specification)");
      setLoading(false);
      return;
    }

    console.log("4.5. Validated values:");
    console.log("   - hourSpeed:", hourSpeed);
    console.log("   - minuteSpeed:", minuteSpeed);
    console.log("   - hourAngulo:", hourAngulo);
    console.log("   - minuteAngulo:", minuteAngulo);

    // Additional validation for API_GUIDE compliance
    if (moveName.trim().length < 2 || moveName.trim().length > 100) {
      console.log("4.6. ERROR: Invalid name length:", moveName.trim().length);
      Alert.alert("Error", "Movement name must be between 2 and 100 characters (API_GUIDE requirement)");
      setLoading(false);
      return;
    }

    // Validate direction values (API_GUIDE expects exact strings: "derecha" or "izquierda")
    const hourDirection = hour?.type.toLowerCase() === "left" ? "izquierda" : "derecha";
    const minuteDirection = minute?.type.toLowerCase() === "left" ? "izquierda" : "derecha";
    
    if (!["derecha", "izquierda"].includes(hourDirection)) {
      console.log("4.7. ERROR: Invalid hour direction:", hourDirection);
      Alert.alert("Error", "Invalid hour direction - must be 'derecha' or 'izquierda'");
      setLoading(false);
      return;
    }

    if (!["derecha", "izquierda"].includes(minuteDirection)) {
      console.log("4.8. ERROR: Invalid minute direction:", minuteDirection);
      Alert.alert("Error", "Invalid minute direction - must be 'derecha' or 'izquierda'");
      setLoading(false);
      return;
    }

    console.log("4.9. API_GUIDE validation passed successfully");
    console.log("   - hourDirection:", hourDirection, "(API_GUIDE: 'derecha' or 'izquierda')");
    console.log("   - minuteDirection:", minuteDirection, "(API_GUIDE: 'derecha' or 'izquierda')");

    // Build payload according to API_GUIDE structure
    // For UPDATE (PUT), all fields are optional, but if provided must meet validation requirements
    const updatedMovement = {
      nombre: moveName.trim(), // 2-100 characters, optional but included if changed
      duracion: movement.duracion || 30, // Keep existing duration or default, positive integer
      movimiento: {
        direccionGeneral: hourDirection, // "derecha" or "izquierda"
        horas: {
          direccion: hourDirection, // "derecha" or "izquierda"
          velocidad: hourSpeed, // Integer 1-100
          angulo: hourAngulo, // Float 0.1-360 (degrees of rotation)
        },
        minutos: {
          direccion: minuteDirection, // "derecha" or "izquierda"
          velocidad: minuteSpeed, // Integer 1-100
          angulo: minuteAngulo, // Float 0.1-360 (degrees of rotation)
        }
      }
    };

    console.log("5. Final payload to send:", JSON.stringify(updatedMovement, null, 2));

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log("6. ERROR: No auth token found");
        Alert.alert("Error", "No se encontró token de autenticación. Por favor inicie sesión nuevamente.");
        setLoading(false);
        return;
      }

      console.log("7. Token found, checking movement ID:", movement.id);
      
      if (!movement.id) {
        console.log("7.1. ERROR: Movement ID is missing");
        Alert.alert("Error", "Movement ID is required for update");
        setLoading(false);
        return;
      }
      
      console.log("7.2. Making API request to:", `${BACKEND_URL}/movements/${movement.id}`);
      
      const response = await fetch(`${BACKEND_URL}/movements/${movement.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedMovement)
      });

      console.log("8. Response status:", response.status);
      console.log("9. Response ok:", response.ok);
      console.log("9.1. Response headers:", response.headers);

      const data = await response.json();
      console.log("10. Response data:", data);

      if (!response.ok) {
        console.log("11. ERROR: API request failed - not matching API_GUIDE requirements");
        console.log("12. Error details:", data.error || "Unknown error");
        if (data.details) {
          console.log("12.1. API_GUIDE validation details:", data.details);
        }
        if (data.errors) {
          console.log("12.2. API_GUIDE validation errors array:", data.errors);
        }
        
        // More specific error message referencing API_GUIDE
        let errorMessage = `API_GUIDE Error: ${data.error || "Error actualizando movimiento"}`;
        if (data.details) {
          errorMessage += `\nAPI Details: ${data.details}`;
        }
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage += `\nValidation errors (see API_GUIDE): ${data.errors.map(e => e.msg || e.message || e).join(', ')}`;
        }
        
        Alert.alert("API_GUIDE Validation Error", errorMessage);
        setLoading(false);
        return;
      }

      console.log("13. SUCCESS: Movement updated successfully according to API_GUIDE");

      const { onMovementUpdated } = getParentCallbacks();
      if (onMovementUpdated) {
        console.log("14. Calling parent callback with:", { id: movement.id, ...updatedMovement });
        onMovementUpdated({ id: movement.id, ...updatedMovement });
      }

      Alert.alert("Éxito", "Movimiento actualizado exitosamente");
      navigation.goBack();
    } catch (error) {
      console.log("15. FETCH ERROR:", error);
      console.error("Error updating movement:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
      console.log("=== EDIT MOVEMENT DEBUG END ===");
    }
  };

  const handleDelete = () => {
    console.log("=== DELETE MOVEMENT DEBUG START ===");
    console.log("1. Movement to delete:", movement);
    
    Alert.alert(
      "Delete Movement",
      "Are you sure you want to delete this movement?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          onPress: async () => {
            console.log("2. User confirmed deletion");
            setLoading(true);
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                console.log("3. ERROR: No auth token found");
                Alert.alert("Error", "No se encontró token de autenticación. Por favor inicie sesión nuevamente.");
                setLoading(false);
                return;
              }

              console.log("4. Making DELETE request to:", `${BACKEND_URL}/movements/${movement.id}`);

              const response = await fetch(`${BACKEND_URL}/movements/${movement.id}`, {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${token}`
                }
              });

              console.log("5. DELETE response status:", response.status);
              console.log("6. DELETE response ok:", response.ok);

              if (!response.ok) {
                const data = await response.json();
                console.log("7. DELETE ERROR response data:", data);
                Alert.alert("Error", data.error || "Error eliminando movimiento");
                setLoading(false);
                return;
              }

              console.log("8. DELETE SUCCESS");

              const { onMovementDeleted } = getParentCallbacks();
              if (onMovementDeleted) {
                console.log("9. Calling parent callback with movement id:", movement.id);
                onMovementDeleted(movement.id);
              }

              Alert.alert("Éxito", "Movimiento eliminado exitosamente");
              navigation.goBack();
            } catch (error) {
              console.log("10. DELETE FETCH ERROR:", error);
              console.error("Error deleting movement:", error);
              Alert.alert("Error", "No se pudo conectar con el servidor");
            } finally {
              setLoading(false);
              console.log("=== DELETE MOVEMENT DEBUG END ===");
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
                style={[styles.actionButton, styles.deleteButton]} 
                onPress={handleDelete}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]} 
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
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
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#400135",
  },
  deleteButton: {
    backgroundColor: "#ff4444",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
})

export default EditMovementScreen