"use client"
import { useState, useLayoutEffect } from "react"
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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import AnalogClock from "../../components/analogClock"
import NavigationBar from "../../components/NavigationBar"
import Slider from "@react-native-community/slider"
import AsyncStorage from '@react-native-async-storage/async-storage';

const { height } = Dimensions.get("window")

const MOVE_TYPES = [
  { label: "Left", value: "Left" },
  { label: "Right", value: "Right" },
]

const CreateMovementScreen = ({ navigation }) => {
  const [moveName, setMoveName] = useState("")
 const [movements, setMovements] = useState([
  { hand: "Hour", type: "Left", speed: "50", angulo: "360", showDropdown: false },
  { hand: "Minute", type: "Right", speed: "50", angulo: "360", showDropdown: false },
])

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api'


  const [moveType, setMoveType] = useState("")

  // Get the callback from navigation options instead of route.params
  useLayoutEffect(() => {
    // This ensures we access the parent screen's handlers safely
    const parentNavigation = navigation.getParent()
    if (!parentNavigation) return

    const parentOptions = parentNavigation.getState().routes.find((route) => route.name === "Movements")?.options || {}

    setOnMovementCreated(() => parentOptions.onMovementCreated)
  }, [navigation])

  const [onMovementCreated, setOnMovementCreated] = useState(null)

  const updateMovement = (index, field, value) => {
    const updatedMovements = [...movements]
    updatedMovements[index][field] = value
    setMovements(updatedMovements)
  }

  const handleCreate = async () => {
    if (!moveName.trim()) {
      Alert.alert("Error", "Please enter a movement name")
      return
    }

    // Only take movements with valid speed
    const validMovements = movements.filter((m) => m.speed)
    if (validMovements.length < 2) {
      Alert.alert("Error", "You must define speed and direction for both hands")
      return
    }

    // Extraer datos para horas y minutos
    const hour = movements.find(m => m.hand === 'Hour')
    const minute = movements.find(m => m.hand === 'Minute')

    // Validate and convert values
    const hourSpeed = parseInt(hour?.speed);
    const minuteSpeed = parseInt(minute?.speed);
    const hourAngulo = parseFloat(hour?.angulo);
    const minuteAngulo = parseFloat(minute?.angulo);

    // Validate converted values
    if (isNaN(hourSpeed) || hourSpeed <= 0 || hourSpeed > 100) {
      Alert.alert("Error", "Hour speed must be between 1 and 100");
      return;
    }

    if (isNaN(minuteSpeed) || minuteSpeed <= 0 || minuteSpeed > 100) {
      Alert.alert("Error", "Minute speed must be between 1 and 100");
      return;
    }

    if (isNaN(hourAngulo) || hourAngulo < 0.1 || hourAngulo > 360) {
      Alert.alert("Error", "Hour angle must be between 0.1 and 360 degrees");
      return;
    }

    if (isNaN(minuteAngulo) || minuteAngulo < 0.1 || minuteAngulo > 360) {
      Alert.alert("Error", "Minute angle must be between 0.1 and 360 degrees");
      return;
    }

    // Validate direction values (backend expects exact strings)
    const hourDirection = hour?.type.toLowerCase() === "left" ? "izquierda" : "derecha";
    const minuteDirection = minute?.type.toLowerCase() === "left" ? "izquierda" : "derecha";

    const movimientoPayload = {
      nombre: moveName.trim(),
      duracion: 10, // Required integer >= 1
      movimiento: {
        direccionGeneral: hourDirection,
        horas: {
          direccion: hourDirection,
          velocidad: hourSpeed, // Integer between 1-100
          angulo: hourAngulo // Float between 0.1-360
        },
        minutos: {
          direccion: minuteDirection,
          velocidad: minuteSpeed, // Integer between 1-100
          angulo: minuteAngulo // Float between 0.1-360
        }
      }
    }

    console.log("=== CREATE MOVEMENT DEBUG START ===");
    console.log("Payload to send:", JSON.stringify(movimientoPayload, null, 2));

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "Authentication token not found. Please log in again.");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/movements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(movimientoPayload),
      })
      const data = await response.json()
      console.log("Response status:", response.status);
      console.log("Response data:", data);
      
      if (!response.ok) {
        console.error("Error creating movement:", data);
        if (data.details) {
          console.log("Validation details:", data.details);
        }
        if (data.errors) {
          console.log("Validation errors:", data.errors);
        }
        Alert.alert("Error", data.error || "Error creating movement")
        return
      }

      console.log("SUCCESS: Movement created successfully");
      console.log("=== CREATE MOVEMENT DEBUG END ===");
      Alert.alert("Success", "Movement created successfully", [
        { text: "OK", onPress: () => navigation.goBack() }
      ])
      if (onMovementCreated) {
        onMovementCreated(movimientoPayload)
      }
    } catch (error) {
      console.error("Fetch error creating movement:", error);
      Alert.alert("Error", "Could not connect to server")
    }
  }

  const clockSize = Math.min(height * 0.22, 180) // Responsive clock size

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <LinearGradient
          colors={['#33002A', 'rgba(102, 1, 84, 0.8)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={[styles.titleGradient, { fontFamily: 'Montserrat_700Bold' }]}>CREATE MOVEMENT</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Reloj estático fuera del scroll */}
        <View style={styles.fixedClockSection}>
          <View style={[styles.fixedClockContainer, { height: clockSize }]}>
            <AnalogClock 
              direction={movements.find(m => m.hand === "Hour")?.type?.toLowerCase() || "left"}
              speed={Number(movements.find(m => m.hand === "Hour")?.speed) || 50}
              minuteDirection={movements.find(m => m.hand === "Minute")?.type?.toLowerCase() || "right"}
              minuteSpeed={Number(movements.find(m => m.hand === "Minute")?.speed) || 50}
            />
          </View>
          
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View >
            <View style={styles.inputContainer}>
              <Text style={[styles.fixedSectionTitle, { fontFamily: 'Montserrat_600SemiBold' }]}>
                Configure Movement Settings
              </Text>
              <Text style={[styles.inputLabel, { fontFamily: 'Montserrat_500Medium' }]}>
                Movement Name<Text style={{ color: "#af0808ff" }}> *</Text>
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="time-outline" size={20} color="#660154" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { fontFamily: 'Montserrat_400Regular' }]}
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
                      color="#660154" 
                    />
                  </View>
                  <View style={styles.movementTitleContainer}>
                    <Text style={[styles.movementTitle, { fontFamily: 'Montserrat_600SemiBold' }]}>
                      {movement.hand} Hand Configuration
                    </Text>
                    <Text style={[styles.movementSubtitle, { fontFamily: 'Montserrat_400Regular' }]}>
                      Set direction, speed and angle
                    </Text>
                  </View>
                </View>

                <View style={styles.movementControls}>
                  <View style={styles.controlSection}>
                    <Text style={[styles.controlLabel, { fontFamily: 'Montserrat_500Medium' }]}>Direction</Text>
                    <View style={styles.dropdownContainer}>
                      <TouchableOpacity
                        style={styles.dropdown}
                        onPress={() => updateMovement(index, "showDropdown", !movement.showDropdown)}
                      >
                        <View style={styles.dropdownContent}>
                          <Ionicons 
                            name={movement.type === 'Left' ? 'arrow-back' : 'arrow-forward'} 
                            size={16} 
                            color="#660154" 
                            style={styles.dropdownIcon}
                          />
                          <Text style={[styles.dropdownText, { fontFamily: 'Montserrat_400Regular' }]}>
                            {MOVE_TYPES.find((t) => t.value === movement.type)?.label || movement.type}
                          </Text>
                        </View>
                        <Ionicons name={movement.showDropdown ? "chevron-up" : "chevron-down"} size={20} color="#660154" />
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
                                color="#660154" 
                                style={{ marginRight: 8 }}
                              />
                              <Text style={[styles.dropdownItemText, { fontFamily: 'Montserrat_400Regular' }]}>
                                {type.label}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.controlSection}>
                    <Text style={[styles.controlLabel, { fontFamily: 'Montserrat_500Medium' }]}>Speed</Text>
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={100}
                        step={1}
                        value={movement.speed ? Number(movement.speed) : 1}
                        onSlidingComplete={(value) => updateMovement(index, "speed", String(value))}
                        minimumTrackTintColor="#660154"
                        maximumTrackTintColor="#ddd"
                        thumbTintColor="#660154"
                      />
                      <View style={styles.sliderValueContainer}>
                        <Text style={[styles.sliderValue, { fontFamily: 'Montserrat_600SemiBold' }]}>
                          {movement.speed || 1}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.controlSection}>
                    <Text style={[styles.controlLabel, { fontFamily: 'Montserrat_500Medium' }]}>Angle (degrees)</Text>
                    <View style={styles.sliderContainer}>
                      <Slider
                        style={styles.slider}
                        minimumValue={0.1}
                        maximumValue={360}
                        step={0.1}
                        value={movement.angulo ? Number(movement.angulo) : 360}
                        onSlidingComplete={(value) => updateMovement(index, "angulo", String(value))}
                        minimumTrackTintColor="#660154"
                        maximumTrackTintColor="#ddd"
                        thumbTintColor="#660154"
                      />
                      <View style={styles.sliderValueContainer}>
                        <Text style={[styles.sliderValue, { fontFamily: 'Montserrat_600SemiBold' }]}>
                          {movement.angulo || 360}°
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.angleDescription, { fontFamily: 'Montserrat_400Regular' }]}>
                      {movement.angulo == 360 ? "Full rotation" : 
                       movement.angulo == 180 ? "Half rotation" : 
                       movement.angulo == 90 ? "Quarter rotation" : 
                       movement.angulo < 90 ? "Oscillation movement" : "Partial rotation"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <View style={styles.buttonContent}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={[styles.createButtonText, { fontFamily: 'Montserrat_700Bold' }]}>
                  Create Movement
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <NavigationBar />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  headerGradient: {
    paddingTop: 38,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
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
    fontSize: 22,
    color: "#fff",
    fontWeight: '700',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 120,
    paddingTop: 300, // Espacio para el reloj fijo
  },
  fixedClockSection: {
    position: 'absolute',
    top: 90, // Debajo del header
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    paddingVertical: 25,
    paddingHorizontal: 20,
    zIndex: 10,
 
  },
  fixedClockContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 55,
    marginBottom: 55,
    width: '100%',

  },
  fixedSectionTitle: {
    fontSize: 18,
    color: "#660154",
    textAlign: 'center',
    marginBottom: 5,
  },
  clockSection: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 5,
    paddingVertical: 15,
  },
  clockContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 25,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 15,
    shadowColor: "#660154",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#333",
  },
  movementCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderColor: "rgba(209, 148, 22, 0.4)",
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: "rgba(102, 1, 84,0.8)",
    elevation: 3,
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
    backgroundColor: 'rgba(102, 1, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  movementTitleContainer: {
    flex: 1,
  },
  movementTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  movementSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  movementControls: {
    gap: 20,
  },
  controlSection: {
    marginBottom: 5,
  },
  controlLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
    fontWeight: "600",
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#f9f9f9",
    shadowColor: "#660154",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    color: "#333",
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 5,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
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
    backgroundColor: 'rgba(102, 1, 84, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  sliderValue: {
    fontSize: 16,
    color: "#660154",
    textAlign: "center",
  },
  angleDescription: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
    marginTop: 8,
    textAlign: "center",
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 8,
  },
  createButton: {
    backgroundColor: "#660154",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#660154",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
  },
})

export default CreateMovementScreen
