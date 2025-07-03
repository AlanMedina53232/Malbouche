
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



const { height } = Dimensions.get("window")

const daysOfWeek = ["Su", "M", "T", "W", "Th", "F", "Sa"]

const NewEventScreen = ({ navigation }) => {
  const [eventName, setEventName] = useState("")
  const [startTime, setStartTime] = useState(new Date())
  const [endTime, setEndTime] = useState(new Date())
  const [selectedDays, setSelectedDays] = useState([])
  const [movements, setMovements] = useState([
    { id: null, speed: 50, time: "" },
    { id: null, speed: 50, time: "" },
  ])
  const [movementOptions, setMovementOptions] = useState([]) // fetched movements from backend
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [showMovementTimePicker, setShowMovementTimePicker] = useState(false)
  const [movementTimePickerIndex, setMovementTimePickerIndex] = useState(null)

  useEffect(() => {
    fetchMovements()
  }, [])

  const fetchMovements = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch("https://malbouche-backend.onrender.com/api/movements", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        setMovementOptions(data.data)
        // Initialize movements with first movement id if available
        setMovements((prev) =>
          prev.map((m) => ({
            ...m,
            id: data.data.length > 0 ? data.data[0].id : null,
          }))
        )
      } else {
        Alert.alert("Error", "Failed to load movements")
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load movements")
    }
  }

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

    // Validate movements have id and time
    for (const m of movements) {
      if (!m.id) {
        Alert.alert("Error", "Please select a movement type")
        return
      }
      if (!m.time) {
        Alert.alert("Error", "Please enter time for all movements")
        return
      }
    }

    const newEvent = {
      id: Date.now(),
      name: eventName,
      startTime: startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      endTime: endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      days: selectedDays,
      movements: movements
        .filter((m) => m.speed !== undefined && m.time)
        .map((m) => ({
          id: m.id,
          speed: m.speed.toString(),
          time: m.time,
        })),
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
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.formGroupLabel}>Event Details</Text>
                <View style={styles.formColumn}>
                  <Text style={styles.inputLabel}>Event Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter event name"
                    value={eventName}
                    onChangeText={setEventName}
                  />
                </View>

                <View style={styles.formColumn}>
                  <Text style={styles.inputLabel}>Move Type</Text>
                  <Dropdown
                    options={movementOptions}
                    value={movementOptions.find(m => m.id === movements[0].id)?.nombre || ""}
                    onSelect={(value) => updateMovement(0, "id", value.id)}
                  />
                </View>

                <View style={styles.formColumn}>
                  <Text style={styles.inputLabel}>Speed</Text>
                  <View style={styles.sliderContainer}>
                    <View style={styles.sliderBox}>
                      <Text style={styles.sliderLabel}>Speed</Text>
                      <Slider
                        style={styles.slider}
                        minimumValue={1}
                        maximumValue={100}
                        step={1}
                        value={movements[0].speed}
                        onSlidingComplete={(value) => updateMovement(0, "speed", value)}
                        minimumTrackTintColor="#000"
                        maximumTrackTintColor="#aaa"
                        thumbTintColor="#660154"
                      />
                      <Text style={{ textAlign: "center", fontWeight: "bold" }}>{movements[0].speed}</Text>
                    </View>
                  </View>
                </View>

              </View>

              <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
                <Text style={styles.createButtonText}>Create event</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

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
  formContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 10,
  },
 input: {
    borderRadius: 6,
    backgroundColor: "#fff",
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 5,
  },
  dropdownContainer: {
    position: "relative",
  },
  dropdown: {
    borderRadius: 6,
    paddingVertical: 15,
    paddingHorizontal: 5,
    backgroundColor: "#fff",
    minWidth: 90,
    zIndex: 2,
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
  /*   borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    elevation: 2, */
    zIndex: 1000,
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
createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  sliderContainer: {
    width: "100%",
    alignItems: "center",
  },
  sliderBox: {
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
    marginTop: 10,
    elevation: 2,
    overflow: "hidden",
  },
  sliderLabel: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  slider: {
    width: "85%",
    height: 30,
    alignSelf: "center",
  },
})

export default NewEventScreen
