"use client"

import { useState, useContext } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert } from "react-native"
import { useNavigation } from "@react-navigation/native"
import { EventContext } from "../../context/eventContext"
import { Ionicons } from "@expo/vector-icons"
import NavigationBar from "../../components/NavigationBar"
import EditEventModal from "./editEventModal"

const EventsScreen = () => {
  const navigation = useNavigation()
  const { events, setEvents } = useContext(EventContext)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)

  // Sample events data matching the mockup
  const [localEvents, setLocalEvents] = useState([
    {
      id: 1,
      name: "Crazy Time",
      startTime: "09:00 PM",
      endTime: "10:00 PM",
      days: ["Monday"],
      enabled: true,
      movements: [
        { type: "Left", speed: "50", time: "10" },
        { type: "Right", speed: "75", time: "15" },
      ],
    },
    {
      id: 2,
      name: "Happy Time",
      startTime: "09:00 PM",
      endTime: "10:00 PM",
      days: ["M", "T", "W", "S"],
      enabled: true,
      movements: [
        { type: "Swings", speed: "60", time: "20" },
        { type: "Crazy", speed: "80", time: "25" },
      ],
    },
    {
      id: 3,
      name: "Good Time",
      startTime: "09:00 PM",
      endTime: "10:00 PM",
      days: ["All week"],
      enabled: false,
      movements: [
        { type: "Left", speed: "40", time: "12" },
        { type: "Right", speed: "55", time: "18" },
      ],
    },
  ])

  const toggleEventStatus = (eventId) => {
    setLocalEvents((prevEvents) =>
      prevEvents.map((event) => (event.id === eventId ? { ...event, enabled: !event.enabled } : event)),
    )
  }

  const handleLongPress = (event) => {
    setSelectedEvent(event)
    setEditModalVisible(true)
  }

  const handleUpdateEvent = (updatedEvent) => {
    setLocalEvents((prevEvents) => prevEvents.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)))
    setEditModalVisible(false)
    setSelectedEvent(null)
  }

  const handleDeleteEvent = (eventId) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setLocalEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId))
          setEditModalVisible(false)
          setSelectedEvent(null)
        },
      },
    ])
  }

  const getOngoingEvent = () => {
    const ongoingEvent = localEvents.find((event) => event.enabled)
    return ongoingEvent ? `The ${ongoingEvent.name} event is ongoing` : "No ongoing event"
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.eventCard}
      onLongPress={() => handleLongPress(item)}
      delayLongPress={500}
      activeOpacity={0.7}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventInfo}>
          <Text style={styles.eventName}>{item.name}</Text>
          <Text style={styles.eventTime}>
            {item.startTime} - {item.endTime}
          </Text>
          <Text style={styles.eventDays}>{item.days.join(" ")}</Text>
        </View>
        <Switch
          value={item.enabled}
          onValueChange={() => toggleEventStatus(item.id)}
          trackColor={{ false: "#e0e0e0", true: "#ffd474" }}
          thumbColor={item.enabled ? "#ffffff" : "#f4f3f4"}
          ios_backgroundColor="#e0e0e0"
        />
      </View>
    </TouchableOpacity>
  )
////
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Events</Text>
      </View>

      <Text style={styles.subtitle}>{getOngoingEvent()}</Text>

      <View style={styles.plus}>
        <TouchableOpacity onPress={() => navigation.navigate("NewEventScreen")}>
          <Ionicons name="add" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.eventContainer}>
        <FlatList
          data={localEvents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
       />
      </View>
      

      <EditEventModal
        visible={editModalVisible}
        event={selectedEvent}
        onClose={() => {
          setEditModalVisible(false)
          setSelectedEvent(null)
        }}
        onUpdate={handleUpdateEvent}
        onDelete={handleDeleteEvent}
      />

      <NavigationBar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fdffff"
  },
  header: {
   
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 45,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 15,
    position: "relative",

  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 20,
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    color: "#333",
  },
  eventsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  plus: {
    paddingTop: 40,
    paddingRight: 26,
    alignItems: "flex-end",
  },
  eventContainer:{
    paddingTop: 15,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  eventDays: {
    fontSize: 14,
    color: "#666",
  },
})

export default EventsScreen
