"use client"

import { useState, useContext } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert, SafeAreaView } from "react-native"
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

   const currentUser = {
    id: 1,
    name: 'Almendro Isaac Medina Ramírez',
    email: 'AlmIsaMedRam@gmail.com'
  };

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
    {
      id: 4,
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
    {
      id: 5,
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
    {
      id: 6,
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

  const handlePress = (event) => {
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
      onPress={() => handlePress(item)}
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
          trackColor={{ false: "#e0e0e0", true: "#660154" }}
          thumbColor={item.enabled ? "#ffffff" : "#660154"}
          ios_backgroundColor="#e0e0e0"
        />
      </View>
    </TouchableOpacity>
  )
////
return (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>EVENTS</Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('UserDetail', { user: currentUser })}
        >
          <View style={styles.avatarSmall}>
            <Ionicons name="person" size={20} color="#660154" />
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={localEvents}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={
          <>
            <Text style={styles.subtitle}>{getOngoingEvent()}</Text>
          </>
        }
        contentContainerStyle={styles.eventsList}
        style={styles.eventContainer}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate("NewEventScreen")}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

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
  </SafeAreaView>
)
}

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  safeArea: {
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

  profileButton: {
    marginLeft: 10,
    marginBottom: 10,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
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
  subtitle: {
    fontSize: 25,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 30,
    paddingHorizontal: 20,
    color: "#400135",
  },
  eventsList: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  plus: {
    paddingTop: 40,
    paddingRight: 26,
    alignItems: "flex-end",
  },
  eventContainer:{
    paddingTop: 10,
  },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
   /*     borderWidth: 0.5,
    borderColor: ",rgba(204, 204, 204, 0.3)",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, */
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
  fab: {
    position: "absolute",
    right: 20,
    bottom: 80, // Ajusta según la altura de tu NavigationBar
    backgroundColor: "#400135", // Color que coincide con tu tema
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5, 
    zIndex: 10, // Asegura que esté por encima de otros elementos
  },
})

export default EventsScreen
