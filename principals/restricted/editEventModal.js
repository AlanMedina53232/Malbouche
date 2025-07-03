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
          const [time, period] = timeStr.split(" ");
          const [hours, minutes] = time.split(":");
          const date = new Date();
          let hour = parseInt(hours);
          if (period === "PM" && hour !== 12) hour += 12;
          if (period === "AM" && hour === 12) hour = 0;
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
      const response = await fetch("https://malbouche-backend.onrender.com/api/movements", {
        Authorization: `Bearer ${token}`,
      });
      const data = await response.json();
      if (data.success) {
        setMovements(data.data);
      } else {
        Alert.alert("Error", "Failed to load movements");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load movements");
    }
  };

  const toggleDay = (day) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleUpdate = async () => {
    if (!eventName.trim()) {
      Alert.alert("Error", "Please enter an event name");
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

    const updatedEvent = {
      ...event,
      name: eventName,
      startTime: startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      endTime: endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      days: selectedDays,
      movementId,
    };

    try {
      const response = await fetch(`http://localhost:3000/api/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer your_token_here",
        },
        body: JSON.stringify(updatedEvent),
      });
      const data = await response.json();
      if (data.success) {
        setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? updatedEvent : e)));
        navigation.goBack();
      } else {
        Alert.alert("Error", "Failed to update event");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update event");
    }
  };

  const handleDelete = async () => {
    Alert.alert("Delete Event", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`http://localhost:3000/api/events/${event.id}`, {
              method: "DELETE",
              headers: {
                Authorization: "Bearer your_token_here",
              },
            });
            const data = await response.json();
            if (data.success) {
              setEvents((prev) => prev.filter((e) => e.id !== event.id));
              navigation.goBack();
            } else {
              Alert.alert("Error", "Failed to delete event");
            }
          } catch (error) {
            Alert.alert("Error", "Failed to delete event");
          }
        },
      },
    ]);
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
                {startTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowEndPicker(true)}
              style={styles.timeButton}
            >
              <Text style={styles.timeText}>
                {endTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
            <Text style={styles.inputLabel}>Event Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter event name"
              value={eventName}
              onChangeText={setEventName}
            />

            <Text style={styles.inputLabel}>Move Type</Text>
            <View style={styles.dropdownContainer}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setDropdownVisible(!dropdownVisible)}
              >
                <Text>{movements.find(m => m.id === movementId)?.nombre || "Select Movement"}</Text>
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
              style={[styles.createButton, { backgroundColor: "#ff6b6b" }]}
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
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
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
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

export default EditEventModal;
