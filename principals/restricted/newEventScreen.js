"use client"

import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Dimensions,
  Alert,
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"
import AnalogClock from "../../components/analogClock"

const { height } = Dimensions.get("window")

const daysOfWeek = ["S", "M", "T", "W", "Th", "F", "S"]
const moveOptions = ["Left", "Right", "Swings", "Crazy"]

const NewEventScreen = ({ navigation }) => {
  const [eventName, setEventName] = useState("")
  const [startTime, setStartTime] = useState(new Date())
  const [endTime, setEndTime] = useState(new Date())
  const [selectedDays, setSelectedDays] = useState([])
  const [movements, setMovements] = useState([
    { type: "Left", speed: "", time: "" },
    { type: "Right", speed: "", time: "" },
  ])

  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)

  const toggleDay = (day) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const updateMovement = (index, field, value) => {
    const updatedMovements = [...movements]
    updatedMovements[index] = { ...updatedMovements[index], [field]: value }
    setMovements(updatedMovements)
  }

  const handleCreate = () => {
    if (!eventName.trim()) {
      Alert.alert("Error", "Please enter an event name")
      return
    }

    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one day")
      return
    }

    const newEvent = {
      id: Date.now(),
      name: eventName,
      startTime: startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      endTime: endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      days: selectedDays,
      movements: movements.filter((m) => m.speed && m.time),
      enabled: true,
    }

    Alert.alert("Success", "Event created successfully!", [{ text: "OK", onPress: () => navigation.goBack() }])
  }

  const clockSize = Math.min(height * 0.25, 200)

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
          <Text style={styles.title}>Create Event</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.clockContainer, { height: clockSize }]}>
            <AnalogClock />
          </View>

          <View style={styles.timeRow}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.timeButton}>
              <Text style={styles.timeText}>
                {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.timeButton}>
              <Text style={styles.timeText}>
                {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.daysRow}>
            {daysOfWeek.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.dayButton, selectedDays.includes(day) && styles.daySelected]}
                onPress={() => toggleDay(day)}
              >
                <Text style={[styles.dayText, selectedDays.includes(day) && styles.dayTextSelected]}>{day}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formContainer}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Event Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter event name"
                value={eventName}
                onChangeText={setEventName}
              />
            </View>

            {movements.map((movement, index) => (
              <View key={index} style={styles.movementRow}>
                <View style={styles.movementType}>
                  <Text style={styles.movementLabel}>Move type</Text>
                  <Dropdown
                    options={moveOptions}
                    value={movement.type}
                    onSelect={(value) => updateMovement(index, "type", value)}
                  />
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

            <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
              <Text style={styles.createButtonText}>Create event</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display="default"
            onChange={(event, date) => {
              setShowStartPicker(false)
              if (date) setStartTime(date)
            }}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            display="default"
            onChange={(event, date) => {
              setShowEndPicker(false)
              if (date) setEndTime(date)
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// Dropdown Component
const Dropdown = ({ options, value, onSelect }) => {
  const [visible, setVisible] = useState(false)

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.dropdown}>
        <Text style={styles.dropdownText}>{value}</Text>
        <Ionicons name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>
      {visible && (
        <View style={styles.dropdownList}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(option)
                setVisible(false)
              }}
            >
              <Text style={styles.dropdownItemText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
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
    paddingBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
    color: "#333",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  clockContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  timeButton: {
    alignItems: "center",
  },
  timeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  dayButton: {
    width: 35,
    height: 35,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  daySelected: {
    backgroundColor: "#333",
  },
  dayText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 14,
  },
  dayTextSelected: {
    color: "#fff",
  },
  formContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  formSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
    fontSize: 16,
  },
  movementRow: {
    marginBottom: 15,
  },
  movementType: {
    marginBottom: 8,
  },
  movementLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 5,
  },
  inputGroup: {
    flexDirection: "row",
    gap: 15,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 3,
  },
  smallInput: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 6,
    fontSize: 14,
  },
  dropdownContainer: {
    position: "relative",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingVertical: 8,
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  createButton: {
    backgroundColor: "#ddd",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 15,
    marginBottom: 20,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
})

export default NewEventScreen
