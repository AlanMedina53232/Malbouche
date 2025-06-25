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
    { type: "Left", speed: "", showDropdown: false },
    { type: "Right", speed: "", showDropdown: false },
  ])
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>Create a new move</Text>
        <View style={styles.clockContainer}>
          <AnalogClock />
        </View>
        <View style={styles.divider} />
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
              <Text style={styles.movementLabel}>Move type for the {movement.type.toLowerCase()}</Text>
              <View style={styles.dropdownRow}>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => updateMovement(index, "showDropdown", !movement.showDropdown)}
                  >
                    <Text style={styles.dropdownText}>{MOVE_TYPES.find((t) => t.value === movement.type)?.label || movement.type}</Text>
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
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Speed</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={100}
                    step={1}
                    value={movement.speed ? Number(movement.speed) : 1}
                    onValueChange={(value) => updateMovement(index, "speed", String(value))}
                    minimumTrackTintColor="#8c0200"
                    maximumTrackTintColor="#ddd"
                    thumbTintColor="#8c0200"
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
        <NavigationBar />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 10 : 60,
    paddingBottom: 0,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 0,
    color: "#111",
  },
  clockContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    marginTop: 5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 16,
  },
  formContainer: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 2,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
    marginTop: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
    fontSize: 16,
    marginBottom: 18,
  },
  movementBox: {
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
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
    zIndex: 2,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
    minWidth: 90,
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
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: "#8c0200",
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  createButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.5,
  },
})

export default CreateMovementScreen
