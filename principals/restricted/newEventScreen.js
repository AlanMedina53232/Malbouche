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
  ScrollView,
  FlatList
} from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"
import AnalogClock from "../../components/analogClock"
import Slider from "@react-native-community/slider"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createEvent, getAllMovements, handleEventConflictError, handleApiError } from '../../utils/apiClient'
import { useEventErrorHandler, showEventConflictAlert } from '../../utils/eventErrorHandler'
import { LinearGradient } from 'expo-linear-gradient'

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api'

const { height } = Dimensions.get("window")

// Backend expects these exact day abbreviations - updated to English display
const daysOfWeek = [
  { backend: "Su", display: "Su" },    // Sunday
  { backend: "M", display: "M" },      // Monday
  { backend: "T", display: "T" },      // Tuesday
  { backend: "W", display: "W" },      // Wednesday
  { backend: "Th", display: "Th" },    // Thursday
  { backend: "F", display: "F" },      // Friday
  { backend: "Sa", display: "Sa" }     // Saturday
]
 
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

  const toggleDay = (dayBackend) => {
    setSelectedDays((prev) => (prev.includes(dayBackend) ? prev.filter((d) => d !== dayBackend) : [...prev, dayBackend]))
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

  const clockSize = Math.min(height * 0.18, 160)

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
              <Text style={[styles.titleGradient, { fontFamily: 'Montserrat_700Bold' }]}>NEW EVENT</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View >
            <View style={styles.clockSection}>
             {/*  <View style={[styles.clockContainer, { height: clockSize }, { marginTop: 35 }]}>
                <AnalogClock />
              </View> */}
              <Text style={[styles.sectionTitle, { fontFamily: 'Montserrat_600SemiBold' }]}>
                Set Event Time
              </Text>
            </View>

            <View style={styles.timeSection}>
              <Text style={[styles.sectionLabel, { fontFamily: 'Montserrat_500Medium' }]}>Time Range</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeInputContainer}>
                  <Text style={[styles.timeLabel, { fontFamily: 'Montserrat_400Regular' }]}>Start Time</Text>
                  <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.timeButton}>
                    <Ionicons name="time-outline" size={20} color="#660154" style={styles.timeIcon} />
                    <Text style={[styles.timeText, { fontFamily: 'Montserrat_600SemiBold' }]}>
                      {formatTimeForBackend(startTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timeInputContainer}>
                  <Text style={[styles.timeLabel, { fontFamily: 'Montserrat_400Regular' }]}>End Time</Text>
                  <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.timeButton}>
                    <Ionicons name="time-outline" size={20} color="#660154" style={styles.timeIcon} />
                    <Text style={[styles.timeText, { fontFamily: 'Montserrat_600SemiBold' }]}>
                      {formatTimeForBackend(endTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.daysSection}>
              <Text style={[styles.sectionLabel, { fontFamily: 'Montserrat_500Medium' }]}>Days of Week</Text>
              <View style={styles.daysRow}>
                {daysOfWeek.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.dayButton, selectedDays.includes(day.backend) && styles.daySelected]}
                    onPress={() => toggleDay(day.backend)}
                  >
                    <Text style={[
                      styles.dayText, 
                      selectedDays.includes(day.backend) && styles.dayTextSelected,
                      { fontFamily: 'Montserrat_600SemiBold' }
                    ]}>
                      {day.display}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsSection}>
              <Text style={[styles.sectionTitle, { fontFamily: 'Montserrat_600SemiBold' }]}>Event Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { fontFamily: 'Montserrat_500Medium' }]}>
                  Event Name<Text style={{ color: "#af0808ff" }}> *</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-outline" size={20} color="#660154" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { fontFamily: 'Montserrat_400Regular' }]}
                    placeholder="Enter event name"
                    placeholderTextColor="#999"
                    value={eventName}
                    onChangeText={setEventName}
                    maxLength={100}
                  />
                </View>
                <Text style={[styles.characterCount, { fontFamily: 'Montserrat_400Regular' }]}>
                  {eventName.length}/100 characters
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { fontFamily: 'Montserrat_500Medium' }]}>Movement Type</Text>
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
              <View style={styles.buttonContent}>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={[styles.createButtonText, { fontFamily: 'Montserrat_700Bold' }]}>
                  {loading ? "Creating..." : "Create Event"}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

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
        <View style={styles.dropdownContent}>
          <Ionicons name="settings-outline" size={20} color="#660154" style={styles.dropdownIcon} />
          <Text style={[styles.dropdownText, { fontFamily: 'Montserrat_400Regular' }]}>{value}</Text>
        </View>
        <Ionicons name={visible ? "chevron-up" : "chevron-down"} size={20} color="#660154" />
      </TouchableOpacity>
      {visible && (
        <View style={styles.dropdownList}>
          <ScrollView 
            nestedScrollEnabled={true}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            overScrollMode="never"
            scrollEnabled={true}
            style={{ flex: 1 }}
          >
            {options.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.dropdownItem,
                  index === options.length - 1 && styles.dropdownItemLast
                ]}
                onPress={() => {
                  onSelect(option)
                  setVisible(false)
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownItemText, { fontFamily: 'Montserrat_400Regular' }]}>{option.nombre}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
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
    paddingBottom: 100,
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

  clockSection: {
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5,
    paddingVertical: 10,
  },

  clockContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 55,
    width: '100%',
    paddingHorizontal: 20,
  },

  sectionTitle: {
    fontSize: 20,
    color: "#660154",
    textAlign: 'center',
    marginBottom: 10,
   
  },

  timeSection: {
    marginBottom: 25,
  },

  sectionLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 15,
    fontWeight: "600",
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },

  timeInputContainer: {
    flex: 1,
  },

  timeLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    textAlign: 'center',
  },

  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f9f9f9",
    shadowColor: "#660154",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  timeIcon: {
    marginRight: 8,
  },

  timeText: {
    fontSize: 16,
    color: "#333",
  },

  daysSection: {
    marginBottom: 25,
  },

  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },

  dayButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#ddd",
  },

  daySelected: {
    backgroundColor: "#660154",
    borderColor: "#660154",
  },

  dayText: {
    color: "#666",
    fontSize: 12,
  },

  dayTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: 'rgba(209, 148, 22, 0.3)',
    marginBottom: 10,
    marginHorizontal: 10,
  },

  detailsSection: {
    marginBottom: 20,
    marginTop: 10,
  },

  inputContainer: {
    marginBottom: 20,
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

  characterCount: {
    fontSize: 12,
    color: "#666",
    textAlign: 'right',
    marginTop: 5,
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
    maxHeight: 200,
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

  createButton: {
    backgroundColor: "#660154",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#660154",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  createButtonDisabled: {
    backgroundColor: "#999",
    shadowColor: "#999",
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

export default NewEventScreen