"use client"
import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  SafeAreaView,
  ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AnalogClock from "../../components/analogClock";
import NavigationBar from "../../components/NavigationBar";
import Slider from "@react-native-community/slider";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';

const { height } = Dimensions.get("window");

const MOVE_TYPES = [
  { label: "Left", value: "Left" },
  { label: "Right", value: "Right" },
];

const EditMovementScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { movement } = route.params || {};
  
  const [moveName, setMoveName] = useState("");
  const [movements, setMovements] = useState([
    { hand: "Hour", type: "Left", speed: "", showDropdown: false },
    { hand: "Minute", type: "Right", speed: "", showDropdown: false },
  ]);

  // Precargar datos del movimiento
  useEffect(() => {
    if (movement) {
      console.log("Movement object in EditMovement useEffect:", movement);

      setMoveName(movement.nombre || "");

      // Load nested movimiento fields
      const movimiento = movement.movimiento || {};
      const horas = movimiento.horas || {};
      const minutos = movimiento.minutos || {};

      const hourType = horas.direccion === "izquierda" ? "Left" : "Right";
      const minuteType = minutos.direccion === "izquierda" ? "Left" : "Right";

      const hourSpeed = horas.velocidad !== undefined ? String(horas.velocidad) : "50";
      const minuteSpeed = minutos.velocidad !== undefined ? String(minutos.velocidad) : "50";

      setMovements([
        {
          hand: "Hour",
          type: hourType,
          speed: hourSpeed,
          showDropdown: false,
        },
        {
          hand: "Minute",
          type: minuteType,
          speed: minuteSpeed,
          showDropdown: false,
        }
      ]);
    }
  }, [movement]);

  const updateMovement = (index, field, value) => {
    const updatedMovements = [...movements];
    updatedMovements[index][field] = value;
    setMovements(updatedMovements);
  };

  // Obtener callbacks del padre de manera segura
  const getParentCallbacks = () => {
    const parent = navigation.getParent();
    if (!parent) return {};
    const parentState = parent.getState();
    const parentRoute = parentState?.routes.find(r => r.name === "Movements");
    return parentRoute?.params || {};
  };

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!moveName.trim()) {
      Alert.alert("Error", "Please enter a movement name");
      return;
    }

    const hasValidMovement = movements.some(m => m.speed);
    if (!hasValidMovement) {
      Alert.alert("Error", "Please fill at least one movement with speed");
      return;
    }

    setLoading(true);

    const updatedMovement = {
      nombre: moveName,
      duracion: 10,
      movimiento: {
        direccionGeneral: movements.find(m => m.hand === "Hour")?.type.toLowerCase() === "left" ? "izquierda" : "derecha",
        horas: {
          direccion: movements.find(m => m.hand === "Hour")?.type.toLowerCase() === "left" ? "izquierda" : "derecha",
          velocidad: parseInt(movements.find(m => m.hand === "Hour")?.speed) || 0,
        },
        minutos: {
          direccion: movements.find(m => m.hand === "Minute")?.type.toLowerCase() === "left" ? "izquierda" : "derecha",
          velocidad: parseInt(movements.find(m => m.hand === "Minute")?.speed) || 0,
        }
      }
    };

    // Remove legacy flat fields to avoid validation errors
    delete updatedMovement.tipoMovimientoHoras;
    delete updatedMovement.velocidadHora;
    delete updatedMovement.tipoMovimientoMinutos;
    delete updatedMovement.velocidadMinuto;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "No se encontró token de autenticación. Por favor inicie sesión nuevamente.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/movements/${movement.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(updatedMovement)
      });

      const data = await response.json();

      if (!response.ok) {
        Alert.alert("Error", data.error || "Error actualizando movimiento");
        setLoading(false);
        return;
      }

      const { onMovementUpdated } = getParentCallbacks();
      if (onMovementUpdated) {
        onMovementUpdated({ id: movement.id, ...updatedMovement });
      }

      Alert.alert("Éxito", "Movimiento actualizado exitosamente");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating movement:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Movement",
      "Are you sure you want to delete this movement?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          onPress: async () => {
            setLoading(true);
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert("Error", "No se encontró token de autenticación. Por favor inicie sesión nuevamente.");
                setLoading(false);
                return;
              }

              const response = await fetch(`${BACKEND_URL}/movements/${movement.id}`, {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${token}`
                }
              });

              if (!response.ok) {
                const data = await response.json();
                Alert.alert("Error", data.error || "Error eliminando movimiento");
                setLoading(false);
                return;
              }

              const { onMovementDeleted } = getParentCallbacks();
              if (onMovementDeleted) {
                onMovementDeleted(movement.id);
              }

              Alert.alert("Éxito", "Movimiento eliminado exitosamente");
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting movement:", error);
              Alert.alert("Error", "No se pudo conectar con el servidor");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.arrowButton}
            onPress={() => navigation.goBack()}
          >
            <View style={styles.iconSmall}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </View>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>EDIT MOVEMENT</Text>
          </View>
        </View>

        <View style={styles.clockContainer}>
          <AnalogClock 
            direction={movements[0]?.type?.toLowerCase()}
            speed={parseInt(movements[0]?.speed) || 50}
          />
        </View>
        
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Move Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter movement name"
              value={moveName}
              onChangeText={setMoveName}
            />

            {movements.map((movementItem, index) => (
              <View key={`${movementItem.hand}-${index}`} style={styles.movementBox}>
                <Text style={styles.movementLabel}>
                  Move type for {movementItem.hand.toLowerCase()} hand
                </Text>

                <View style={styles.dropdownRow}>
                  <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                      style={styles.dropdown}
                      onPress={() => updateMovement(index, "showDropdown", !movementItem.showDropdown)}
                    >
                      <Text style={styles.dropdownText}>
                        {MOVE_TYPES.find(t => t.value === movementItem.type)?.label || movementItem.type}
                      </Text>

                    </TouchableOpacity>

                    {movementItem.showDropdown && (
                      <View style={styles.dropdownList}>
                        {MOVE_TYPES.map(type => (
                          <TouchableOpacity
                            key={type.value}
                            style={styles.dropdownItem}
                            onPress={() => {
                              updateMovement(index, "type", type.value);
                              updateMovement(index, "showDropdown", false);
                            }}
                          >
                            <Text style={styles.dropdownText}>{type.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  <View style={styles.sliderContainer}>
                    <Text style={styles.sliderLabel}>Speed</Text>
                    <Slider 
                      style={styles.slider}
                      minimumValue={1}
                      maximumValue={100}
                      step={1}
                      value={movementItem.speed ? parseInt(movementItem.speed) : 1}
                      onSlidingComplete={(value) => updateMovement(index, "speed", String(value))}
                      minimumTrackTintColor="#660154"
                      maximumTrackTintColor="#ddd"
                      thumbTintColor="#660154"
                    />
                    <Text style={styles.sliderValue}>{movementItem.speed || 1}</Text>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.deleteButton]} 
                onPress={handleDelete}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, styles.saveButton]} 
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <NavigationBar />
    </SafeAreaView>
  );
};


// Estilos (los mismos que CreateMovementScreen con pequeños ajustes)
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  container: {
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
  arrowButton: {
    marginRight: 10,
    marginBottom: 10,
  },
  iconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  clockContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  divider: {
    borderBottomWidth: 0.6,
    borderBottomColor: '#ddd', 
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  formContainer: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "#f4f4f4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 5,
    color: "#333",
    marginTop: 5,
  },
  input: {
    borderRadius: 10,
    backgroundColor: "#fff",
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 18,
  },
  movementBox: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    padding: 14,
    marginBottom: 18,
  },
  movementLabel: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 10,
    color: "#333",
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dropdownContainer: {
    flex: 1,
    position: "relative",
  },
  dropdown: {
    borderWidth: 0.8,
    borderColor: "rgba(204, 204, 204, 0.8)",
    borderRadius: 6,
    padding: 10,
    backgroundColor: "#fff",
    minWidth: 90,
    zIndex: 2,
  },
  dropdownText: {
    fontSize: 15,
    color: "#333",
  },
  dropdownList: {
    position: "absolute",
    top: 44,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderWidth: 0.8,
    borderColor: "rgba(204, 204, 204, 0.8)",
    borderRadius: 5,
    zIndex: 10,
  },
  dropdownItem: {
    padding: 12,
  },
  sliderContainer: {
    flex: 2,
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginLeft: 10,
  },
  sliderLabel: {
    fontSize: 13,
    color: "#666",
    marginRight: 5,
  },
  slider: {
    flex: 1,
    height: 30,
    marginHorizontal: 6,
  },
  sliderValue: {
    width: 32,
    textAlign: "center",
    fontSize: 15,
    color: "#333",
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#400135",
  },
  deleteButton: {
    backgroundColor: "#ff4444",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
})

export default EditMovementScreen