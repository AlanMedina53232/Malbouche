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
import { LinearGradient } from 'expo-linear-gradient';


const DEFAULT_PASSWORD = "Malbouche2025!"
const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "VIP", value: "vip" },
]

const getRoleInfo = (role) => {
  const roleLower = role?.toLowerCase();
  switch(roleLower) {
    case 'vip': 
      return {
        color: '#fbb42a',
        icon: 'diamond',
        label: 'VIP'
      };
    case 'admin': 
      return {
        color: '#660154',
        icon: 'settings',
        label: 'Admin'
      };
    default: 
      return {
        color: '#666',
        icon: 'person',
        label: role || 'User'
      };
  }
}



const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api' // Fallback if env not set

const CreateUsers = ({ navigation }) => {
  const [nombre, setNombre] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [correo, setCorreo] = useState("")
  const [rol, setRol] = useState("vip") // default "vip"


  const [showRoleDropdown, setShowRoleDropdown] = useState(false)

 const handleCreateUser = async () => {
    // Validaciones del frontend que coinciden con el backend
    if (!nombre.trim() || !apellidos.trim() || !correo.trim()) {
      Alert.alert("Error", "Please complete the required fields: Name, Last Name and Email")
      return
    }

    // Validar longitud del nombre (2-50 caracteres)
    if (nombre.trim().length < 2 || nombre.trim().length > 50) {
      Alert.alert("Error", "Name must be between 2 and 50 characters")
      return
    }

    // Validar longitud de apellidos (2-50 caracteres)
    if (apellidos.trim().length < 2 || apellidos.trim().length > 50) {
      Alert.alert("Error", "Last name must be between 2 and 50 characters")
      return
    }

    // Validar formato de correo
    if (!/\S+@\S+\.\S+/.test(correo.trim())) {
      Alert.alert("Error", "Must be a valid email")
      return
    }

     // Actualiza la validación del rol para solo admin y vip
    if (!["admin", "vip"].includes(rol)) {
      Alert.alert("Error", "Role must be: admin or vip")
      return
    }

    // Prepare user data
    const userData = {
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      correo: correo.trim().toLowerCase(),
      puesto: "empleado", // Valor por defecto
      rol: rol,
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
        
        // Manejo específico de errores de validación
        if (data.details && Array.isArray(data.details)) {
          const validationErrors = data.details.map(detail => detail.msg || detail.message).join('\n');
          Alert.alert("Error de validación", validationErrors);
        } else if (data.error) {
          Alert.alert("Error", data.error);
        } else {
          Alert.alert("Error", "Error creando usuario");
        }
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
    <LinearGradient
        colors={['#33002A', 'rgba(102, 1, 84, 0.8)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.titleGradient, { fontFamily: 'Cinzel_700Bold' }]}>CREATE USER</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarLarge}>
              <Ionicons name="person-add" size={50} color="#660154" />
            </View>
            <Text style={[styles.subtitle, { fontFamily: 'Montserrat_600SemiBold' }]}>
              Enter the user details below
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: 'Montserrat_500Medium' }]}>Name<Text style={{ color: "#af0808ff" }}> *</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#660154" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontFamily: 'Montserrat_400Regular' }]}
                placeholder="Enter name"
                placeholderTextColor="#999"
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: 'Montserrat_500Medium' }]}>Last Name<Text style={{ color: "#af0808ff" }}> *</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#660154" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontFamily: 'Montserrat_400Regular' }]}
                placeholder="Enter last name"
                placeholderTextColor="#999"
                value={apellidos}
                onChangeText={setApellidos}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: 'Montserrat_500Medium' }]}>Email <Text style={{ color: "#af0808ff" }}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#660154" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontFamily: 'Montserrat_400Regular' }]}
                placeholder="example@example.com"
                placeholderTextColor="#999"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: 'Montserrat_500Medium' }]}>Role</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowRoleDropdown(!showRoleDropdown)}
            >
              <View style={styles.dropdownContent}>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {rol ? (
                    <View style={[styles.roleBadge, { backgroundColor: getRoleInfo(rol).color }]}>
                      <Ionicons name={getRoleInfo(rol).icon} size={14} color="white" />
                    </View>
                  ) : null}
                  <Text style={[styles.dropdownText, { fontFamily: 'Montserrat_400Regular', marginLeft: 8 }]}>
                    {ROLE_OPTIONS.find(r => r.value === rol)?.label || "Admin"} 
                  </Text>
                </View>
              </View>
              <Ionicons 
                name={showRoleDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#660154" 
              />
            </TouchableOpacity>
            {showRoleDropdown && (
              <View style={styles.dropdownList}>
                {ROLE_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownItem,
                      index === ROLE_OPTIONS.length - 1 && { borderBottomWidth: 0 }
                    ]}
                    onPress={() => {
                      setRol(option.value)
                      setShowRoleDropdown(false)
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.roleBadge, { backgroundColor: getRoleInfo(option.value).color }]}>
                        <Ionicons name={getRoleInfo(option.value).icon} size={14} color="white" />
                      </View>
                      <Text style={[styles.dropdownText, { fontFamily: 'Montserrat_400Regular', marginLeft: 8 }]}>
                        {option.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>


          <View style={styles.passwordInfo}>
            <View style={styles.infoRow}>
              <Ionicons name="information-circle" size={16} color="#660154" />
              <Text style={[styles.infoText, { fontFamily: 'Montserrat_400Regular' }]}>
                Default password: <Text style={{ fontWeight: '600' }}>Malbouche2025!</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity style={styles.createButton} onPress={handleCreateUser}>
            <View style={styles.buttonContent}>
              <Ionicons name="person-add" size={20} color="#fff" />
              <Text style={[styles.createButtonText, { fontFamily: 'Montserrat_700Bold' }]}>
                Create User
              </Text>
            </View>
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
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  arrowButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
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
    fontSize: 24,
    fontWeight: "700",
    color: "#660154",
    textAlign: 'center',
    marginRight: 50,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 100,
  },
  formContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#660154",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: 'center',
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(209, 148, 22, 0.3)',
    marginBottom: 25,
    marginHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "600",
    
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#f4f4f4",
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 15,
    shadowColor: "#893279ff",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#333",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#f9f9f9",
    shadowColor: "#660154",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  passwordInfo: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#660154",
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
    flex: 1,
  },
  createButton: {
    backgroundColor: "#660154",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 25,
    shadowColor: "#660154",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  createButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
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
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  
  arrowButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
  },
  
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40, // Para compensar el espacio de la flecha
  },
  
  titleGradient: {
    fontSize: 22,
    color: "#fff",
    fontWeight: '700',
  },
    roleBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  
})

export default CreateUsers
