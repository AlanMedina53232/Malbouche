"use client"
import { useState, useEffect } from "react"
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,Platform } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import NavigationBar from "../../components/NavigationBar"
import { useSafeAreaInsets } from "react-native-safe-area-context"

  const currentUser = {
    id: 1,
    name: 'Almendro Isaac Medina Ramírez',
    email: 'AlmIsaMedRam@gmail.com'
  };

const MovementsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets()
  const [movements, setMovements] = useState([
    { id: "1", name: "Left", speed: 50, time: 10, type: "Left" },
    { id: "2", name: "Right", speed: 75, time: 15, type: "Right" },
    { id: "3", name: "Swing", speed: 60, time: 20, type: "Swing" },
  ])

  const handleCreateMovement = () => {
    navigation.navigate("CreateMovement")
  }

  const handleEditMovement = (movement) => {
    navigation.navigate("EditMovement", { movementId: movement.id, movement })
  }

  const handleMovementCreated = (newMovement) => {
    setMovements((prev) => [...prev, { ...newMovement, id: Date.now().toString() }])
  }

  const handleMovementUpdated = (updatedMovement) => {
    setMovements((prev) => prev.map((m) => (m.id === updatedMovement.id ? updatedMovement : m)))
  }

  const handleMovementDeleted = (movementId) => {
    setMovements((prev) => prev.filter((m) => m.id !== movementId))
  }

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
       <View style={styles.header}>
         <View style={styles.titleContainer}>
           <Text style={styles.title}>MOVEMENTS</Text>
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
        data={movements}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <Text style={styles.subtitle}>Create a new movement...</Text>
        }
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 100 }
        ]}
      
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleCreateMovement}
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
    marginTop: 10,
    marginBottom: 30,
    paddingHorizontal: 20,
    color: "#400135",
  },
  list: {
    paddingTop: 20,
    flexGrow: 1, 
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  item: {
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

export default MovementsScreen