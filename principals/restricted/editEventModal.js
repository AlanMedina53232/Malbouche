"use client"
import React, { useState, useEffect, useContext } from "react";
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
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import AnalogClock from "../../components/analogClock";
import { EventContext } from "../../context/eventContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { updateEvent, deleteEvent, getAllMovements, handleEventConflictError, handleApiError } from '../../utils/apiClient'
import { useEventErrorHandler, showEventConflictAlert } from '../../utils/eventErrorHandler'

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';

const { height } = Dimensions.get("window");

// Backend expects these exact day abbreviations in English
const daysOfWeek = [
  { backend: "Su", display: "Su" },    // Sunday
  { backend: "M", display: "M" },      // Monday
  { backend: "T", display: "T" },      // Tuesday
  { backend: "W", display: "W" },      // Wednesday
  { backend: "Th", display: "Th" },    // Thursday
  { backend: "F", display: "F" },      // Friday
  { backend: "Sa", display: "Sa" }     // Saturday
]

const EditEventModal = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { event } = route.params;
  const { events, setEvents } = useContext(EventContext);

  const [eventName, setEventName] = useState(event?.name || "");
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState(event?.days || []);
  const [movementId, setMovementId] = useState(null);
  const [movements, setMovements] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Use the new error handler hook
  const { handleEventOperationResult } = useEventErrorHandler()

  useEffect(() => {
    fetchMovements();
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  useEffect(() => {
    if (event) {
      setEventName(event.name || "");
      
      // Convert days to valid backend format if needed
      const validDays = (event.days || []).map(day => {
        // Map Spanish abbreviations to English if needed
        const mappings = {
          'L': 'M',    // Lunes -> Monday
          'Ma': 'T',   // Martes -> Tuesday
          'Mi': 'W',   // Miércoles -> Wednesday
          'J': 'Th',   // Jueves -> Thursday
          'V': 'F',    // Viernes -> Friday
          'S': 'Sa',   // Sábado -> Saturday
          'D': 'Su'    // Domingo -> Sunday
        };
        return mappings[day] || day;
      });
      
      setSelectedDays(validDays);
      setMovementId(event.movement?.id || null);

      const parseTime = (timeStr) => {
        if (!timeStr) return new Date();
        try {
          // Handle both 12-hour and 24-hour formats
          const [time, period] = timeStr.includes(' ') ? timeStr.split(" ") : [timeStr, null];
          const [hours, minutes] = time.split(":");
          const date = new Date();
          let hour = parseInt(hours);
          
          if (period) {
            // 12-hour format
            if (period === "PM" && hour !== 12) hour += 12;
            if (period === "AM" && hour === 12) hour = 0;
          }
          
          date.setHours(hour, parseInt(minutes));
          return date;
        } catch {
          return new Date();
        }
      };

      if (event.startTime) setStartTime(parseTime(event.startTime));
      if (event.endTime) setEndTime(parseTime(event.endTime));
    }
  }, [event]);

  const fetchMovements = async () => {
    try {
      const result = await getAllMovements()
      if (result.success) {
        setMovements(result.movements)
      } else {
        Alert.alert("Error", "Failed to load movements")
      }
    } catch (error) {
      console.error("Error fetching movements:", error)
      Alert.alert("Error", "Failed to load movements")
    }
  };

  const toggleDay = (dayBackend) => {
    setSelectedDays((prev) =>
      prev.includes(dayBackend) ? prev.filter((d) => d !== dayBackend) : [...prev, dayBackend]
    );
  };

  // Format time to HH:MM (24-hour format) as expected by backend
  const formatTimeForBackend = (date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleUpdate = async () => {
    // Validate event name (2-100 characters as per backend validation)
    if (!eventName.trim() || eventName.trim().length < 2 || eventName.trim().length > 100) {
      Alert.alert("Error", "Event name must be between 2 and 100 characters");
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert("Error", "Please select at least one day");
      return;
    }

    if (!movementId) {
      Alert.alert("Error", "Please select a movement");
      return;
    }

    // Validate that all selected days match the expected format
    const validDayValues = ["Su", "M", "T", "W", "Th", "F", "Sa"];
    const invalidDays = selectedDays.filter(day => !validDayValues.includes(day));
    
    if (invalidDays.length > 0) {
      Alert.alert("Error", `Invalid day format: ${invalidDays.join(", ")}. Days must be in English format.`);
      return;
    }
    
    // Prepare data exactly as backend expects for update
    const updatedEvent = {
      id: event.id, // Add the ID to ensure backend recognizes the event
      nombreEvento: eventName.trim(),
      horaInicio: formatTimeForBackend(startTime),
      horaFin: formatTimeForBackend(endTime),
      diasSemana: selectedDays,
      movementId: movementId.toString(),
      activo: true
    };

    console.log("Updating event with data:", updatedEvent); // Debug log

    setLoading(true)

    try {
      console.log(`Attempting to update event with ID: ${event.id}`);
      const result = await updateEvent(event.id, updatedEvent)
      
      if (result.success) {
        console.log("Event updated successfully:", result);
        // Update local state if using context
        if (setEvents) {
          setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, ...updatedEvent } : e)));
        }
        Alert.alert("Success", "Event updated successfully!", [
          { 
            text: "OK", 
            onPress: () => {
              // Navigate back to Events screen which will auto-refresh
              navigation.navigate('Events')
            }
          }
        ]);
      } else {
        console.error("Event update failed:", result);
        // Use the new conflict-aware error handling
        const conflictInfo = handleEventConflictError(result)
        
        if (conflictInfo.isConflict) {
          showEventConflictAlert(
            conflictInfo,
            () => navigation.navigate('Events'), // View existing events
            () => {} // Stay in current screen to edit
          )
        } else {
          // Handle other validation errors
          const errorInfo = handleApiError({ response: { data: result } })
          Alert.alert(errorInfo.title, errorInfo.message)
        }
      }
    } catch (error) {
      console.error("Error updating event:", error);
      // More detailed error information
      if (error.response && error.response.data) {
        console.error("Backend error response:", error.response.data);
      }
      Alert.alert("Error", "Failed to connect to server. Please check your connection and try again.");
    } finally {
      setLoading(false)
    }
  };

  const handleDelete = async () => {
    Alert.alert( 
      "Delete Event", 
      "Are you sure you want to delete this event? This action cannot be undone.", 
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deleteEvent(event.id)
              
              if (result.success) {
                // Update local state if using context
                if (setEvents) {
                  setEvents((prev) => prev.filter((e) => e.id !== event.id));
                }
                Alert.alert("Success", "Event deleted successfully!", [
                  { 
                    text: "OK", 
                    onPress: () => {
                      // Navigate back to Events screen which will auto-refresh
                      navigation.navigate('Events')
                    }
                  }
                ]);
              } else {
                Alert.alert("Error", result.error || "Failed to delete event");
              }
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Error", "Failed to connect to server");
            }
          },
        },
      ]
    );
  };

  const clockSize = Math.min(height * 0.25, 200);

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
              <Text style={[styles.titleGradient, { fontFamily: 'Combo_400Regular' }]}>EDIT EVENT</Text>
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
          
            <View style={styles.clockSection}>
            {/*   <View style={styles.clockContainer}>
                <AnalogClock />
              </View> */}
              <Text style={[styles.sectionTitle, { fontFamily: 'Combo_400Regular' }]}>
                Update Event Time
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
                    placeholderTextColor="#bfbfbf"
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
                  options={movements}
                  value={movements.find(m => m.id === movementId)?.nombre || "Select Movement"}
                  onSelect={(value) => setMovementId(value.id)}
                  visible={dropdownVisible}
                  setVisible={setDropdownVisible}
                />
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.deleteButton, loading && styles.deleteButtonDisabled]} 
                onPress={handleDelete}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="trash-outline" size={20} color="#f2f2f2" />
                  <Text style={[styles.deleteButtonText, { fontFamily: 'Combo_400Regular' }]}>
                    {loading ? "Deleting..." : "Delete Event"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.updateButton, loading && styles.updateButtonDisabled]} 
                onPress={handleUpdate}
                disabled={loading}
              >
                <View style={styles.buttonContent}>
                  <Ionicons name="checkmark-outline" size={20} color="#f2f2f2" />
                  <Text style={[styles.updateButtonText, { fontFamily: 'Combo_400Regular' }]}>
                    {loading ? "Updating..." : "Update Event"}
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
              setShowStartPicker(false);
              if (date) setStartTime(date);
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
              setShowEndPicker(false);
              if (date) setEndTime(date);
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Dropdown Component
const Dropdown = ({ options, value, onSelect, visible, setVisible }) => {
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  deleteButton: {
    backgroundColor: "#262626",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#f2f2f2",
    fontSize: 16,
    textAlign: 'center',
  },
  updateButton: {
    backgroundColor: "#404040",
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
  },
  updateButtonDisabled: {
    backgroundColor: "#bfbfbf",
  },
  updateButtonText: {
    color: "#f2f2f2",
    fontSize: 16,
    textAlign: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default EditEventModal;