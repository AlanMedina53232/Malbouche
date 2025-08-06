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
  const [selectedRoleFilter, setSelectedRoleFilter] = useState(null);


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
    const searchLower = searchTerm.toLowerCase();
    const userRole = user.rol?.toLowerCase() || user.Rol?.toLowerCase();
    const matchesSearch =
      (user.nombre?.toLowerCase().includes(searchLower) || 
       user.name?.toLowerCase().includes(searchLower)) ||
      (user.apellidos?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower)) || 
      (user.correo?.toLowerCase().includes(searchLower) || 
       user.email?.toLowerCase().includes(searchLower)) ||
      (userRole?.includes(searchLower));
    const matchesRole = selectedRoleFilter ? userRole === selectedRoleFilter : true;
    return matchesSearch && matchesRole;
  });
}, [users, searchTerm, selectedRoleFilter]);



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

  // Function to delete a user
  const handleDelete = async () => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete ${selectedUser?.nombre || selectedUser?.name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              if (!token) {
                Alert.alert("Error", "No authentication token found. Please log in again.");
                return;
              }

              const userId = selectedUser.id || selectedUser._id;
              const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
                method: "DELETE",
                headers: {
                  "Authorization": `Bearer ${token}`,
                },
              });

              const data = await response.json();
              
              if (response.ok && data.success) {
                // Update local state
                setUsers((prevUsers) => prevUsers.filter((user) => 
                  (user.id !== userId && user._id !== userId)
                ));
                Alert.alert("Success", "User deleted successfully!");
                setViewModalVisible(false);
              } else {
                console.error("Backend delete error:", data);
                Alert.alert("Error", data.error || "Failed to delete user");
              }
            } catch (error) {
              console.error("Error deleting user:", error);
              Alert.alert("Error", "Failed to connect to server");
            }
          },
        },
      ]
    );
  };

  // Function to get role color based on role name
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
        color: '#0b2b70ff',
        icon: 'person',
        label: 'Usuario'
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
      onPress={() => openViewModal(item)}
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
          <View style={[styles.roleBadge, { backgroundColor: roleInfo.color }]}>
            <Ionicons name={roleInfo.icon} size={14} color="white" />
          </View>
          <Text style={[styles.userRol, { 
            color: roleInfo.color, 
            fontFamily: 'Montserrat_400Regular' 
          }]}>
            {roleInfo.label}
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
          <Text style={[styles.titleGradient, { fontFamily: 'Montserrat_700Bold' }]}>USERS</Text>
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
      {/* Solo el icono de filtro aquí */}
    <TouchableOpacity
      style={styles.filterIconContainer}
      onPress={() => setShowRoleDropdown(!showRoleDropdown)}
      activeOpacity={0.8}
    >
      <Ionicons name="filter" size={22} color="#660154" />
      {selectedRoleFilter ? (
        <View style={[styles.roleBadge, { backgroundColor: getRoleInfo(selectedRoleFilter).color, marginLeft: 4 }]}>
          <Ionicons name={getRoleInfo(selectedRoleFilter).icon} size={12} color="white" />
        </View>
      ) : null}
    </TouchableOpacity>
    </View>
    {showRoleDropdown && (
      <View style={styles.dropdownOverlay}>
        <TouchableOpacity
          style={styles.dropdownOptionsSearch}
          activeOpacity={1}
        >
          <TouchableOpacity
            style={styles.dropdownOption}
            onPress={() => {
              setSelectedRoleFilter(null);
              setShowRoleDropdown(false);
            }}
          >
            <Text style={[styles.dropdownOptionText, { fontFamily: 'Montserrat_400Regular' }]}>All</Text>
          </TouchableOpacity>
          {ROLE_OPTIONS.map((role, index) => (
            <TouchableOpacity
              key={role.value}
              style={[
                styles.dropdownOption,
                index === ROLE_OPTIONS.length - 1 && { borderBottomWidth: 0 }
              ]}
              onPress={() => {
                setSelectedRoleFilter(role.value);
                setShowRoleDropdown(false);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.roleBadge, { backgroundColor: getRoleInfo(role.value).color }]}>
                  <Ionicons name={getRoleInfo(role.value).icon} size={14} color="white" />
                </View>
                <Text style={[styles.dropdownOptionText, { fontFamily: 'Montserrat_400Regular', marginLeft: 8 }]}>{role.label}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </View>
    )}

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
              {/* Header con gradiente */}
              <LinearGradient
                colors={['#660154', '#a5639bff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalHeaderGradient}
              >
                <Text style={[styles.modalTitle, { fontFamily: 'Montserrat_700Bold' }]}>
                  User Details
                </Text>
                <TouchableOpacity 
                  onPress={() => setViewModalVisible(false)}
                  style={styles.closeButtonModal}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </LinearGradient>
              
              <View style={styles.modalBody}>
                {/* Avatar y nombre */}
                <View style={styles.avatarNameSection}>
                  <View style={styles.avatarLargeImproved}>
                    <View style={styles.avatarInner}>
                      <Ionicons name="person" size={50} color="#660154" />
                    </View>
                  </View>
                  <Text style={[styles.fullNameText, { fontFamily: 'Montserrat_700Bold' }]}>
                    {`${selectedUser?.nombre || selectedUser?.name || ''} ${selectedUser?.apellidos || ''}`}
                  </Text>
                  {/* Badge del rol */}
                    <View style={[styles.roleBadgeLarge, { backgroundColor: getRoleInfo(selectedUser?.rol || selectedUser?.Rol).color }]}>
                      <Ionicons 
                        name={getRoleInfo(selectedUser?.rol || selectedUser?.Rol).icon} 
                        size={16} 
                        color="white" 
                      />
                        <Text style={[styles.roleBadgeText, { fontFamily: 'Montserrat_600SemiBold' }]}>
                          {getRoleInfo(selectedUser?.rol || selectedUser?.Rol).label}
                        </Text>
                    </View>
                  </View>

                  <View style={styles.dividerModal} />

                  {/* Información de contacto */}
                  <View style={styles.infoSection}>
                    <Text style={[styles.sectionTitle, { fontFamily: 'Montserrat_600SemiBold' }]}>
                      Contact Information
                    </Text>
                    
                    <View style={styles.infoCard}>
                      <View style={styles.infoRowImproved}>
                        <View style={styles.iconContainer}>
                    <Ionicons name="mail" size={20} color="#660154" />
                      </View>
                      <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabelImproved, { fontFamily: 'Montserrat_500Medium' }]}>
                          Email
                        </Text>
                        <Text style={[styles.infoValueImproved, { fontFamily: 'Montserrat_400Regular' }]}>
                          {selectedUser?.correo || selectedUser?.email}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Botones de acción */}
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.editButtonImproved}
                    onPress={openEditModal}
                  >
                    <LinearGradient
                      colors={['#660154', '#a5639bff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="create-outline" size={20} color="white" />
                      <Text style={[styles.buttonTextImproved, { fontFamily: 'Montserrat_600SemiBold' }]}>
                        Edit User
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.deleteButtonImproved}
                    onPress={handleDelete}
                  >
                    <View style={styles.deleteButtonInner}>
                      <Ionicons name="trash-outline" size={20} color="#dc2626" />
                      <Text style={[styles.deleteButtonText, { fontFamily: 'Montserrat_600SemiBold' }]}>
                        Delete User
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
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
            <TouchableOpacity style={styles.viewModalContent} activeOpacity={1} onPress={() => {}}>
              {/* Header con gradiente - reutiliza modalHeaderGradient */}
              <LinearGradient
                colors={['#660154', '#a5639bff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalHeaderGradient}
              >
                <Text style={[styles.modalTitle, { fontFamily: 'Montserrat_700Bold' }]}>
                  Edit User
                </Text>
                <TouchableOpacity 
                  onPress={() => setEditModalVisible(false)}
                  style={styles.closeButtonModal}
                >
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </LinearGradient>

              <View style={styles.modalBody}>
                {/* Avatar y título - reutiliza avatarNameSection */}
                <View style={[styles.avatarNameSection, { paddingBottom: 5 }]}>
                  <View style={styles.avatarLargeImproved}>
                    <View style={styles.avatarInner}>
                      <Ionicons name="person" size={40} color="#660154" />
                    </View>
                  </View>
                  <Text style={[styles.editSubtitle, { fontFamily: 'Montserrat_600SemiBold' }]}>
                    Edit User Details
                  </Text>
                </View>

                {/* Divisor - reutiliza dividerModal */}
                <View style={[styles.dividerModal, { marginVertical: 15, marginHorizontal: 20 }]} />

                {/* Campos del formulario */}
                <View style={styles.editFormContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, styles.editLabel, { fontFamily: 'Montserrat_700Bold' }]}>Name<Text style={{ color: "#af0808ff" }}> *</Text> </Text>
                    <View style={[styles.searchContainer, styles.editInputWrapper]}>
                      <Ionicons name="person-outline" size={20} color="#660154" style={styles.searchIcon} />
                      <TextInput
                        style={[styles.searchInput, styles.editInput, { fontFamily: 'Montserrat_400Regular' }]}
                        value={editedName}
                        onChangeText={setEditedName}
                        placeholder="Enter name"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, styles.editLabel, { fontFamily: 'Montserrat_700Bold' }]}>Last Name<Text style={{ color: "#af0808ff" }}> *</Text> </Text>
                    <View style={[styles.searchContainer, styles.editInputWrapper]}>
                      <Ionicons name="person-outline" size={20} color="#660154" style={styles.searchIcon} />
                      <TextInput
                        style={[styles.searchInput, styles.editInput, { fontFamily: 'Montserrat_400Regular' }]}
                        value={editedApellidos}
                        onChangeText={setEditedApellidos}
                        placeholder="Enter last name"
                        placeholderTextColor="#999"
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, styles.editLabel, { fontFamily: 'Montserrat_700Bold' }]}>Email<Text style={{ color: "#af0808ff" }}> *</Text> </Text>
                    <View style={[styles.searchContainer, styles.editInputWrapper]}>
                      <Ionicons name="mail-outline" size={20} color="#660154" style={styles.searchIcon} />
                      <TextInput
                        style={[styles.searchInput, styles.editInput, { fontFamily: 'Montserrat_400Regular' }]}
                        value={editedEmail}
                        onChangeText={setEditedEmail}
                        placeholder="example@mail.com"
                        placeholderTextColor="#999"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, styles.editLabel, { fontFamily: 'Montserrat_700Bold' }]}>Role</Text>
                    <TouchableOpacity 
                      style={[styles.searchContainer, styles.editDropdown]}
                      onPress={() => setShowRoleDropdown(!showRoleDropdown)} 
                      activeOpacity={0.8}
                    >
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        {editedRol ? (
                          <View style={[styles.roleBadge, { backgroundColor: getRoleInfo(editedRol).color }]}>
                            <Ionicons name={getRoleInfo(editedRol).icon} size={14} color="white" />
                          </View>
                        ) : null}
                        <Text style={[styles.searchInput, styles.editDropdownText, { fontFamily: 'Montserrat_400Regular', marginLeft: 8 }]}>
                          {ROLE_OPTIONS.find(r => r.value === editedRol)?.label || "Seleccionar rol"} 
                        </Text>
                      </View>
                      <Ionicons 
                        name={showRoleDropdown ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color="#660154" 
                        style={{ marginLeft: 8 }}
                      />
                    </TouchableOpacity>
                    
                    {showRoleDropdown && (
                      <View style={[styles.dropdownOptionsSearch, styles.editDropdownList]}>
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
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <View style={[styles.roleBadge, { backgroundColor: getRoleInfo(role.value).color }]}>
                                <Ionicons name={getRoleInfo(role.value).icon} size={14} color="white" />
                              </View>
                              <Text style={[styles.dropdownOptionText, { fontFamily: 'Montserrat_400Regular', marginLeft: 8 }]}>
                                {role.label}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Botón de guardar*/}
                  <TouchableOpacity 
                    style={[styles.editButtonImproved, { marginTop: 20 }]}
                    onPress={handleSave} 
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#660154', '#a5639bff']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="checkmark-outline" size={20} color="white" />
                      <Text style={[styles.buttonTextImproved, { fontFamily: 'Montserrat_700Bold' }]}>
                        Save Changes
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
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
    width: "92%",
    maxWidth: 400,
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  
  modalHeaderGradient: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 25,
  },
  
  closeButtonModal: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  avatarNameSection: {
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 10,
  },
  
  avatarLargeImproved: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 3,
    borderColor: "#660154",
  },
  
  avatarInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  
  fullNameText: {
    textAlign: 'center',
    fontSize: 20,
    color: '#333',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  
  roleBadgeLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  roleBadgeText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
  },
  
  dividerModal: {
    height: 1,
    backgroundColor: 'rgba(209, 148, 22, 0.3)',
    marginVertical: 20,
    marginHorizontal: 30,
  },
  
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 16,
    color: '#660154',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#660154',
  },
  
  infoRowImproved: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  
  infoTextContainer: {
    flex: 1,
  },
  
  infoLabelImproved: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  
  infoValueImproved: {
    fontSize: 16,
    color: '#333',
  },
  
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    gap: 12,
  },
  
  editButtonImproved: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#660154",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  
  buttonTextImproved: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
  },
  
  deleteButtonImproved: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#dc2626',
    backgroundColor: '#fff',
  },
  
  deleteButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  
  deleteButtonText: {
    color: '#dc2626',
    marginLeft: 8,
    fontSize: 16,
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
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc2626',
    paddingVertical: 12,
    marginHorizontal:20,
    borderRadius: 8,
    marginTop: 15,
    shadowColor: '#dc2626',
    elevation: 3
  },
  buttonText: {
    color: 'white',
    marginLeft: 8,
    fontFamily: 'Montserrat_600SemiBold',
  },
roleBadge: {
  width: 28,
  height: 28,
  borderRadius: 14,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 2,
},

filterIconContainer: {
  marginLeft: 8,
  flexDirection: 'row',
  alignItems: 'center',
  padding: 4,
  borderRadius: 8,
  backgroundColor: '#f4f4f4',
  borderWidth: 1,
  borderColor: '#eee',
},
dropdownOverlay: {
  position: 'absolute',
  top: 155, // ajusta según la altura de tu header + searchContainer
  right: 15,
  zIndex: 9999,
  elevation: 20,
},
dropdownOptionsSearch: {
  backgroundColor: '#fff',
  borderRadius: 8,
  shadowColor: '#660154',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.15,
  shadowRadius: 4,
  elevation: 15,
  minWidth: 150,
},
editSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: 'center',
    marginTop: 5,
  },

  editFormContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  editLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "600",
  },

  editInputWrapper: {
    marginHorizontal: 0, // quita el margin del searchContainer original
    marginVertical: 0,   // quita el margin del searchContainer original
    marginBottom: 15,    // solo bottom margin para separar inputs
  },

  editInput: {
    fontSize: 16, // sobrescribe el fontSize del searchInput si es necesario
  },

  editDropdown: {
    marginHorizontal: 0,
    marginVertical: 0,
    marginBottom: 5,
    paddingRight: 10, // espacio para la flecha
  },

  editDropdownText: {
    color: "#333", // sobrescribe el color del searchInput
  },

  editDropdownList: {
    position: 'relative', // cambia de absolute a relative
    top: 0,               // resetea el top
    right: 0,             // resetea el right
    marginTop: 8,
    zIndex: 1000,
  },
  
})

export default UsersScreen
