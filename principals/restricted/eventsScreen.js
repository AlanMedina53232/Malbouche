"use client"

import { useState, useEffect, useContext } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert, SafeAreaView, ActivityIndicator, Image } from "react-native"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation, useFocusEffect } from "@react-navigation/native"
import { EventContext } from "../../context/eventContext"
import { Ionicons } from "@expo/vector-icons"
import NavigationBar from "../../components/NavigationBar"
import { getAllEvents, getAllMovements, updateEvent, handleApiError } from '../../utils/apiClient'
import { showGenericErrorAlert } from '../../utils/eventErrorHandler'
import { useCallback } from "react"
import eventRefreshService from '../../utils/eventRefreshService'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const API_BASE_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api' // Fallback if env not set

const EventsScreen = () => {
  const navigation = useNavigation()
  const insets = useSafeAreaInsets()
  // const { events, setEvents } = useContext(EventContext)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)
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

  // Auto-refresh when screen comes into focus (after navigation back)
  useFocusEffect(
    useCallback(() => {
      fetchData()
    }, [])
  )

  // Subscribe to refresh service for immediate updates
  useEffect(() => {
    const unsubscribe = eventRefreshService.subscribe(() => {
      console.log('📱 EventsScreen: Received refresh request from service');
      fetchData();
    });

    return unsubscribe;
  }, [])

const fetchData = async () => {
    try {
      setLoading(true)
      setLocalEvents([]) // Clear events before fetching new data
      
      const [eventsResult, movementsResult] = await Promise.all([
        getAllEvents(),
        getAllMovements()
      ])

      if (eventsResult.success && movementsResult.success) {
        // Map events to include movement details
        const enrichedEvents = eventsResult.events.map(event => {
          const movement = movementsResult.movements.find(mov => mov.id === event.movementId)
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
      } else {
        const errorInfo = handleApiError({ 
          response: { 
            data: eventsResult.success ? movementsResult : eventsResult 
          } 
        })
        showGenericErrorAlert(errorInfo)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      const errorInfo = handleApiError(error)
      showGenericErrorAlert(errorInfo)
    } finally {
      setLoading(false)
    }
  }

  const mapDayAbbreviation = (day) => {
    const dayMap = {
      lunes: "L",
      martes: "M", 
      miercoles: "M",
      jueves: "J",
      viernes: "V",
      sabado: "S",
      domingo: "D",
      Su: "D",
      M: "L",
      T: "M",
      W: "M",
      Th: "J",
      F: "V",
      Sa: "S"
    }
    return dayMap[day] || day
  }

  const getAllDaysWithStatus = (activeDays) => {
    const allDays = [
      { key: 'L', label: 'M', active: false },    // Monday
      { key: 'M', label: 'T', active: false },    // Tuesday
      { key: 'Mi', label: 'W', active: false },   // Wednesday
      { key: 'J', label: 'Th', active: false },   // Thursday
      { key: 'V', label: 'F', active: false },    // Friday
      { key: 'S', label: 'Sa', active: false },   // Saturday
      { key: 'D', label: 'Su', active: false }    // Sunday
    ];

    // Mark active days - map Spanish abbreviations to English
    activeDays.forEach(day => {
      const dayMapping = {
        'L': 'M',   // Lunes -> Monday
        'M': 'T',   // Martes -> Tuesday  
        'Mi': 'W',  // Miércoles -> Wednesday
        'J': 'Th',  // Jueves -> Thursday
        'V': 'F',   // Viernes -> Friday
        'S': 'Sa',  // Sábado -> Saturday
        'D': 'Su'   // Domingo -> Sunday
      };
      
      const englishDay = dayMapping[day] || day;
      const dayIndex = allDays.findIndex(d => d.label === englishDay);
      if (dayIndex !== -1) {
        allDays[dayIndex].active = true;
      }
    });

    return allDays;
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
      // Get the original event data from the backend
      const eventsResult = await getAllEvents()
      if (!eventsResult.success) {
        const errorInfo = handleApiError({ response: { data: eventsResult } })
        showGenericErrorAlert(errorInfo)
        return;
      }
      
      // Find the specific event in the backend data
      const originalEvent = eventsResult.events.find(e => e.id === eventId);
      if (!originalEvent) {
        Alert.alert("Error", "Event not found");
        return;
      }
      
      // Create the update object with all required fields
      const updateData = {
        nombreEvento: originalEvent.nombreEvento,
        horaInicio: originalEvent.horaInicio,
        horaFin: originalEvent.horaFin,
        diasSemana: originalEvent.diasSemana,
        movementId: originalEvent.movementId,
        activo: !event.enabled // Only toggle the active status
      };
      
      console.log('📤 Sending update data:', updateData);
      
      const result = await updateEvent(eventId, updateData)
      
      if (result.success) {
        setLocalEvents(prevEvents =>
          prevEvents.map(ev => ev.id === eventId ? { ...ev, enabled: !ev.enabled } : ev)
        )
        console.log('Event status updated successfully');
      } else {
        const errorInfo = handleApiError({ response: { data: result } })
        showGenericErrorAlert(errorInfo)
      }
    } catch (error) {
      console.log('Error in toggleEventStatus:', error);
      const errorInfo = handleApiError(error)
      showGenericErrorAlert(errorInfo)
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
    const enabledEvents = localEvents.filter((event) => event.enabled)
    
    if (enabledEvents.length === 0) {
      return "No Ongoing Events"
    }

    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.getHours() * 60 + now.getMinutes() // Current time in minutes

    // Map JavaScript day numbers to our day abbreviations
    const dayMap = {
      0: 'D', // Sunday
      1: 'L', // Monday
      2: 'M', // Tuesday  
      3: 'Mi', // Wednesday
      4: 'J', // Thursday
      5: 'V', // Friday
      6: 'S'  // Saturday
    }
    
    const currentDayAbbr = dayMap[currentDay]

    // Check if any event is currently happening
    for (const event of enabledEvents) {
      if (event.days.includes(currentDayAbbr)) {
        const [startHour, startMinute] = event.startTime.split(':').map(Number)
        const [endHour, endMinute] = event.endTime.split(':').map(Number)
        const startTimeMinutes = startHour * 60 + startMinute
        const endTimeMinutes = endHour * 60 + endMinute
        
        if (currentTime >= startTimeMinutes && currentTime <= endTimeMinutes) {
          return `The ${event.name} event is ongoing`
        }
      }
    }

    // If no event is currently happening, find the next upcoming event
    let nextEvent = null
    let minHoursUntilNext = Infinity

    for (const event of enabledEvents) {
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const checkDay = (currentDay + dayOffset) % 7
        const checkDayAbbr = dayMap[checkDay]
        
        if (event.days.includes(checkDayAbbr)) {
          const [startHour, startMinute] = event.startTime.split(':').map(Number)
          const startTimeMinutes = startHour * 60 + startMinute
          
          let hoursUntilEvent
          if (dayOffset === 0) {
            // Same day
            if (startTimeMinutes > currentTime) {
              hoursUntilEvent = (startTimeMinutes - currentTime) / 60
            } else {
              continue // Event already passed today
            }
          } else {
            // Future day
            const minutesUntilMidnight = (24 * 60) - currentTime
            const minutesToEvent = (dayOffset - 1) * 24 * 60 + startTimeMinutes
            hoursUntilEvent = (minutesUntilMidnight + minutesToEvent) / 60
          }
          
          if (hoursUntilEvent < minHoursUntilNext) {
            minHoursUntilNext = hoursUntilEvent
            nextEvent = event
          }
        }
      }
    }

    if (nextEvent) {
      const hoursUntilNext = Math.floor(minHoursUntilNext)
      const minutesUntilNext = Math.round((minHoursUntilNext % 1) * 60)
      
      if (hoursUntilNext === 0) {
        return `The ${nextEvent.name} Event Starts In ${minutesUntilNext} minutes`
      } else if (hoursUntilNext < 24) {
        return `The ${nextEvent.name} Event Starts In ${hoursUntilNext} hours`
      } else {
        const daysUntilNext = Math.floor(hoursUntilNext / 24)
        return `The ${nextEvent.name} Event Starts In ${daysUntilNext} day${daysUntilNext > 1 ? 's' : ''}`
      }
    }

    return "No Upcoming Events"
  }

  // Estilo dinámico para el FAB basado en los safe area insets
  const fabDynamicStyle = {
    ...styles.fab,
    bottom: 80 + insets.bottom, // 80px base + espacio de navegación del sistema
  }

  // Estilo dinámico para el contenido de la lista
  const listContentDynamicStyle = {
    ...styles.eventsList,
    paddingBottom: 150 + insets.bottom, // Padding base + espacio de navegación del sistema
  }

  const renderItem = ({ item }) => {
    const isUpdating = updatingEvents.has(item.id);
    const daysWithStatus = getAllDaysWithStatus(item.days);
    
    return (
      
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => handlePress(item)}
        delayLongPress={500}
        activeOpacity={0.7}
      >
        <View style={styles.eventHeader}>
          <View style={styles.eventInfo}>
            <Text style={[styles.eventName, { fontFamily: 'Combo_400Regular' }]}>{item.name}</Text>
            <Text style={[styles.eventTime, { fontFamily: 'Combo_400Regular' }]}>
              {item.startTime} - {item.endTime}
            </Text>
            
            {/* Días de la semana */}
            <View style={styles.daysContainer}>
              {daysWithStatus.map((day, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.dayBadge, 
                    day.active ? styles.dayBadgeActive : styles.dayBadgeInactive
                  ]}
                >
                  <Text 
                    style={[
                      styles.dayText, 
                      day.active ? styles.dayTextActive : styles.dayTextInactive,
                      { fontFamily: 'Combo_400Regular' }
                    ]}
                  >
                    {day.label}
                  </Text>
                </View>
              ))}
            </View>
            
          </View>
          
          <View style={styles.switchContainer}>
            {isUpdating && (
              <ActivityIndicator 
                size="small" 
                color="#3A3A3B" 
                style={styles.loadingIndicator}
              />
            )}
            <Switch
              value={item.enabled}
              onValueChange={() => toggleEventStatus(item.id)}
              trackColor={{ false: "#8c8c8c", true: "#3A3A3B" }}
              thumbColor={item.enabled ? "#ffffff" : "#3A3A3B"}
              ios_backgroundColor="#BFBFBF"
              disabled={isUpdating} // Disable switch while updating
              style={[
                styles.switch,
                isUpdating && styles.switchDisabled
              ]}
            />
            {isUpdating && (
              <Text style={[styles.updatingText, { fontFamily: 'Combo_400Regular' }]}>Updating...</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      
    )
  }

  return (
    <LinearGradient
      colors={['#8C8C8C', '#3a3a3bc8', '#2e2e2ec5']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#a6a6a6', '#a6a6a6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
{/*             <View style={styles.titleContainer}>
              <Text style={[styles.titleGradient, { fontFamily: 'Combo_400Regular' }]}>EVENTS</Text>
            </View> */}
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('UserDetail', { user: currentUser })}
            >
              <View style={styles.avatarSmall}>
                <Ionicons name="person" size={20} color="#3A3A3B" />
              </View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        <View style={styles.fixedHeader}>
          <Image 
            source={require('../../assets/malbouche1.jpg')} 
            style={styles.fixedHeaderImage}
            resizeMode='cover'
            
          />      
          <View style={styles.fadeOverlays} pointerEvents="none">
          {/* Left */}
{/*           <LinearGradient
            colors={['#F2F2F2', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fadeSide, { left: 0 }]}
          /> */}
          {/* Right */}
{/*           <LinearGradient
            colors={['transparent', '#F2F2F2']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[styles.fadeSide, { right: 0 }]}
          /> */}
           {/* Top */}
            <LinearGradient
              colors={['#b5b4b4ff', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.fadeSide, { top: 0 }]}
            />
          {/* Bottom */}
            <LinearGradient
              colors={['transparent', '#717171']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.fadeTopBottom, { bottom: 0 }]}
            />
          </View>
        </View>
        <FlatList
          data={localEvents}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <>
              <Text style={styles.subtitle}>
                {getOngoingEvent()}
              </Text>
            </>
          }
          contentContainerStyle={listContentDynamicStyle}
          style={styles.eventContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchData}
        />

        <TouchableOpacity 
          style={fabDynamicStyle} 
          onPress={() => navigation.navigate("NewEventScreen")}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>

        <NavigationBar />
      </View>
    </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    
  },
  safeArea: {
    flex: 1,
    
  },
  headerGradient: {
    paddingTop: 38,
    paddingBottom: 80,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'flex-end',
    zIndex: 1, // encima de la imagen fija
  },
  fixedHeader: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 250, // puedes ajustar
  zIndex: 0, // detrás del contenido
  overflow: 'hidden',
},

fixedHeaderImage: {
  width: '100%',
  height: '100%',
},

listHeader: {
  alignItems: 'flex-start',
},
fadeOverlays: {
    position: 'absolute',
    inset: 0,
  },
  fadeSide: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 30, // alto del difuminado superior/inferior
  },
    fadeTopBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50, // alto del difuminado superior/inferior
  },

  titleGradient: {
    fontSize: 22, 
    color: "#fff",
    paddingLeft: 35
  },

  profileButton: {
    marginLeft: 10,
    marginBottom: 10,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 20,
  },
  subtitle: {
    fontSize: 30,
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 20,
    color: "#3A3A3B",
    fontFamily: 'Combo_400Regular',
  },
  eventsList: {
    paddingHorizontal: 15,
    // paddingBottom se define dinámicamente con listContentDynamicStyle
  },
  eventContainer:{
    flex: 1,
  },
  eventCard: {
    backgroundColor: "#f2f2f2a7",
    borderRadius: 8,
    padding: 15,
    marginBottom: 5,

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
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  eventTime: {
    fontSize: 18,
    color: "#666",
    marginBottom: 8,
  },
  
  // Nuevos estilos para los días de la semana
  daysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 3,
  },
  dayBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  dayBadgeActive: {
    backgroundColor: '#3A3A3B',
    borderColor: '#3A3A3B',
  },
  dayBadgeInactive: {
    backgroundColor: 'transparent',
    borderColor: '#3A3A3B',
  },
  dayText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dayTextActive: {
    color: '#F2F2F2',
  },
  dayTextInactive: {
    color: '#3A3A3B',
  },
  
  eventDays: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  movementInfo: {
    fontSize: 14,
    color: "#660154",
    marginTop: 4,
  },
  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: "#404040", 
    width: 70,
    height: 70,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#2e2e2e",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5, 
    zIndex: 10,
  },
})

export default EventsScreen
