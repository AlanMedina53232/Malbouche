"use client"
import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView 
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from "@expo/vector-icons";
import NavigationBar from "../../components/NavigationBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const currentUser = {
  id: 1,
  name: 'Almendro Isaac Medina Ramírez',
  email: 'AlmIsaMedRam@gmail.com'
};

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';

const MovementsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCreateMovement = () => {
    navigation.navigate("CreateMovement");
  };

  const handleMovementPress = (movement) => {
    navigation.navigate('EditMovement', { movement });
  };

  const handleMovementCreated = (newMovement) => {
    setMovements((prev) => [...prev, { ...newMovement, id: Date.now().toString() }]);
  };

  const handleMovementUpdated = (updatedMovement) => {
    setMovements((prev) => prev.map((m) => (m.id === updatedMovement.id ? updatedMovement : m)));
  };

  const handleMovementDeleted = (movementId) => {
    setMovements((prev) => prev.filter((m) => m.id !== movementId));
  };

  // Configura los callbacks usando setOptions
  useEffect(() => {
    navigation.setOptions({
      onMovementCreated: handleMovementCreated,
      onMovementUpdated: handleMovementUpdated,
      onMovementDeleted: handleMovementDeleted
    });
  }, [navigation]);

  // Fetch movements from backend
  const fetchMovements = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.error("No auth token found");
        setLoading(false);
        return;
      }
      const response = await fetch(`${BACKEND_URL}/movements`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (!response.ok) {
        console.error("Failed to fetch movements:", response.status);
        setLoading(false);
        return;
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        // Store full movement objects without mapping to preserve detailed fields
        setMovements(data.data);
      } else {
        console.error("Invalid data format from movements API");
      }
    } catch (error) {
      console.error("Error fetching movements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

    const renderItem = ({ item }) => {
      // Extract data according to API structure
      const movimiento = item.movimiento || {};
      const horas = movimiento.horas || {};
      const minutos = movimiento.minutos || {};

      // Simplified display values
      const duracion = item.duracion || 'N/A';
      const direccionGeneral = movimiento.direccionGeneral || 'N/A';
      
      // Get average speed for display
      const horasVelocidad = horas.velocidad || 0;
      const minutosVelocidad = minutos.velocidad || 0;
      const avgSpeed = Math.round((horasVelocidad + minutosVelocidad) / 2);

      return (
        <TouchableOpacity 
          style={styles.item} 
          onPress={() => handleMovementPress(item)}
        >
          <Text style={styles.itemText}>{item.nombre}</Text>
          <View style={styles.itemDetails}>
            <Text style={styles.itemSubtext}>
              Duration: {duracion}s • Direction: {direccionGeneral} • Speed: {avgSpeed}
            </Text>
          </View>
        </TouchableOpacity>
      );
    };

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
        refreshing={loading}
        onRefresh={fetchMovements}
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
  );
};
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
  // Estilos para el modal
   modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.6,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 0.8,
    borderColor: "rgba(204, 204, 204, 0.8)",
    borderRadius: 6,
    padding: 12,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  movementBox: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
    borderWidth: 0.8,
    borderColor: "rgba(204, 204, 204, 0.3)",
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  dropdown: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  borderWidth: 0.8,
  borderColor: "rgba(204, 204, 204, 0.8)",
  borderRadius: 6,
  padding: 12,
  backgroundColor: "#fff",
  marginBottom: 8,
},
dropdownText: {
  fontSize: 15,
  color: "#333",
},
dropdownList: {
  position: "absolute",
  top: 70,
  left: 0,
  right: 0,
  backgroundColor: "#fff",
  borderWidth: 0.8,
  borderColor: "rgba(204, 204, 204, 0.8)",
  borderRadius: 6,
  zIndex: 1000,
  elevation: 5,
},
dropdownItem: {
  padding: 12,
  borderBottomWidth: 0.5,
  borderBottomColor: "#eee",
},
  deleteButton: {
    backgroundColor: '#ff4444',
  },
  saveButton: {
    backgroundColor: '#400135',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
})

export default MovementsScreen
