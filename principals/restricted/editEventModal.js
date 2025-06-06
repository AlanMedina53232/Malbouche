"use client"

import { useState, useEffect, useRef } from "react"
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import AnalogClock from "../../components/analogClock"

const EditEventModal = ({ visible, event, onClose, onUpdate, onDelete }) => {
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
  const [screenData, setScreenData] = useState(Dimensions.get("window"))
  const scrollViewRef = useRef(null)

  const daysOfWeek = ["S", "M", "T", "W", "Th", "F", "S"]
  const moveOptions = ["Left", "Right", "Swings", "Crazy"]

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setScreenData(window)
    })
    return () => subscription?.remove()
  }, [])

  useEffect(() => {
    if (event) {
      setEventName(event.name || "")
      setSelectedDays(event.days || [])
      setMovements(
        event.movements || [
          { type: "Left", speed: "", time: "" },
          { type: "Right", speed: "", time: "" },
        ],
      )

      // Parse time strings
      const parseTime = (timeStr) => {
        try {
          const [time, period] = timeStr.split(" ")
          const [hours, minutes] = time.split(":")
          const date = new Date()
          let hour = Number.parseInt(hours, 10)

          if (period === "PM" && hour !== 12) hour += 12
          else if (period === "AM" && hour === 12) hour = 0

          date.setHours(hour, Number.parseInt(minutes, 10), 0)
          return date
        } catch {
          return new Date()
        }
      }

      if (event.startTime) setStartTime(parseTime(event.startTime))
      if (event.endTime) setEndTime(parseTime(event.endTime))
    }
  }, [event])

  const toggleDay = (day) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const updateMovement = (index, field, value) => {
    const updated = [...movements]
    updated[index] = { ...updated[index], [field]: value }
    setMovements(updated)
  }

  const handleUpdate = () => {
    if (!eventName.trim()) {
      Alert.alert("Error", "Please enter an event name")
      return
    }

    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one day")
      return
    }

    const updatedEvent = {
      ...event,
      name: eventName,
      startTime: startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      endTime: endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      days: selectedDays,
      movements: movements.filter((m) => m.speed && m.time),
    }

    onUpdate(updatedEvent)
  }

  const handleDelete = () => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(event.id) },
    ])
  }

  if (!event) return null

  // Calculate dimensions for modal
  const isLandscape = screenData.width > screenData.height
  const availableHeight = screenData.height * (isLandscape ? 0.9 : 0.85)
  const modalWidth = Math.min(screenData.width * 0.92, 450)

  // Calculate content height for proper scrolling
  const headerHeight = 60
  const buttonsHeight = 70
  const contentHeight = availableHeight - headerHeight - buttonsHeight

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeContainer}>
        <KeyboardAvoidingView style={styles.keyboardContainer} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.overlay}>
            <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
              <View
                style={[
                  styles.modal,
                  {
                    width: modalWidth,
                    height: availableHeight,
                  },
                ]}
              >
                <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                  {/* Fixed Header */}
                  <View style={[styles.header, { height: headerHeight }]}>
                    <Text style={styles.title}>Edit Event</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                      <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>

                  {/* Scrollable Content with fixed height */}
                  <ScrollView
                    ref={scrollViewRef}
                    style={[styles.content, { height: contentHeight }]}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                    scrollEventThrottle={16}
                  >
                    {/* Clock Section */}
                    <View style={styles.clockSection}>
                      <View style={styles.clockWrapper}>
                        <AnalogClock />
                      </View>
                      <View style={styles.timeRow}>
                        <TouchableOpacity onPress={() => setShowStartPicker(true)} style={styles.timeBtn}>
                          <Text style={styles.timeText}>
                            {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.timeBtn}>
                          <Text style={styles.timeText}>
                            {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Days Selection */}
                    <View style={styles.daysSection}>
                      <View style={styles.daysRow}>
                        {daysOfWeek.map((day, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[styles.dayBtn, selectedDays.includes(day) && styles.daySelected]}
                            onPress={() => toggleDay(day)}
                          >
                            <Text style={[styles.dayText, selectedDays.includes(day) && styles.dayTextSelected]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Event Name */}
                    <View style={styles.section}>
                      <Text style={styles.label}>Event Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter event name"
                        value={eventName}
                        onChangeText={setEventName}
                        placeholderTextColor="#999"
                        onFocus={() => {
                          setTimeout(() => {
                            scrollViewRef.current?.scrollTo({ y: 200, animated: true })
                          }, 100)
                        }}
                      />
                    </View>

                    {/* Movements */}
                    {movements.map((movement, index) => (
                      <View key={index} style={styles.movementSection}>
                        <Text style={styles.label}>Move type</Text>
                        <EnhancedDropdown
                          options={moveOptions}
                          value={movement.type}
                          onSelect={(value) => updateMovement(index, "type", value)}
                        />
                        <View style={styles.inputRow}>
                          <View style={styles.inputHalf}>
                            <Text style={styles.smallLabel}>Speed</Text>
                            <TextInput
                              style={styles.smallInput}
                              placeholder="0-100"
                              value={movement.speed}
                              onChangeText={(value) => updateMovement(index, "speed", value)}
                              keyboardType="numeric"
                              placeholderTextColor="#999"
                              onFocus={() => {
                                setTimeout(() => {
                                  scrollViewRef.current?.scrollTo({ y: 300 + index * 200, animated: true })
                                }, 100)
                              }}
                            />
                          </View>
                          <View style={styles.inputHalf}>
                            <Text style={styles.smallLabel}>Time (seg)</Text>
                            <TextInput
                              style={styles.smallInput}
                              placeholder="Seconds"
                              value={movement.time}
                              onChangeText={(value) => updateMovement(index, "time", value)}
                              keyboardType="numeric"
                              placeholderTextColor="#999"
                              onFocus={() => {
                                setTimeout(() => {
                                  scrollViewRef.current?.scrollTo({ y: 300 + index * 200, animated: true })
                                }, 100)
                              }}
                            />
                          </View>
                        </View>
                      </View>
                    ))}

                    {/* Bottom padding for comfortable scrolling */}
                    <View style={styles.bottomPadding} />
                  </ScrollView>

                  {/* Fixed Action Buttons */}
                  <View style={[styles.actions, { height: buttonsHeight }]}>
                    <TouchableOpacity style={styles.updateBtn} onPress={handleUpdate}>
                      <Text style={styles.updateText}>Update Event</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Time Pickers */}
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
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  )
}

// Enhanced Dropdown Component
const EnhancedDropdown = ({ options, value, onSelect }) => {
  const [visible, setVisible] = useState(false)

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity onPress={() => setVisible(!visible)} style={styles.dropdown}>
        <Text style={styles.dropdownText}>{value}</Text>
        <Ionicons name={visible ? "chevron-up" : "chevron-down"} size={20} color="#666" />
      </TouchableOpacity>
      {visible && (
        <View style={styles.dropdownList}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option}
              style={[styles.dropdownItem, index === options.length - 1 && styles.dropdownItemLast]}
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
  safeContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  backdrop: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: "#f8f9fa",
  },
  content: {
    backgroundColor: "#fff",
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  clockSection: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 20,
  },
  clockWrapper: {
    height: 160,
    width: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 30,
  },
  timeBtn: {
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    minWidth: 90,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  daysSection: {
    marginBottom: 24,
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  dayBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderWidth: 2,
    borderColor: "transparent",
  },
  daySelected: {
    backgroundColor: "#333",
    borderColor: "#333",
  },
  dayText: {
    color: "#666",
    fontWeight: "600",
    fontSize: 14,
  },
  dayTextSelected: {
    color: "#fff",
  },
  section: {
    marginBottom: 20,
  },
  movementSection: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  smallLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  inputHalf: {
    flex: 1,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#333",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownContainer: {
    position: "relative",
    zIndex: 1000,
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  dropdownList: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    marginTop: 4,
    zIndex: 2000,
    elevation: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  bottomPadding: {
    height: 40,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  updateBtn: {
    flex: 1,
    backgroundColor: "#ddd",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  updateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: "#ff6b6b",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
})

export default EditEventModal
