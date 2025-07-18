import { useState, useEffect, useMemo } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, SafeAreaView, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import NavigationBar from "../../components/NavigationBar"
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'


const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api' // Fallback if env not set

const UsersScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets()
  const [selectedUser, setSelectedUser] = useState(null)
  const [viewModalVisible, setViewModalVisible] = useState(false); // Modal de visualización
  const [editModalVisible, setEditModalVisible] = useState(false); // Modal de edición
  const [editedName, setEditedName] = useState("")
  const [editedApellidos, setEditedApellidos] = useState("")
  const [editedEmail, setEditedEmail] = useState("")
  const [editedPuesto, setEditedPuesto] = useState("")
  const [editedRol, setEditedRol] = useState("")
  const [showRoleDropdown, setShowRoleDropdown] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  const currentUser = {
    id: 1,
    name: 'Almendro Isaac Medina Ramírez',
    email: 'AlmIsaMedRam@gmail.com'
  };

  const ROLE_OPTIONS = [
    { label: "Admin", value: "admin" },
    { label: "VIP", value: "vip" },
  ]

  // Función para abrir modal de visualización
  const openViewModal = (user) => {
      setSelectedUser(user);
      setViewModalVisible(true);
    };

      // Función para abrir modal de edición
  const openEditModal = () => {
    setEditedName(selectedUser.nombre || selectedUser.name);
    setEditedApellidos(selectedUser.apellidos || "");
    setEditedEmail(selectedUser.correo || selectedUser.email);
    setEditedPuesto(selectedUser.puesto || "");
    setEditedRol(selectedUser.rol || selectedUser.Rol);
    setViewModalVisible(false);
    setEditModalVisible(true);
  };


  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const searchLower = searchTerm.toLowerCase()
      return (
        (user.nombre?.toLowerCase().includes(searchLower) || 
         user.name?.toLowerCase().includes(searchLower)) ||
        (user.apellidos?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower)) || 
        (user.correo?.toLowerCase().includes(searchLower) || 
         user.email?.toLowerCase().includes(searchLower)) ||
        (user.rol?.toLowerCase().includes(searchLower) || 
         user.Rol?.toLowerCase().includes(searchLower))
      )
    })
  }, [users, searchTerm])


  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const token = await AsyncStorage.getItem('token')
        if (!token) {
          Alert.alert("Error", "could not find authentication token. Please log in again.")
          setLoading(false)
          return
        }
        const response = await fetch(`${BACKEND_URL}/users`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if (!response.ok) {
          const errorData = await response.json()
          Alert.alert("Error", errorData.error || "Error fetching users")
          setLoading(false)
          return
        }
        const data = await response.json()
        setUsers(data.data || data)
      } catch (error) {
        console.error("Error fetching users:", error)
        Alert.alert("Error", "Could not connect to server")
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const handleSave = async () => {
    if (!editedName.trim() || !editedApellidos.trim() || !editedEmail.trim()) {
      Alert.alert("Error", "Please complete the required fields: Name, Last Name, and Email");
      return;
    }
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Error", "Could not find authentication token. Please log in again.");
        return;
      }
      const userId = selectedUser.id || selectedUser._id;
      const updatedUser = {
        nombre: editedName.trim(),
        apellidos: editedApellidos.trim(),
        correo: editedEmail.trim(),
        puesto: editedPuesto.trim(),
        rol: editedRol,
      };
      
      const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert("Error", errorData.error || "Error while updating user");
        return;
      }

      // Actualizar lista de usuarios
      setUsers(prevUsers =>
        prevUsers.map(user =>
          (user.id === userId || user._id === userId) ? { ...user, ...updatedUser } : user
        )
      );
      
      Alert.alert("Success", "User successfully updated");
      setEditModalVisible(false); // Cerrar modal de edición
      setViewModalVisible(false); // Cerrar modal de visualización por si acaso
      
    } catch (error) {
      console.error("Error updating user:", error);
      Alert.alert("Error", "Could not connect to server");
    }
  };

  // Function to get role color based on role name
  const getRoleInfo = (role) => {
    const roleLower = role?.toLowerCase();
    switch(roleLower) {
      case 'vip': 
        return {
          color: '#fbb42a',
          emoji: '👑', // Corona para VIP
          label: 'VIP'
        };
      case 'admin': 
        return {
          color: '#660154',
          emoji: '⚙️', // Engranaje para Admin
          label: 'Admin'
        };
      default: 
        return {
          color: '#666',
          emoji: '👤', // Emoji genérico para otros roles
          label: role || 'User'
        };
    }
  }

  // Estilo dinámico para el FAB basado en los safe area insets
  const fabDynamicStyle = {
    ...styles.fab,
    bottom: 80 + insets.bottom, // 80px base + espacio de navegación del sistema
  }

  // Estilo dinámico para el contenido de la lista
  const listContentDynamicStyle = {
    ...styles.listContent,
    paddingBottom: 150 + insets.bottom, // Padding base + espacio de navegación del sistema
  }

const renderItem = ({ item }) => {
  const roleInfo = getRoleInfo(item.rol || item.Rol);
  
  return (
    <TouchableOpacity 
      style={styles.userCard} 
      onPress={() => openViewModal(item)} // Cambiado a openViewModal
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={24} color="#666" />
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { fontFamily: 'Montserrat_700Bold' }]}>
          {item.nombre || item.name || ''} {item.apellidos || item.lastName || ''}
        </Text>
        <Text style={[styles.userEmail, { fontFamily: 'Montserrat_400Regular' }]}>
          {item.correo || item.email}
        </Text>
        <View style={styles.roleContainer}>
          <Text style={[styles.userRol, { 
            color: roleInfo.color, 
            fontFamily: 'Montserrat_400Regular' 
          }]}>
            {roleInfo.emoji} {roleInfo.label}
          </Text>
        </View>
      </View>
      <Ionicons name="create-outline" size={20} color="#666" />
    </TouchableOpacity>
  );
}

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
      <Text style={[styles.titleGradient, { fontFamily: 'Cinzel_700Bold' }]}>USERS</Text>
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

 <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#999"
            value={searchTerm}
            onChangeText={setSearchTerm}
            clearButtonMode="while-editing"
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={filteredUsers}
          renderItem={renderItem}
          keyExtractor={item => (item.id || item._id).toString()}
          contentContainerStyle={listContentDynamicStyle}
          style={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={async () => {
            // Refresh users list
            setUsers([])
            setLoading(true)
            try {
              const token = await AsyncStorage.getItem('token')
            if (!token) {
              Alert.alert("Error", "Authentication token not found. Please log in again.")
              setLoading(false)
              return
            }
            const response = await fetch(`${BACKEND_URL}/users`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            })
            if (!response.ok) {
              const errorData = await response.json()
              Alert.alert("Error", errorData.error || "Error fetching users")
              setLoading(false)
              return
            }
            const data = await response.json()
            setUsers(data.data || data)
          } catch (error) {
            console.error("Error fetching users:", error)
            Alert.alert("Error", "Could not connect to server")
          } finally {
            setLoading(false)
          }
        }}
        />
        <TouchableOpacity 
          style={fabDynamicStyle} 
          onPress={() => navigation.navigate('CreateUsers')}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>

  
        {/* Modal de Visualización */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={viewModalVisible}
          onRequestClose={() => setViewModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setViewModalVisible(false)}
          >
            <View style={styles.viewModalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontFamily: 'Montserrat_600SemiBold' }]}>User Details</Text>
                <TouchableOpacity onPress={() => setViewModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>

                <View style={styles.avatarNameContainers}>
                  <View style={styles.avatarLarge}>
                    <Ionicons name="person" size={50} color="#666" />
                  </View>

                <View style={styles.infoName}>
                  <Text style={[styles.fullNameText, { fontFamily: 'Montserrat_600SemiBold' }]}>
                    {`${selectedUser?.nombre || selectedUser?.name || ''} ${selectedUser?.apellidos || ''}`}
                  </Text>
                </View>
              </View>
              <View>
                <View style={{ borderBottomColor: 'rgba(209, 148, 22, 0.4)', borderBottomWidth: 1, marginTop: 5, marginBottom: 15, marginLeft:30,marginRight:30, }} />
              </View>
              <View style={styles.infoRow}>
                <View style={styles.iconoContainer}>
                  <Ionicons name="mail" size={20} color="#666" />
                </View>
                <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{selectedUser?.correo || selectedUser?.email}</Text>
                </View>


                <View style={styles.infoRow}>
                  <View style={styles.iconoContainer}>
                    <Ionicons name="person" size={20} color="#666"/>
                  </View>
                  <Text style={styles.infoLabel}>Role:</Text>
                  <Text style={[styles.infoValue, { color: getRoleInfo(selectedUser?.rol || selectedUser?.Rol) }]}>
                    {selectedUser?.rol || selectedUser?.Rol}
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={openEditModal}
                >
                  <Ionicons name="create-outline" size={20} color="white" />
                  <Text style={[styles.buttonText, { fontFamily: 'Montserrat_600SemiBold' }]}>Edit User</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Modal de Edición */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setEditModalVisible(false)}>
            <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontFamily: 'Montserrat_600SemiBold' }]}>Edit User</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.avatarLarge}>
                  <Ionicons name="person" size={50} color="#666" />
                </View>
                 <View style={{ borderBottomColor: 'rgba(209, 148, 22, 0.4)', borderBottomWidth: 1, marginTop: 5, marginBottom: 20, marginLeft:30,marginRight:30, }} />
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { fontFamily: 'Montserrat_700Bold' }]}>Name</Text>
                <TextInput
                  style={[styles.input, { fontFamily: 'Montserrat_400Regular' }]}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Insert Name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { fontFamily: 'Montserrat_700Bold' }]}>Last name</Text>
                <TextInput
                  style={[styles.input, { fontFamily: 'Montserrat_400Regular' }]}
                  value={editedApellidos}
                  onChangeText={setEditedApellidos}
                  placeholder="Insert Last Name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { fontFamily: 'Montserrat_700Bold' }]}>Email</Text>
                <TextInput
                  style={[styles.input, { fontFamily: 'Montserrat_400Regular' }]}
                  value={editedEmail}
                  onChangeText={setEditedEmail}
                  placeholder="Insert Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { fontFamily: 'Montserrat_700Bold' }]}>Rol</Text>
                <TouchableOpacity 
                  style={styles.dropdownSelector}
                  onPress={() => setShowRoleDropdown(!showRoleDropdown)} 
                >
                  <Text style={[styles.dropdownSelectorText, { fontFamily: 'Montserrat_400Regular' }]}>
                    {editedRol || "Select Role"} 
                  </Text>
                  <Ionicons 
                    name={showRoleDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#666" 
                  />
                </TouchableOpacity>
                
                {showRoleDropdown && (
                  <View style={styles.dropdownOptions}>
                    {ROLE_OPTIONS.map((role, index) => (
                      <TouchableOpacity
                        key={role.value}
                        style={[
                          styles.dropdownOption,
                          index === ROLE_OPTIONS.length - 1 && { borderBottomWidth: 0 }
                        ]}
                        onPress={() => {
                          setEditedRol(role.value);
                          setShowRoleDropdown(false);
                        }}
                      >
                        <Text style={[styles.dropdownOptionText, { fontFamily: 'Montserrat_400Regular' }]}>{role.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
              >
                <Text style={[styles.saveButtonText, { fontFamily: 'Montserrat_700Bold' }]}>
                  Save Changes
                </Text>
              </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

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
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",

  },
  userList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
    searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    height: 45,
    shadowColor: '#660154',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Montserrat_400Regular',
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 5,
    marginLeft: 5,
  },

  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    // paddingBottom se define dinámicamente con listContentDynamicStyle
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderColor: "rgba(209, 148, 22, 0.4)",
    borderWidth: 1,
    padding: 15,
    marginVertical: 8,
    shadowColor: "rgba(102, 1, 84,0.8)",
    elevation: 5,
  },
   userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  userRol: {
  fontSize: 14,
  fontWeight: "500",
  marginLeft: 4,
  },
  roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#f4f4f4",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    backgroundColor: "#660154",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#660154",
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    color: "white",
  },
  closeButton: {
    padding: 5,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "center",
  },
   label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 8,
  },
    input: { 
    borderWidth: 1,
    borderColor: "#ccc", 
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 15,
    shadowColor: "#660154",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },

  dropdownSelector: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderRadius: 8,
  padding: 12,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: '#ccc',
  shadowColor: '#660154',
  elevation: 2,
},
  dropdownSelectorText: {
    fontSize: 16,
    color: '#333',
},
  dropdownOptions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 5,
    zIndex: 1000, 
},
  dropdownOption: {
    padding: 12,
},
  dropdownOptionText: {
    fontSize: 16,
    color: '#333',
},
  saveButton: {
    backgroundColor: "#660154",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#660154",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  fab: {
    position: "absolute",
    right: 20,
    // bottom se define dinámicamente con fabDynamicStyle
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
  viewModalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 15,
 
  },
  avatarNameContainers: {
    alignItems: 'center',
    marginBottom: 15,
  },
  infoName: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 15,
  },
  fullNameText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flexWrap: 'wrap',       // permite múltiples líneas
    maxWidth: '100%',    
  },
  iconoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 5,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: 'Montserrat_600SemiBold',
    color: '#666',
    fontSize: 16,
    paddingRight: 10,
  },
  infoValue: {
    fontFamily: 'Montserrat_400Regular',
    color: '#333',
    fontSize: 16,
    width: '90%',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#660154',
    paddingVertical: 12,
    marginHorizontal:20,
    borderRadius: 8,
    marginTop: 35,
    shadowColor: '#660154',
    elevation: 3

  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontFamily: 'Montserrat_600SemiBold',
  },
})

export default UsersScreen
