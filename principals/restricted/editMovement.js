"use client"

import { useState, useEffect, useLayoutEffect } from "react"
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

const EditMovementScreen = ({ navigation, route }) => {
  const { movement } = route.params || {}

  const [moveName, setMoveName] = useState("")
  const [movements, setMovements] = useState([
    { type: "Left", speed: "", showDropdown: false },
    { type: "Right", speed: "", showDropdown: false },
  ])
  const [moveType, setMoveType] = useState("")

  // Get callbacks from navigation options instead of route.params
  const [handlers, setHandlers] = useState({
    onMovementUpdated: null,
    onMovementDeleted: null,
  })

  useLayoutEffect(() => {
    // This ensures we access the parent screen's handlers safely
    const parentNavigation = navigation.getParent()
    if (!parentNavigation) return

    const parentOptions = parentNavigation.getState().routes.find((route) => route.name === "Movements")?.options || {}

    setHandlers({
      onMovementUpdated: parentOptions.onMovementUpdated,
      onMovementDeleted: parentOptions.onMovementDeleted,
    })
  }, [navigation])

  useEffect(() => {
    if (movement) {
      setMoveName(movement.name || "")
      setMoveType(movement.type || "")

      // Pre-populate with existing movement data
      const updatedMovements = movements.map((m) => {
        if (m.type === movement.type) {
          return {
            ...m,
            speed: movement.speed?.toString() || "",
          }
        }
        return m
      })
      setMovements(updatedMovements)
    }
  }, [movement])

  const updateMovement = (index, field, value) => {
    const updatedMovements = [...movements]
    updatedMovements[index][field] = value
    setMovements(updatedMovements)
  }

  const handleEdit = () => {
    if (!moveName.trim()) {
      Alert.alert("Error", "Please enter a movement name")
      return
    }

    const hasValidMovement = movements.some((m) => m.speed)
    if (!hasValidMovement) {
      Alert.alert("Error", "Please fill at least one movement with speed")
      return
    }

    const updatedMovement = {
      ...movement,
      name: moveName,
      movements: movements.filter((m) => m.speed),
      type: moveType || movements.find((m) => m.speed)?.type || "Custom",
      speed: movements.find((m) => m.speed)?.speed || "0",
    }

    if (handlers.onMovementUpdated) {
      handlers.onMovementUpdated(updatedMovement)
    }

    Alert.alert("Success", "Movement updated successfully!", [{ text: "OK", onPress: () => navigation.goBack() }])
  }

  const handleDelete = () => {
    Alert.alert("Delete Movement", "Are you sure you want to delete this movement? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (handlers.onMovementDeleted) {
            handlers.onMovementDeleted(movement.id)
          }
          navigation.goBack()
        },
      },
    ])
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
        <Text style={styles.title}>Edit Movement</Text>
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
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
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
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 80, // Add padding to avoid content being hidden by navigation bar
  },
  clockContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  formContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  formSection: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
    fontSize: 16,
  },
  movementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  movementType: {
    width: 60,
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
  buttonContainer: {
    flexDirection: "row",
    gap: 15,
    marginTop: 10,
    marginBottom: 20,
  },
  editButton: {
    flex: 1,
    backgroundColor: "#aaa",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#ddd",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginVertical: 16,
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
})

export default EditMovementScreen
