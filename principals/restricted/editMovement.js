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
import { LinearGradient } from "expo-linear-gradient";
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
        Alert.alert("Error", "Authentication token not found. Please log in again.");
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
        let errorMessage = `HTTP ${response.status}: ${data.error || response.statusText || "Error updating movement"}`;
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
        let errorMessage = `Backend Error: ${data.error || "Error updating movement"}`;
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

      Alert.alert("Success", "Movement updated successfully", [
        {
          text: "OK",
          onPress: () => {
            navigation.goBack();
          }
        }
      ]);
    } catch (error) {
      console.error("Error updating movement:", error);
      Alert.alert("Error", "Could not connect to server");
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
                Alert.alert("Error", "Authentication token not found. Please log in again.");
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
                Alert.alert("Error", data.error || "Error deleting movement");
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
                    Alert.alert("Error", data.error || "Error deleting movement");
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

              Alert.alert("Success", "Movement deleted successfully");
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting movement:", error);
              Alert.alert("Error", "Could not connect to server");
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
        behavior="padding"            // Android: deja que el sistema haga resize
        style={styles.container}
        keyboardVerticalOffset={0}
      >
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
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#f2f2f2" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={[styles.titleGradient, { fontFamily: 'Combo_400Regular' }]}>EDIT MOVEMENT</Text>
            </View>
          </View>
            <View style={[styles.fixedClockContainer, { height: Math.min(height * 0.22, 180) }]}>
              <View style={styles.clockScaleWrapper}>
                <AnalogClock 
                  direction={movements.find(m => m.hand === "Hour")?.type?.toLowerCase() || "left"}
                  speed={Number(movements.find(m => m.hand === "Hour")?.speed) || 50}
                  minuteDirection={movements.find(m => m.hand === "Minute")?.type?.toLowerCase() || "right"}
                  minuteSpeed={Number(movements.find(m => m.hand === "Minute")?.speed) || 50}
                />
              </View>
            </View>
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            <View style={styles.inputContainer}>
              <Text style={[styles.fixedSectionTitle, { fontFamily: 'Combo_400Regular' }]}>
                Configure Movement Settings
              </Text>
              <Text style={[styles.inputLabel, { fontFamily: 'Combo_400Regular' }]}>
                Movement Name<Text style={{ color: "#631b1bff" }}> *</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="time-outline" size={20} color="#404040" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { fontFamily: 'Combo_400Regular' }]}
                  placeholder="Enter movement name"
                  placeholderTextColor="#999"
                  value={moveName}
                  onChangeText={setMoveName}
                />
              </View>
            </View>

            {/* Movement controls */}
            {movements.map((movement, index) => (
              <View key={index} style={styles.movementCard}>
                <View style={styles.movementHeader}>
                  <View style={styles.movementIcon}>
                    <Ionicons 
                      name={movement.hand === 'Hour' ? 'time-outline' : 'time-outline'} 
                      size={24} 
                      color="#404040" 
                    />
                  </View>
                  <View style={styles.movementTitleContainer}>
                    <Text style={[styles.movementTitle, { fontFamily: 'Combo_400Regular' }]}>
                      {movement.hand} Hand Configuration
                    </Text>
                    <Text style={[styles.movementSubtitle, { fontFamily: 'Combo_400Regular' }]}>
                      Set direction, speed and angle
                    </Text>
                  </View>
                </View>

                <View style={styles.movementControls}>
                  <View style={styles.controlSection}>
                    <Text style={[styles.controlLabel, { fontFamily: 'Combo_400Regular' }]}>Direction</Text>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => updateMovement(index, "showDropdown", !movement.showDropdown)}
                      >
                        <View style={styles.dropdownContent}>
                          <Ionicons 
                            name={movement.type === 'Left' ? 'arrow-back' : 'arrow-forward'} 
                            size={16} 
                            color="#404040" 
                            style={styles.dropdownIcon}
                          />
                          <Text style={[styles.dropdownText, { fontFamily: 'Combo_400Regular' }]}>
                            {MOVE_TYPES.find((t) => t.value === movement.type)?.label || movement.type}
                          </Text>
                        </View>
                        <Ionicons name={movement.showDropdown ? "chevron-up" : "chevron-down"} size={20} color="#404040" />
                      </TouchableOpacity>
                      {movement.showDropdown && (
                        <View style={styles.dropdownList}>
                          {MOVE_TYPES.map((type, typeIndex) => (
                            <TouchableOpacity
                              key={type.value}
                              style={[
                                styles.dropdownItem,
                                typeIndex === MOVE_TYPES.length - 1 && styles.dropdownItemLast
                              ]}
                              onPress={() => {
                                updateMovement(index, "type", type.value)
                                updateMovement(index, "showDropdown", false)
                              }}
                            >
                              <Ionicons 
                                name={type.value === 'Left' ? 'arrow-back' : 'arrow-forward'} 
                                size={16} 
                                color="#404040" 
                                style={{ marginRight: 8 }}
                              />
                              <Text style={[styles.dropdownItemText, { fontFamily: 'Combo_400Regular' }]}>
                                {type.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.controlSection}>
                    <Text style={[styles.controlLabel, { fontFamily: 'Combo_400Regular' }]}>Speed</Text>
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={100}
                        step={1}
                        value={movement.speed ? Number(movement.speed) : 1}
                        onSlidingComplete={(value) => updateMovement(index, "speed", String(value))}
                        minimumTrackTintColor="#404040"
                        maximumTrackTintColor="#f2f2f2"
                        thumbTintColor="#2e2e2e"
                      />
                      <View style={styles.sliderValueContainer}>
                        <Text style={[styles.sliderValue, { fontFamily: 'Combo_400Regular' }]}>
                          {movement.speed || 1}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.controlSection}>
                    <Text style={[styles.controlLabel, { fontFamily: 'Combo_400Regular' }]}>Angle (degrees)</Text>
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.slider}
                        minimumValue={0.1}
                        maximumValue={360}
                        step={0.1}
                        value={movement.angulo ? Number(movement.angulo) : 360}
                        onSlidingComplete={(value) => updateMovement(index, "angulo", String(value))}
                        minimumTrackTintColor="#404040"
                        maximumTrackTintColor="#f2f2f2"
                        thumbTintColor="#2e2e2e"
                      />
                      <View style={styles.sliderValueContainer}>
                        <Text style={[styles.sliderValue, { fontFamily: 'Combo_400Regular' }]}>
                          {movement.angulo || 360}°
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.angleDescription, { fontFamily: 'Combo_400Regular' }]}>
                      {movement.angulo == 360 ? "Full rotation" : 
                       movement.angulo == 180 ? "Half rotation" : 
                       movement.angulo == 90 ? "Quarter rotation" : 
                       movement.angulo < 90 ? "Oscillation movement" : "Partial rotation"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.deleteButton, loading && styles.disabledButton]} 
                onPress={handleDelete}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="trash-outline" size={20} color="#f2f2f2" />
                  <Text style={[styles.buttonText, { fontFamily: 'Combo_400Regular' }]}>
                    {loading ? "Deleting..." : "Delete Movement"}
                  </Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.saveButton, loading && styles.disabledButton]} 
                onPress={handleSave}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="checkmark-outline" size={20} color="#f2f2f2" />
                  <Text style={[styles.buttonText, { fontFamily: 'Combo_400Regular' }]}>
                    {loading ? "Saving..." : "Save Changes"}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
 {/*      <NavigationBar /> */}
    </SafeAreaView>
  );
};


// Styles matching createMovement.js design
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 38,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  arrowButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40,
  },
  titleGradient: {
    fontSize: 25,
    color: "#f2f2f2",
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 120,
  },
  fixedClockSection: {
    position: 'absolute',
    top: 90, 
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  fixedClockContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    marginBottom: 20,
    width: '100%',
  },
  clockScaleWrapper: {
    transform: [{ scale: 0.85 }], // ajusta 0.7–0.95 según necesites
  },
  fixedSectionTitle: {
    fontSize: 18,
    color: "#f2f2f2",
    textAlign: 'center',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 18,
    color: "#bfbfbf",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: "#f2f2f2e7",
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#404040",
  },
  movementCard: {
    backgroundColor: "#f2f2f2a7",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  movementHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  movementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8c8c8c8f',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  movementTitleContainer: {
    flex: 1,
  },
  movementTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#404040",
    marginBottom: 4,
  },
  movementSubtitle: {
    fontSize: 14,
    color: "#404040",
  },
  movementControls: {
    gap: 20,
  },
  controlSection: {
    marginBottom: 5,
  },
  controlLabel: {
    fontSize: 16,
    color: "#404040",
    marginBottom: 12,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#f2f2f2d3",
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownIcon: {
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: "#404040",
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: "#f2f2f2",
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 120,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#8c8c8c",
    backgroundColor: "#f2f2f2",
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#404040",
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValueContainer: {
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8c8c8c8f',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sliderValue: {
    fontSize: 16,
    color: "#404040",
    textAlign: "center",
  },
  angleDescription: {
    fontSize: 12,
    color: "#404040",
    marginTop: 8,
    textAlign: "center",
    backgroundColor: "#f2f2f2",
    padding: 8,
    borderRadius: 8,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 25,
    gap: 15,
  },
  deleteButton: {
    backgroundColor: "#262626",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
  },
  saveButton: {
    backgroundColor: "#404040",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: "#F2F2F2",
    fontSize: 16,
    marginLeft: 8,
  },
})

export default EditMovementScreen