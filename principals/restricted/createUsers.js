"use client"
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import NavigationBar from "../../components/NavigationBar"
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_PASSWORD = "Malbouche2025!"
const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "Usuario", value: "usuario" },
  { label: "VIP", value: "vip" },
]

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api' // Fallback if env not set

const CreateUsers = ({ navigation }) => {
  const [nombre, setNombre] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [correo, setCorreo] = useState("")
  const [puesto, setPuesto] = useState("")
  const [rol, setRol] = useState("usuario") // default role

  const [showRoleDropdown, setShowRoleDropdown] = useState(false)

  const handleCreateUser = async () => {
    if (!nombre.trim() || !apellidos.trim() || !correo.trim()) {
      Alert.alert("Error", "Por favor complete los campos obligatorios: Nombre, Apellidos y Correo")
      return
    }

    // Prepare user data
    const userData = {
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      correo: correo.trim(),
      puesto: puesto.trim(),
      rol: ROLE_OPTIONS.some(r => r.value === rol) ? rol : "usuario",
      password: DEFAULT_PASSWORD,
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "No se encontró token de autenticación. Por favor inicie sesión nuevamente.");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        Alert.alert("Éxito", "Usuario creado exitosamente", [
          { text: "OK", onPress: () => navigation.goBack() }
        ])
      } else {
        console.error("Error creating user:", data);
        Alert.alert("Error", data.error || "Error creando usuario")
      }
    } catch (error) {
      console.error("Fetch error creating user:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor")
    }
  }

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
            onPress={() => navigation.goBack()}>
            <View style={styles.iconSmall}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </View>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>CREATE USER</Text>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese nombre"
              value={nombre}
              onChangeText={setNombre}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Apellidos *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese apellidos"
              value={apellidos}
              onChangeText={setApellidos}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Correo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese correo"
              value={correo}
              onChangeText={setCorreo}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>Puesto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ingrese puesto"
              value={puesto}
              onChangeText={setPuesto}
              autoCapitalize="words"
            />

            <Text style={styles.label}>Rol</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowRoleDropdown(!showRoleDropdown)}
            >
              <Text style={styles.dropdownText}>
                {ROLE_OPTIONS.find(r => r.value === rol)?.label || "Seleccione un rol"}
              </Text>
              <Ionicons name={showRoleDropdown ? "chevron-up" : "chevron-down"} size={20} color="#333" />
            </TouchableOpacity>
            {showRoleDropdown && (
              <View style={styles.dropdownList}>
                {ROLE_OPTIONS.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setRol(option.value)
                      setShowRoleDropdown(false)
                    }}
                  >
                    <Text style={styles.dropdownText}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.createButton} onPress={handleCreateUser}>
              <Text style={styles.createButtonText}>Crear Usuario</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <NavigationBar />
    </SafeAreaView>
  )
}

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
    justifyContent: 'flex-start',
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
  scrollContainer: {
    paddingHorizontal: 20,
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
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 15,
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 15,
  },
  dropdownItem: {
    padding: 12,
  },
  createButton: {
    backgroundColor: "#400135",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})

export default CreateUsers
