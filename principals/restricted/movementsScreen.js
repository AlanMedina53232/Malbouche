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
import { LinearGradient } from "expo-linear-gradient";
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

  // Estilo dinámico para el FAB basado en los safe area insets
  const fabDynamicStyle = {
    ...styles.fab,
    bottom: 80 + insets.bottom, // 80px base + espacio de navegación del sistema
  }

    const renderItem = ({ item }) => {
      // Extract data according to API structure
      const movimiento = item.movimiento || {};
      const horas = movimiento.horas || {};
      const minutos = movimiento.minutos || {};

      // Simplified display values
      const duracion = item.duracion || 'N/A';
      const direccionGeneral = movimiento.direccionGeneral || 'N/A';
      
      // Get directions for each hand
      const horasDireccion = horas.direccion || 'N/A';
      const minutosDireccion = minutos.direccion || 'N/A';
      
      // Get average speed for display
      const horasVelocidad = horas.velocidad || 0;
      const minutosVelocidad = minutos.velocidad || 0;
      const avgSpeed = Math.round((horasVelocidad + minutosVelocidad) / 2);

      return (
        <TouchableOpacity 
          style={styles.movementCard} 
          onPress={() => handleMovementPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.movementHeader}>
            <View style={styles.movementIcon}>
              <Ionicons name="time-outline" size={24} color="#660154" />
            </View>
            <View style={styles.movementInfo}>
              <Text style={[styles.movementName, { fontFamily: 'Montserrat_700Bold' }]}>
                {item.nombre}
              </Text>
              <View style={styles.movementDetails}>
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={14} color="#666" />
                  <Text style={[styles.detailText, { fontFamily: 'Montserrat_400Regular' }]}>
                    Hours: {horasDireccion}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Ionicons name="timer-outline" size={14} color="#666" />
                  <Text style={[styles.detailText, { fontFamily: 'Montserrat_400Regular' }]}>
                    Minutes: {minutosDireccion}
                  </Text>
                </View>

              </View>
            </View>
          
          </View>
        </TouchableOpacity>
      );
    };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#33002A', 'rgba(102, 1, 84, 0.8)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.titleContainer}>
              <Text style={[styles.titleGradient, { fontFamily: 'Montserrat_700Bold' }]}>MOVEMENTS</Text>
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
        </LinearGradient>

        <FlatList
          data={movements}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <Text style={[styles.subtitle, { fontFamily: 'Montserrat_600SemiBold' }]}>
              Create and manage clock movements
            </Text>
          }
          contentContainerStyle={[
            styles.movementsList,
            { paddingBottom: insets.bottom + 150 }
          ]}
          style={styles.movementsContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchMovements}
        />

        <TouchableOpacity 
          style={fabDynamicStyle} 
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
  headerGradient: {
    paddingTop: 38,
    paddingBottom: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingLeft: 20,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 22,
    marginBottom: 20,
    paddingHorizontal: 20,
    color: "#660154",
  },
  movementsList: {
    paddingHorizontal: 15,
    // paddingBottom se define dinámicamente
  },
  movementsContainer: {
    flex: 1,
  },
  movementCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderColor: "rgba(209, 148, 22, 0.4)",
    borderWidth: 1,
    padding: 15,
    marginVertical: 8,
    shadowColor: "rgba(102, 1, 84,0.8)",
    elevation: 5,
  },
  movementHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  movementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(102, 1, 84, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  movementInfo: {
    flex: 1,
  },
  movementName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  movementDetails: {
    flexDirection: 'row',
    
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailText: {
    fontSize: 12,
    color: "#666",
  },
  chevronContainer: {
    padding: 1,
  },
  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: "#400135", 
    width: 70,
    height: 70,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5, 
    zIndex: 10,
  },
  // Estilos para el modal (mantenidos para compatibilidad)
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
});

export default MovementsScreen
