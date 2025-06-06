"use client"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import NavigationBar from "../../components/NavigationBar"

const MovementsScreen = ({ navigation }) => {
  const [movements, setMovements] = useState([
    { id: "1", name: "Left", speed: 50, time: 10, type: "Left" },
    { id: "2", name: "Right", speed: 75, time: 15, type: "Right" },
    { id: "3", name: "Swing", speed: 60, time: 20, type: "Swing" },
  ])

  const handleCreateMovement = () => {
    // Navigate without passing callbacks in params
    navigation.navigate("CreateMovement")
  }

  const handleEditMovement = (movement) => {
    // Navigate without passing callbacks in params
    navigation.navigate("EditMovement", { movementId: movement.id, movement })
  }

  // Handlers to be called from other screens
  const handleMovementCreated = (newMovement) => {
    setMovements((prev) => [...prev, { ...newMovement, id: Date.now().toString() }])
  }

  const handleMovementUpdated = (updatedMovement) => {
    setMovements((prev) => prev.map((m) => (m.id === updatedMovement.id ? updatedMovement : m)))
  }

  const handleMovementDeleted = (movementId) => {
    setMovements((prev) => prev.filter((m) => m.id !== movementId))
  }

  // Register handlers with navigation
  useEffect(() => {
    navigation.setOptions({
      onMovementCreated: handleMovementCreated,
      onMovementUpdated: handleMovementUpdated,
      onMovementDeleted: handleMovementDeleted,
    })
  }, [navigation])

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.item} onPress={() => handleEditMovement(item)}>
      <Text style={styles.itemText}>{item.name}</Text>
      <View style={styles.itemDetails}>
        <Text style={styles.itemSubtext}>
          Speed: {item.speed} | Time: {item.time}s
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Movements</Text>
      </View>

      <FlatList
        data={movements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <TouchableOpacity style={styles.fab} onPress={handleCreateMovement}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <NavigationBar />
    </View>
  )
}

export default MovementsScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginLeft: 20,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Increased to make room for navigation bar
  },
  item: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  itemDetails: {
    marginTop: 4,
  },
  itemSubtext: {
    fontSize: 12,
    color: "#666",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 90, // Increased to position above navigation bar
    backgroundColor: "#333",
    borderRadius: 30,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
})
