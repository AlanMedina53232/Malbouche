"use client"

import { useState, useEffect } from "react"
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
  ScrollView
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"
import AnalogClock from "../../components/analogClock"
import Slider from "@react-native-community/slider"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createEvent, getAllMovements, handleEventConflictError, handleApiError } from '../../utils/apiClient'
import { useEventErrorHandler, showEventConflictAlert } from '../../utils/eventErrorHandler'

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api'

const { height } = Dimensions.get("window")

// Backend expects these exact day abbreviations
const daysOfWeek = ["Su", "M", "T", "W", "Th", "F", "Sa"]

const NewEventScreen = ({ navigation }) => {
  const [eventName, setEventName] = useState("")
  const [startTime, setStartTime] = useState(new Date())
  const [endTime, setEndTime] = useState(new Date())
  const [selectedDays, setSelectedDays] = useState([])
  const [selectedMovementId, setSelectedMovementId] = useState(null)
  const [movementOptions, setMovementOptions] = useState([])
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [loading, setLoading] = useState(false)

  // Use the new error handler hook
  const { handleEventOperationResult } = useEventErrorHandler()

  useEffect(() => {
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    try {
      const result = await getAllMovements()
      if (result.success) {
        setMovementOptions(result.movements)
        // Initialize with first movement if available
        if (result.movements.length > 0) {
          setSelectedMovementId(result.movements[0].id)
        }
      } else {
        Alert.alert("Error", "Failed to load movements")
      }
    } catch (error) {
      console.error("Error fetching movements:", error)
      Alert.alert("Error", "Failed to load movements")
    }
  }

  const toggleDay = (day) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  // Format time to HH:MM (24-hour format) as expected by backend
  const formatTimeForBackend = (date) => {
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const handleCreate = async () => {
    // Validate event name (2-100 characters as per backend validation)
    if (!eventName.trim() || eventName.trim().length < 2 || eventName.trim().length > 100) {
      Alert.alert("Error", "Event name must be between 2 and 100 characters")
      return
    }

    // Validate days selection
    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one day")
      return
    }

    // Validate movement selection
    if (!selectedMovementId) {
      Alert.alert("Error", "Please select a movement type")
      return
    }

    // Prepare data exactly as backend expects
    const newEvent = {
      nombreEvento: eventName.trim(),
      horaInicio: formatTimeForBackend(startTime),
      horaFin: formatTimeForBackend(endTime),
      diasSemana: selectedDays, // Send as-is since we're using backend format
      movementId: selectedMovementId.toString(), // Ensure it's a string
      activo: true // Use 'activo' instead of 'enabled' to match backend
    }

    console.log("Sending event data:", newEvent) // Debug log

    setLoading(true)
    
    try {
      const result = await createEvent(newEvent)
      
      if (result.success) {
        Alert.alert("Success", "Event created successfully!", [
          { 
            text: "OK", 
            onPress: () => {
              // Navigate back to Events screen which will auto-refresh
              navigation.navigate('Events')
            }
          }
        ])
      } else {
        // Use the new conflict-aware error handling
        const conflictInfo = handleEventConflictError(result)
        
        if (conflictInfo.isConflict) {
          showEventConflictAlert(
            conflictInfo,
            () => navigation.navigate('Events'), // View existing events
            null // Don't provide edit option for new event
          )
        } else {
          // Handle other validation errors
          const errorInfo = handleApiError({ response: { data: result } })
          Alert.alert(errorInfo.title, errorInfo.message)
        }
      }
    } catch (error) {
      console.error("Error creating event:", error)
      Alert.alert("Error", "Failed to connect to server")
    } finally {
      setLoading(false)
    }
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
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.iconSmall}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </View>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>NEW EVENT</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={[styles.clockContainer, { height: clockSize }]}>
            <AnalogClock />
          </View>

          <View style={styles.timeRow}>
            <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.timeButton}>
              <Text style={styles.timeText}>
                {formatTimeForBackend(startTime)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.timeButton}>
              <Text style={styles.timeText}>
                {formatTimeForBackend(endTime)}
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

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formGroupLabel}>Event Details</Text>
                
                <View style={styles.formColumn}>
                  <Text style={styles.inputLabel}>Event Name (2-100 characters)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter event name"
                    value={eventName}
                    onChangeText={setEventName}
                    maxLength={100}
                  />
                  <Text style={styles.characterCount}>
                    {eventName.length}/100 characters
                  </Text>
                </View>

                <View style={styles.formColumn}>
                  <Text style={styles.inputLabel}>Move Type</Text>
                  <Dropdown
                    options={movementOptions}
                    value={movementOptions.find(m => m.id === selectedMovementId)?.nombre || "Select Movement"}
                    onSelect={(value) => setSelectedMovementId(value.id)}
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.createButton, loading && styles.createButtonDisabled]} 
                onPress={handleCreate}
                disabled={loading}
              >
                <Text style={styles.createButtonText}>
                  {loading ? "Creating..." : "Create event"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {showStartPicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            display="default"
            is24Hour={true}
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
            is24Hour={true}
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
        <Ionicons name={visible ? "chevron-up" : "chevron-down"} size={20} color="#666" />
      </TouchableOpacity>
      {visible && (
        <View style={styles.dropdownList}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.dropdownItem}
              onPress={() => {
                onSelect(option)
                setVisible(false)
              }}
            >
              <Text style={styles.dropdownItemText}>{option.nombre}</Text>
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
    backgroundColor: "rgba(64, 1, 53, 0.2)",
  },
  daySelected: {
    backgroundColor: "#400135",
  },
  dayText: {
    color: "#400135",
    fontWeight: "600",
    fontSize: 14,
  },
  dayTextSelected: {
    color: "#fff",
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  formContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  input: {
    borderRadius: 6,
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
    marginBottom: 10,
  },
  dropdownContainer: {
    position: "relative",
  },
  dropdown: {
    borderRadius: 6,
    paddingVertical: 15,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
    borderRadius: 6,
    zIndex: 1000,
    marginTop: 5,
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
  formGroup: {
    marginBottom: 20,
  },
  formGroupLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  formColumn: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  createButton: {
    backgroundColor: "#400135",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 5,
  },
  createButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
})

export default NewEventScreen