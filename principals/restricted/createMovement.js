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
  { hand: "Hour", type: "Left", speed: "", angulo: "360", showDropdown: false },
  { hand: "Minute", type: "Right", speed: "", angulo: "360", showDropdown: false },
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

    // Solo tomamos los movimientos con velocidad válida
    const validMovements = movements.filter((m) => m.speed)
    if (validMovements.length < 2) {
      Alert.alert("Error", "Debes definir velocidad y sentido para ambas manecillas")
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
        Alert.alert("Error", "No se encontró token de autenticación. Por favor inicie sesión nuevamente.");
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
        Alert.alert("Error", data.error || "Error creando movimiento")
        return
      }

      console.log("SUCCESS: Movement created successfully");
      console.log("=== CREATE MOVEMENT DEBUG END ===");
      Alert.alert("Éxito", "Movimiento creado exitosamente", [
        { text: "OK", onPress: () => navigation.goBack() }
      ])
      if (onMovementCreated) {
        onMovementCreated(movimientoPayload)
      }
    } catch (error) {
      console.error("Fetch error creating movement:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor")
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
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.arrowButton}
            onPress={() => navigation.goBack()}>
            <View style={styles.iconSmall}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </View>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>MOVEMENT CREATION</Text>
          </View>
        </View>

        <View style={styles.clockContainer}>
          <AnalogClock 
            direction={moveType.toLowerCase()}
            speed={movements.find(m => m.hand === "Hour")?.speed || 50}
          />
        </View>
        <View style={styles.divider} />
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          scrollEnabled={true}
          >
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Move Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter movement name"
              value={moveName}
              onChangeText={setMoveName}
            />
            {/* Movement controls */}
            {movements.map((movement, index) => (
  <View key={index} style={styles.movementBox}>
    <Text style={styles.movementLabel}>Move type for {movement.hand.toLowerCase()} hand</Text>
    <View style={styles.movementControls}>
      <View style={styles.dropdownRow}>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => updateMovement(index, "showDropdown", !movement.showDropdown)}
          >
            <Text style={styles.dropdownText}>
              {MOVE_TYPES.find((t) => t.value === movement.type)?.label || movement.type}
            </Text>
          </TouchableOpacity>
          {movement.showDropdown && (
            <View style={styles.dropdownList}>
              {MOVE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={styles.dropdownItem}
                  onPress={() => {
                    updateMovement(index, "type", type.value)
                    updateMovement(index, "showDropdown", false)
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
            value={movement.speed ? Number(movement.speed) : 1}
            onSlidingComplete={(value) => updateMovement(index, "speed", String(value))}
            minimumTrackTintColor="#660154"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#660154"
          />
          <Text style={styles.sliderValue}>{movement.speed || 1}</Text>
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
            value={movement.angulo ? Number(movement.angulo) : 360}
            onSlidingComplete={(value) => updateMovement(index, "angulo", String(value))}
            minimumTrackTintColor="#660154"
            maximumTrackTintColor="#ddd"
            thumbTintColor="#660154"
          />
          <Text style={styles.sliderValue}>{movement.angulo || 360}°</Text>
        </View>
        <Text style={styles.angleDescription}>
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
              <Text style={styles.createButtonText}>Create</Text>
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
/*  borderWidth: 0.5,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1, */
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
  createButton: {
    backgroundColor: "#400135",
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,

  },
  createButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.5,
  },
})

export default CreateMovementScreen
