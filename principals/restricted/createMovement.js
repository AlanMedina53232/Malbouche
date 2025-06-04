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

const { height } = Dimensions.get("window")

const CreateMovementScreen = ({ navigation }) => {
  const [moveName, setMoveName] = useState("")
  const [movements, setMovements] = useState([
    { type: "Left", speed: "", time: "" },
    { type: "Right", speed: "", time: "" },
    { type: "Swing", speed: "", time: "" },
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

    const hasValidMovement = movements.some((m) => m.speed && m.time)
    if (!hasValidMovement) {
      Alert.alert("Error", "Please fill at least one movement with speed and time")
      return
    }

    const newMovement = {
      name: moveName,
      movements: movements.filter((m) => m.speed && m.time),
      type: moveType || movements.find((m) => m.speed && m.time)?.type || "Custom",
      speed: movements.find((m) => m.speed)?.speed || "0",
      time: movements.find((m) => m.time)?.time || "0",
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
          <Text style={styles.title}>Create a new move</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.clockContainer, { height: clockSize }]}>
            <AnalogClock />
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Move Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter movement name"
                value={moveName}
                onChangeText={setMoveName}
              />
            </View>

            {movements.map((movement, index) => (
              <View key={index} style={styles.movementRow}>
                <View style={styles.movementType}>
                  <Text style={styles.movementLabel}>{movement.type}</Text>
                </View>
                <View style={styles.inputGroup}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Speed</Text>
                    <TextInput
                      style={styles.smallInput}
                      placeholder="0-100"
                      value={movement.speed}
                      onChangeText={(value) => updateMovement(index, "speed", value)}
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Time (seg)</Text>
                    <TextInput
                      style={styles.smallInput}
                      placeholder="Seconds"
                      value={movement.time}
                      onChangeText={(value) => updateMovement(index, "time", value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Move type</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter move type (optional)"
                value={moveType}
                onChangeText={setMoveType}
              />
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  inputGroup: {
    flex: 1,
    flexDirection: "row",
    gap: 15,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  smallInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 4,
    fontSize: 14,
  },
  createButton: {
    backgroundColor: "#ddd",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
})

export default CreateMovementScreen
