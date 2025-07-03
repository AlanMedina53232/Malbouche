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
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import AnalogClock from "../../components/analogClock";
import { EventContext } from "../../context/eventContext";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';

const { height } = Dimensions.get("window");

const daysOfWeek = ["Su", "M", "T", "W", "Th", "F", "Sa"];

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

  useEffect(() => {
    fetchMovements();
  }, []);

  useEffect(() => {
    if (event) {
      setEventName(event.name || "");
      setSelectedDays(event.days || []);
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
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/movements`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to fetch movements:", errorData);
        Alert.alert("Error", errorData.error || "Failed to load movements");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setMovements(data.data);
      } else {
        Alert.alert("Error", "Failed to load movements");
      }
    } catch (error) {
      console.error("Error fetching movements:", error);
      Alert.alert("Error", "Failed to load movements");
    }
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
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

    // Prepare data exactly as backend expects for update
    const updatedEvent = {
      nombreEvento: eventName.trim(),
      horaInicio: formatTimeForBackend(startTime),
      horaFin: formatTimeForBackend(endTime),
      diasSemana: selectedDays,
      movementId: movementId.toString(),
      activo: true
    };

    console.log("Updating event with data:", updatedEvent); // Debug log

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "No authentication token found. Please log in again.");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(updatedEvent),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Update local state if using context
        if (setEvents) {
          setEvents((prev) => prev.map((e) => (e.id === event.id ? { ...e, ...updatedEvent } : e)));
        }
        Alert.alert("Success", "Event updated successfully!", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        console.error("Backend update error:", data);
        // Show specific validation errors if available
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map(detail => detail.msg).join('\n');
          Alert.alert("Validation Error", errorMessages);
        } else {
          Alert.alert("Error", data.error || "Failed to update event");
        }
      }
    } catch (error) {
      console.error("Error updating event:", error);
      Alert.alert("Error", "Failed to connect to server");
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
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert("Error", "No authentication token found. Please log in again.");
                return;
              }

              const response = await fetch(`${BACKEND_URL}/events/${event.id}`, {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${token}`,
                },
              });

              const data = await response.json();
              
              if (response.ok && data.success) {
                // Update local state if using context
                if (setEvents) {
                  setEvents((prev) => prev.filter((e) => e.id !== event.id));
                }
                Alert.alert("Success", "Event deleted successfully!", [
                  { text: "OK", onPress: () => navigation.goBack() }
                ]);
              } else {
                console.error("Backend delete error:", data);
                Alert.alert("Error", data.error || "Failed to delete event");
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
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>EDIT EVENT</Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.clockContainer, { height: clockSize }]}>
            <AnalogClock />
          </View>

          <View style={styles.timeRow}>
            <TouchableOpacity
              onPress={() => setShowStartPicker(true)}
              style={styles.timeButton}
            >
              <Text style={styles.timeText}>
                {formatTimeForBackend(startTime)}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              style={styles.timeButton}
            >
              <Text style={styles.timeText}>
                {formatTimeForBackend(endTime)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.daysRow}>
            {daysOfWeek.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day) && styles.daySelected,
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text
                  style={[
                    styles.dayText,
                    selectedDays.includes(day) && styles.dayTextSelected,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formContainer}>
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

            <Text style={styles.inputLabel}>Move Type</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setDropdownVisible(!dropdownVisible)}
              >
                <Text style={styles.dropdownText}>
                  {movements.find(m => m.id === movementId)?.nombre || "Select Movement"}
                </Text>
                <Ionicons
                  name={dropdownVisible ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
              {dropdownVisible && (
                <View style={styles.dropdownList}>
                  {movements.map((movement) => (
                    <TouchableOpacity
                      key={movement.id}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setMovementId(movement.id);
                        setDropdownVisible(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{movement.nombre}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleUpdate}>
              <Text style={styles.createButtonText}>Update Event</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={styles.createButtonText}>Delete Event</Text>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  titleContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
    fontWeight: "600",
  },
  dropdownContainer: {
    position: "relative",
    marginBottom: 15,
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
  createButton: {
    backgroundColor: "#400135",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: "#ff6b6b",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default EditEventModal;