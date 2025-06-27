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

const { height } = Dimensions.get("window")

const MOVE_TYPES = [
  { label: "Left", value: "Left" },
  { label: "Right", value: "Right" },
]

const CreateMovementScreen = ({ navigation }) => {
  const [moveName, setMoveName] = useState("")
 const [movements, setMovements] = useState([
  { hand: "Hour", type: "Left", speed: "", showDropdown: false },
  { hand: "Minute", type: "Right", speed: "", showDropdown: false },
])

const eventInfo = {
  
}

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

  const handleCreate = () => {
    if (!moveName.trim()) {
      Alert.alert("Error", "Please enter a movement name")
      return
    }

    const hasValidMovement = movements.some((m) => m.speed)
    if (!hasValidMovement) {
      Alert.alert("Error", "Please fill at least one movement with speed")
      return
    }

    const newMovement = {
      name: moveName,
      movements: movements.filter((m) => m.speed),
      type: moveType || movements.find((m) => m.speed)?.type || "Custom",
      speed: movements.find((m) => m.speed)?.speed || "0",
    }

    if (onMovementCreated) {
      onMovementCreated(newMovement)
    }

    Alert.alert("Success", "Movement created successfully!", [{ text: "OK", onPress: () => navigation.goBack() }])
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
      <View pointerEvents="box-only" style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Speed</Text>
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
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
 /*    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2, */
  },
  dropdownItem: {
    padding: 12,
  },
  sliderContainer: {
    flex: 2,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginLeft: 10,
  },
  sliderLabel: {
    fontSize: 13,
    color: "#666",
    marginRight: 5,
  },
  slider: {
    flex: 1,
    height: 30,
    marginHorizontal: 6,
  },
  sliderValue: {
    width: 32,
    textAlign: "center",
    fontSize: 15,
    color: "#333",
    marginLeft: 4,
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
