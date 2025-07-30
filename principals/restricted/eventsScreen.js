"use client"

import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert, SafeAreaView, ActivityIndicator } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from "@react-navigation/native"
import { EventContext } from "../../context/eventContext"
import { Ionicons } from "@expo/vector-icons"
import NavigationBar from "../../components/NavigationBar"

const API_BASE_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api' // Fallback if env not set

const EventsScreen = () => {
  const navigation = useNavigation()
  // const { events, setEvents } = useContext(EventContext)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingEvents, setUpdatingEvents] = useState(new Set()) // Track which events are being updated

  const [localEvents, setLocalEvents] = useState([])

  const currentUser = {
    id: 1,
    name: 'Almendro Isaac Medina Ramírez',
    email: 'AlmIsaMedRam@gmail.com'
  };

  useEffect(() => {
    fetchData()
  }, [])

const fetchData = async () => {
    try {
      setLoading(true)
      setLocalEvents([]) // Clear events before fetching new data
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        Alert.alert("Error", "No authentication token found. Please log in again.")
        setLoading(false)
        return
      }
      const eventsResponse = await fetch(`${API_BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const eventsText = await eventsResponse.text();
      console.log("Events API response text:", eventsText);
      const eventsData = JSON.parse(eventsText);

      const movementsResponse = await fetch(`${API_BASE_URL}/movements`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const movementsText = await movementsResponse.text();
      const movementsData = JSON.parse(movementsText);

      if (eventsData.success && movementsData.success) {
        // Map events to include movement details
        const enrichedEvents = eventsData.data.map(event => {
          const movement = movementsData.data.find(mov => mov.id === event.movementId)
          if (!movement) {
            console.warn(`Movement with id ${event.movementId} not found`)
          }
          return {
            id: event.id,
            name: event.nombreEvento,
            startTime: event.horaInicio,
            endTime: event.horaFin,
            days: event.diasSemana.map(day => mapDayAbbreviation(day)),
            enabled: event.activo,
movement: movement ? {
  type: movement.nombre,
  speed: (movement.movimiento?.horas?.velocidad ?? movement.velocidad)?.toString() || "",
  time: movement.duracion?.toString() || ""
} : null
          }
        })
        setLocalEvents(enrichedEvents)
        // setEvents(enrichedEvents)
      } else {
        Alert.alert("Error", "Error loading events or movements")
      }
    } catch (error) {
      console.error("Fetch error:", error)
      Alert.alert("Error", "Failed to fetch data from server")
    } finally {
      setLoading(false)
    }
  }

  const mapDayAbbreviation = (day) => {
    const dayMap = {
      lunes: "M",
      martes: "T",
      miercoles: "W",
      jueves: "Th",
      viernes: "F",
      sabado: "Sa",
      domingo: "Su",
      Su: "Su",
      M: "M",
      T: "T",
      W: "W",
      Th: "Th",
      F: "F",
      Sa: "Sa"
    }
    return dayMap[day] || day
  }

const toggleEventStatus = async (eventId) => {
    const event = localEvents.find(e => e.id === eventId)
    if (!event) return

    // Prevenir múltiples actualizaciones simultáneas
    if (updatingEvents.has(eventId)) return;

    console.log('🔄 Toggling event status:', eventId, 'current enabled:', event.enabled);

    // Marcar el evento como en proceso de actualización
    setUpdatingEvents(prev => new Set([...prev, eventId]));

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "No authentication token found. Please log in again.");
        return;
      }
      
      // Buscar el evento original en los datos que obtuvimos inicialmente
      // Necesitamos volver a hacer fetch de todos los eventos para obtener los datos originales
      const eventsResponse = await fetch(`${API_BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!eventsResponse.ok) {
        console.log('❌ Failed to fetch events for update');
        Alert.alert("Error", "Failed to fetch events");
        return;
      }
      
      const eventsData = await eventsResponse.json();
      if (!eventsData.success) {
        console.log('❌ Failed to get events data');
        Alert.alert("Error", "Failed to get events data");
        return;
      }
      
      // Encontrar el evento específico en los datos del backend
      const originalEvent = eventsData.data.find(e => e.id === eventId);
      if (!originalEvent) {
        console.log('❌ Event not found in backend data');
        Alert.alert("Error", "Event not found");
        return;
      }
      
      // Crear el objeto completo con todos los campos requeridos
      const requestBody = {
        nombreEvento: originalEvent.nombreEvento,
        horaInicio: originalEvent.horaInicio,
        horaFin: originalEvent.horaFin,
        diasSemana: originalEvent.diasSemana,
        movementId: originalEvent.movementId,
        activo: !event.enabled // Solo cambiamos el estado activo
      };
      
      console.log('📤 Sending complete request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })
      
      console.log('📥 Response status:', response.status);
      const data = await response.json()
      console.log('📥 Response data:', data);
      
      if (data.success) {
        setLocalEvents(prevEvents =>
          prevEvents.map(ev => ev.id === eventId ? { ...ev, enabled: !ev.enabled } : ev)
        )
        console.log('✅ Event status updated successfully');
      } else {
        console.log('❌ Backend returned success: false');
        Alert.alert("Error", "Failed to update event status")
      }
    } catch (error) {
      console.log('🚨 Error in toggleEventStatus:', error);
      Alert.alert("Error", "Failed to update event status")
    } finally {
      // Remover el evento del estado de actualización
      setUpdatingEvents(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  }

  const handlePress = (event) => {
    navigation.navigate("EditEventModal", { event })
  }

  const getOngoingEvent = () => {
    const ongoingEvent = localEvents.find((event) => event.enabled)
    return ongoingEvent ? `The ${ongoingEvent.name} event is ongoing` : "No ongoing event"
  }

  const renderItem = ({ item }) => {
    const isUpdating = updatingEvents.has(item.id);
    
    return (
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
            {item.movement && (
              <Text style={styles.movementInfo}>
                Movement: {item.movement.type} | Speed: {item.movement.speed} | Time: {item.movement.time}
              </Text>
            )}
          </View>
          
          <View style={styles.switchContainer}>
            {isUpdating && (
              <ActivityIndicator 
                size="small" 
                color="#660154" 
                style={styles.loadingIndicator}
              />
            )}
            <Switch
              value={item.enabled}
              onValueChange={() => toggleEventStatus(item.id)}
              trackColor={{ false: "#e0e0e0", true: "#660154" }}
              thumbColor={item.enabled ? "#ffffff" : "#660154"}
              ios_backgroundColor="#e0e0e0"
              disabled={isUpdating} // Disable switch while updating
              style={[
                styles.switch,
                isUpdating && styles.switchDisabled
              ]}
            />
            {isUpdating && (
              <Text style={styles.updatingText}>Updating...</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#660154" />
      </SafeAreaView>
    )
  }

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
        refreshing={loading}
        onRefresh={fetchData}
      />

        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate("NewEventScreen")}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>

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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
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
    eventContainer:{
      paddingTop: 10,
    },
    eventCard: {
      backgroundColor: "#fff",
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    eventHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    eventInfo: {
      flex: 1,
    },
    switchContainer: {
      alignItems: "center",
      justifyContent: "center",
      minWidth: 60,
    },
    switch: {
      marginVertical: 4,
    },
    switchDisabled: {
      opacity: 0.6,
    },
    loadingIndicator: {
      position: "absolute",
      top: -8,
      right: 5,
    },
    updatingText: {
      fontSize: 10,
      color: "#666",
      marginTop: 2,
      textAlign: "center",
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
    movementInfo: {
      fontSize: 14,
      color: "#400135",
      marginTop: 4,
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 80,
      backgroundColor: "#400135",
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
      zIndex: 10, 
    },
})

export default EventsScreen
