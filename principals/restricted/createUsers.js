import { useState, useEffect } from "react"
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
  ScrollView, 
  Keyboard
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
  const r = (role || '').toLowerCase();
  switch (r) {
    case 'vip':
      return { bg: '#404040', text: '#f2f2f2', label: 'VIP' };
    case 'admin':
      return { bg: '#8C8C8C', text: '#f2f2f2', label: 'Admin' };
    default:
      return { bg: '#0b2b70ff', text: '#f2f2f2', label: role || 'Usuario' };
  }
}

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api' // Fallback if env not set

const CreateUsers = ({ navigation }) => {
  const [nombre, setNombre] = useState("")
  const [apellidos, setApellidos] = useState("")
  const [correo, setCorreo] = useState("")
  const [rol, setRol] = useState("vip") // default "vip"
  const [keyboardVisible, setKeyboardVisible] = useState(false);
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

 useEffect(() => {
    const s = Keyboard.addListener('keyboardDidShow', () => { setKeyboardVisible(true); setShowRoleDropdown(false) })
    const h = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false))
    return () => { s.remove(); h.remove() }
  }, [])


  return (
  <SafeAreaView style={styles.safeArea}>
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
    <LinearGradient
        colors={['#404040', '#404040']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.arrowButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#f2f2f2" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={[styles.titleGradient, { fontFamily: 'Combo_400Regular' }]}>CREATE USER</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        style={{ flex: 1 }}                                   // <-- ocupa el alto
        contentContainerStyle={[
          styles.scrollContainer,
          { flexGrow: 1, paddingBottom: keyboardVisible ? 24 : 100 } // <-- padding dinámico
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <View style={styles.formContainer}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarLarge}>
                    <LinearGradient
                      colors={['#bfbfbf', '#404040']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatarGradient}
                    >
                     <Ionicons name="person" size={40} color="#f2f2f2" />
                    </LinearGradient>
            </View>
            <Text style={[styles.subtitle, { fontFamily: 'Combo_400Regular' }]}>
              Enter the user details below
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: 'Combo_400Regular' }]}>Name<Text style={{ color: "#631b1bff" }}> *</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontFamily: 'Combo_400Regular' }]}
                placeholder="Enter name"
                placeholderTextColor="#bfbfbfbf"
                value={nombre}
                onChangeText={setNombre}
                autoCapitalize="words"
                onFocus={() => setShowRoleDropdown(false)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: 'Combo_400Regular' }]}>Last Name<Text style={{ color: "#631b1bff" }}> *</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontFamily: 'Combo_400Regular' }]}
                placeholder="Enter last name"
                placeholderTextColor="#bfbfbfbf"
                value={apellidos}
                onChangeText={setApellidos}
                autoCapitalize="words"
                onFocus={() => setShowRoleDropdown(false)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: 'Combo_400Regular' }]}>Email <Text style={{ color: "#631b1bff" }}>*</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#8c8c8c" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { fontFamily: 'Combo_400Regular' }]}
                placeholder="example@example.com"
                placeholderTextColor="#bfbfbfbf"
                value={correo}
                onChangeText={setCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setShowRoleDropdown(false)}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { fontFamily: 'Combo_400Regular' }]}>Role</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowRoleDropdown(!showRoleDropdown)}
            >
              <View style={styles.dropdownContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  {rol ? (
                    <View style={[styles.roleDot, { backgroundColor: getRoleInfo(rol).bg }]} />
                  ) : null}
                  <Text style={[styles.dropdownText, { fontFamily: 'Combo_400Regular', marginLeft: 8 }]}>
                    {ROLE_OPTIONS.find(r => r.value === rol)?.label || getRoleInfo(rol).label}
                  </Text>
                </View>
              </View>
              <Ionicons 
                name={showRoleDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#404040" 
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
                      <View style={[styles.roleDot, { backgroundColor: getRoleInfo(option.value).bg }]} />
                      <Text style={[styles.dropdownText, { fontFamily: 'Combo_400Regular', marginLeft: 8 }]}>
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
              <Ionicons name="information-circle" size={16} color="#404040" />
              <Text style={[styles.infoText, { fontFamily: 'Combo_400Regular' }]}>
                Default password: <Text style={{ borderBottomWidth: 1, color: '#262626' }}>Malbouche2025!</Text>
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.createButton} 
            onPress={handleCreateUser}
          >
            <LinearGradient
              colors={['#404040', '#404040']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="person-add" size={20} color="#f2f2f2" />
              <Text style={[styles.createButtonText, { fontFamily: 'Combo_400Regular' }]}>
                Create User
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
 {/*    <NavigationBar /> */}
  </SafeAreaView>
)
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  arrowButton: {
    marginRight: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F2',
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
    color: "#404040",
    textAlign: 'center',
    marginRight: 50,
  },
  scrollContainer: {
    paddingBottom: 100,
  },
  formContainer: {
    borderRadius: 15,
    padding: 20,

  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarLarge: {
    marginBottom: 20,
  },
  avatarGradient: {
    width: 90,
    height: 90,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: "#8C8C8C",
    textAlign: 'center',
    marginTop: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#404040',
    marginBottom: 25,
    marginHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#404040",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#8c8c8c",
    borderRadius: 12,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#404040",
  },
  dropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#8c8c8c",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: "#f2f2f2",
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownText: {
    fontSize: 16,
    color: "#404040",
  },
  dropdownList: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginTop: 1,
    borderWidth: 1,
    borderColor: "#bfbfbf",
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#bfbfbf",
  },
  passwordInfo: {
    backgroundColor: "#bfbfbf22",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#404040",
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  createButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  createButtonText: {
    color:'#f2f2f2',
    marginLeft: 8,
    fontSize: 16,
  },
    buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  
  headerGradient: {
    paddingTop: 38,
    paddingBottom: 10,
    paddingHorizontal: 20,
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
    color: "#f2f2f2",
  },
  roleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 4,
  },
  
})

export default CreateUsers
