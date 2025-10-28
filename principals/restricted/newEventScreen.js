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
  FlatList,
  Keyboard,
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Use the new error handler hook
  const { handleEventOperationResult } = useEventErrorHandler()

  useEffect(() => {
    fetchMovements()
  }, [])

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

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
              <Text style={[styles.titleGradient, { fontFamily: 'Combo_400Regular' }]}>NEW EVENT</Text>
            </View>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={[
            styles.scrollContainer,
            { flexGrow: 1, paddingBottom: keyboardVisible ? 24 : 100 }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={true} 
        >
          <View >
            <View style={styles.clockSection}>
             {/*  <View style={[styles.clockContainer, { height: clockSize }, { marginTop: 35 }]}>
                <AnalogClock />
              </View> */}
              <Text style={[styles.sectionTitle, { fontFamily: 'Combo_400Regular' }]}>
                Set Event Time
              </Text>
            </View>

            <View style={styles.timeSection}>
              <Text style={[styles.sectionLabel, { fontFamily: 'Combo_400Regular' }]}>Time Range</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeInputContainer}>
                  <Text style={[styles.timeLabel, { fontFamily: 'Combo_400Regular' }]}>Start Time</Text>
                  <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.timeButton}>
                    <Ionicons name="time-outline" size={20} color="#404040" style={styles.timeIcon} />
                    <Text style={[styles.timeText, { fontFamily: 'Combo_400Regular' }]}>
                      {formatTimeForBackend(startTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.timeInputContainer}>
                  <Text style={[styles.timeLabel, { fontFamily: 'Combo_400Regular' }]}>End Time</Text>
                  <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.timeButton}>
                    <Ionicons name="time-outline" size={20} color="#404040" style={styles.timeIcon} />
                    <Text style={[styles.timeText, { fontFamily: 'Combo_400Regular' }]}>
                      {formatTimeForBackend(endTime)}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.daysSection}>
              <Text style={[styles.sectionLabel, { fontFamily: 'Combo_400Regular' }]}>Days of Week</Text>
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
                      { fontFamily: 'Combo_400Regular' }
                    ]}>
                      {day.display}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsSection}>
              <Text style={[styles.sectionTitle, { fontFamily: 'Combo_400Regular' }]}>Event Details</Text>
              
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { fontFamily: 'Combo_400Regular' }]}>
                  Event Name<Text style={{ color: "#af0808ff" }}> *</Text>
                </Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="calendar-outline" size={20} color="#404040" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { fontFamily: 'Combo_400Regular' }]}
                    placeholder="Enter event name"
                    placeholderTextColor="#999"
                    value={eventName}
                    onChangeText={setEventName}
                    maxLength={100}
                  />
                </View>
                <Text style={[styles.characterCount, { fontFamily: 'Combo_400Regular' }]}>
                  {eventName.length}/100 characters
                </Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { fontFamily: 'Combo_400Regular' }]}>Movement Type</Text>
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
                <Ionicons name="checkmark-outline" size={20} color="#f2f2f2" />
                <Text style={[styles.createButtonText, { fontFamily: 'Combo_400Regular' }]}>
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
          <Ionicons name="settings-outline" size={20} color="#404040" style={styles.dropdownIcon} />
          <Text style={[styles.dropdownText, { fontFamily: 'Combo_400Regular' }]}>{value}</Text>
        </View>
        <Ionicons name={visible ? "chevron-up" : "chevron-down"} size={20} color="#404040" />
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
                <Text style={[styles.dropdownItemText, { fontFamily: 'Combo_400Regular' }]}>{option.nombre}</Text>
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
    paddingBottom: 100,
  },
  formContainer: {
    backgroundColor: "#f2f2f2",
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
    marginBottom: 15,
    width: '100%',
    height: 160,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 25,
    color: "#f2f2f2",
    textAlign: 'center',
    marginBottom: 10,
  },
  timeSection: {
    marginBottom: 25,
  },
  sectionLabel: {
    fontSize: 20,
    color: "#f2f2f2",
    marginBottom: 15,
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
    fontSize: 18,
    color: "#f2f2f2",
    marginBottom: 8,
    textAlign: 'center',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: "#f2f2f2",

  },
  timeIcon: {
    marginRight: 8,
  },
  timeText: {
    fontSize: 18,
    color: "#2e2e2e",
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
    borderColor: "#bfbfbf",
  },
  daySelected: {
    backgroundColor: "#262626",
    borderColor: "#262626",
  },
  dayText: {
    color: "#f2f2f2",
    fontSize: 12,
  },
  dayTextSelected: {
    color: "#f2f2f2",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: '#f2f2f2',
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
    fontSize: 18,
    color: "#f2f2f2",
    marginBottom: 8,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
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
  characterCount: {
    fontSize: 12,
    color: "#bfbfbf",
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
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#f2f2f2",
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
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 200,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 15,
    borderRadius: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#8c8c8c",
    backgroundColor: "#F2F2F2",
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#404040",
  },

  createButton: {
    backgroundColor: "#262626",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },

  createButtonDisabled: {
    backgroundColor: "#bfbfbf",
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  createButtonText: {
    color: "#f2f2f2",
    fontSize: 18,
    marginLeft: 8,
  },
})

export default NewEventScreen