import { useState, useEffect, useMemo } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, SafeAreaView, Alert, Image, KeyboardAvoidingView, Keyboard, Platform, ScrollView } from "react-native"
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
  const [keyboardVisible, setKeyboardVisible] = useState(false);



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
    const s = Keyboard.addListener('keyboardDidShow', () => { setKeyboardVisible(true); setShowRoleDropdown(false) })
    const h = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false))
    return () => { s.remove(); h.remove() }
  }, [])

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
  const r = (role || '').toLowerCase();
  switch (r) {
    case 'vip':
      return { bg: '#404040', text: '#fff', label: 'VIP' };
    case 'admin':
      return { bg: '#8C8C8C', text: '#fff', label: 'Admin' };
    default:
      return { bg: '#0b2b70ff', text: '#fff', label: 'Usuario' };
  }
};

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
        <Ionicons name="person" size={24} color="#3A3A3B" />
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { fontFamily: 'Combo_400Regular' }]}>
          {item.nombre || item.name || ''} {item.apellidos || item.lastName || ''}
        </Text>
        <Text style={[styles.userEmail, { fontFamily: 'Combo_400Regular' }]}>
          {item.correo || item.email}
        </Text>
        
        <View style={styles.roleContainer}>
          <View style={[styles.rolePill, { backgroundColor: roleInfo.bg }]}>
            <Text style={[styles.rolePillText, { color: roleInfo.text, fontFamily: 'Combo_400Regular' }]}>
              {roleInfo.label}
            </Text>
          </View>
        </View>
      </View>
      <Ionicons name="create-outline" size={20} color="#666" />
    </TouchableOpacity>
  );
}

  return (
    <LinearGradient
          colors={['#8C8C8C', '#3a3a3bc8', '#2e2e2ec5']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.container}
        >
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#a6a6a6', '#a6a6a6']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.headerGradient}
        >
        <View style={styles.headerContent}>
        {/* <View style={styles.titleContainer}>
          <Text style={[styles.titleGradient, { fontFamily: 'Combo_400Regular' }]}>USERS</Text>
        </View> */}
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('UserDetail', { user: currentUser })}
        >
          <View style={styles.avatarSmall}>
            <Ionicons name="person" size={20} color="#404040" />
          </View>
        </TouchableOpacity>
      </View>
    </LinearGradient>
            <View style={styles.listHeader}>
              <Text style={[styles.subtitle, { fontFamily: 'Combo_400Regular' }]}>
                USERS
              </Text>
          {/* Top */}
      {/*   <LinearGradient
              colors={['#D6D6D6', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.fadeTopBottom, { top: 0 }]}
            /> */}
            </View>    

    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#404040" style={styles.searchIcon} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search users..."
        placeholderTextColor="#bfbfbf"
        value={searchTerm}
        onChangeText={setSearchTerm}
        clearButtonMode="while-editing"
      />
      {searchTerm ? (
        <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color="#bfbfbf" />
        </TouchableOpacity>
      ) : null}
      {/* Solo el icono de filtro aquí */}
    <TouchableOpacity
      style={styles.filterIconContainer}
      onPress={() => setShowRoleDropdown(!showRoleDropdown)}
      activeOpacity={0.8}
    >
      <Ionicons name="filter" size={22} color="#404040" />
        {selectedRoleFilter ? (
          <View style={[styles.roleDot, { backgroundColor: getRoleInfo(selectedRoleFilter).bg }]} />
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
            <Text style={[styles.dropdownOptionText, { fontFamily: 'Combo_400Regular' }]}>All</Text>
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
                <View style={[styles.roleDot, { backgroundColor: getRoleInfo(role.value).bg }]} />
                <Text style={[styles.dropdownOptionText, { fontFamily: 'Combo_400Regular', marginLeft: 8 }]}>
                  {role.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </TouchableOpacity>
      </View>
    )}
    <View style={styles.fixedHeader}>
      <Image 
        source={require('../../assets/malbouche2.jpg')} 
        style={styles.fixedHeaderImage}
        resizeMode='cover'
      />        
        <View style={styles.fadeOverlays} pointerEvents="none">
          {/* Top Degradado */}
            <LinearGradient
              colors={['#b5b4b4ff', 'transparent']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.fadeSide, { top: 0 }]}
            />
            {/* Bottom  degradado*/}
            <LinearGradient
              colors={['transparent', '#717171']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[styles.fadeTopBottom, { bottom: 0 }]}
            />
        </View>
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

  
        {/* Modal de User details */}
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
                colors={['#404040', '#404040']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.modalHeaderGradient}
              >
                <Text style={[styles.modalTitle, { fontFamily: 'Combo_400Regular'  }]}>
                  User Details
                </Text>
                <TouchableOpacity 
                  onPress={() => setViewModalVisible(false)}
                  style={styles.closeButtonModal}
                >
                  <Ionicons name="close" size={24} color="#f2f2f2" />
                </TouchableOpacity>
              </LinearGradient>
              
              <View style={styles.modalBody}>
                {/* Avatar y nombre */}
                <View style={styles.avatarNameSection}>
                  <View style={styles.avatarLargeImproved}>
                    <LinearGradient
                      colors={['#bfbfbf', '#404040']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.avatarGradient}
                    >
                     <Ionicons name="person" size={40} color="#f2f2f2" />
                    </LinearGradient>
                  </View>
                  <Text style={[styles.fullNameText, { fontFamily: 'Combo_400Regular' }]}>
                    {`${selectedUser?.nombre || selectedUser?.name || ''} ${selectedUser?.apellidos || ''}`}
                  </Text>
                    {/* Badge del rol */}
                    <View style={[styles.roleBadgeLarge, { backgroundColor: getRoleInfo(selectedUser?.rol || selectedUser?.Rol).bg }]}>
                      <Text style={[styles.roleBadgeText, { color: getRoleInfo(selectedUser?.rol || selectedUser?.Rol).text, fontFamily: 'Combo_400Regular' }]}>
                        {getRoleInfo(selectedUser?.rol || selectedUser?.Rol).label}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.dividerModal} />

                  {/* Información de contacto */}
                  <View style={styles.infoSection}>
                    <Text style={[styles.sectionTitle, { fontFamily: 'Combo_400Regular' }]}>
                      Contact Information
                    </Text>
                    
                    <View style={styles.infoCard}>
                      <View style={styles.infoRowImproved}>
                        <View style={styles.iconContainer}>
                    <Ionicons name="mail" size={20} color="#404040" />
                      </View>
                      <View style={styles.infoTextContainer}>
                        <Text style={[styles.infoLabelImproved, { fontFamily: 'Combo_400Regular' }]}>
                          Email
                        </Text>
                        <Text style={[styles.infoValueImproved, { fontFamily: 'Combo_400Regular' }]}>
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
                      colors={['#8c8c8c', '#8c8c8c']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="create-outline" size={20} color="white" />
                      <Text style={[styles.buttonTextImproved, { fontFamily: 'Combo_400Regular' }]}>
                        Edit User
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.editButtonImproved}
                    onPress={handleDelete}
                  >
                    <LinearGradient
                      colors={['#262626', '#262626']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="trash-outline" size={20} color="#f2f2f2" />
                      <Text style={[styles.deleteButtonText, { fontFamily: 'Combo_400Regular' }]}>
                        Delete User
                      </Text>
                    
                    </LinearGradient>

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
          presentationStyle="fullScreen"
          visible={editModalVisible}
          onRequestClose={() => setEditModalVisible(false)}
        >
          <SafeAreaView style={styles.fullscreenModal}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={undefined}           // Android: deja que la ventana haga resize
              keyboardVerticalOffset={0}
            >
              <LinearGradient
              colors={['#404040', '#404040']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeaderGradient}
            >
              <Text style={[styles.modalTitle, { fontFamily: 'Combo_400Regular' }]}>
                Edit User
              </Text>
                  <TouchableOpacity 
                    onPress={() => setEditModalVisible(false)}
                    style={styles.closeButtonModal}
                  >
                    <Ionicons name="close" size={24} color="#f2f2f2" />
                  </TouchableOpacity>
            </LinearGradient>
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={[styles.modalBodyScroll, { paddingBottom: keyboardVisible ? 24 : 100 }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
            >
                <View style={styles.modalBody}>
                  <View style={[styles.avatarNameSection, { paddingBottom: 5 }]}>
                    <View style={styles.avatarLargeImproved}>
                      <LinearGradient
                        colors={['#bfbfbf', '#404040']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.avatarGradient}
                      >
                      <Ionicons name="person" size={40} color="#f2f2f2" />
                      </LinearGradient>
                    </View>
                    <Text style={[styles.editSubtitle, { fontFamily: 'Combo_400Regular' }]}>
                      Edit User Details
                    </Text>
                  </View>

                  {/* Divisor - reutiliza dividerModal */}
                  <View style={[styles.dividerModal, { marginVertical: 15, marginHorizontal: 20 }]} />

                  {/* Campos del formulario */}
                  <View style={styles.editFormContainer}>
                    <View style={styles.inputContainer}>
                      <Text style={[ styles.editLabel, { fontFamily: 'Combo_400Regular' }]}>Name<Text style={{ color: "#af0808ff" }}> *</Text> </Text>
                      <View style={[styles.editModalInput, styles.editInputWrapper]}>
                        <Ionicons name="person-outline" size={20} color="#8c8c8c" style={styles.searchIcon} />
                        <TextInput
                          style={[styles.searchInput, styles.editInput, { fontFamily: 'Combo_400Regular' }]}
                            value={editedName}
                            onChangeText={setEditedName}
                            placeholder="Enter name"
                            placeholderTextColor="#bfbfbf"
                            onFocus={() => setShowRoleDropdown(false)}   // cierra dropdown
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, styles.editLabel, { fontFamily: 'Combo_400Regular' }]}>Last Name<Text style={{ color: "#af0808ff" }}> *</Text> </Text>
                      <View style={[styles.editModalInput, styles.editInputWrapper]}>
                        <Ionicons name="person-outline" size={20} color="#8c8c8c" style={styles.searchIcon} />
                        <TextInput
                          style={[styles.searchInput, styles.editInput, { fontFamily: 'Combo_400Regular' }]}
                          value={editedApellidos}
                          onChangeText={setEditedApellidos}
                          placeholder="Enter last name"
                          placeholderTextColor="#bfbfbf"
                          onFocus={() => setShowRoleDropdown(false)}   // cierra dropdown
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, styles.editLabel, { fontFamily: 'Combo_400Regular' }]}>Email<Text style={{ color: "#af0808ff" }}> *</Text> </Text>
                      <View style={[styles.editModalInput, styles.editInputWrapper]}>
                        <Ionicons name="mail-outline" size={20} color="#8c8c8c" style={styles.searchIcon} />
                        <TextInput
                          style={[styles.searchInput, styles.editInput, { fontFamily: 'Combo_400Regular' }]}
                          value={editedEmail}
                          onChangeText={setEditedEmail}
                          placeholder="example@mail.com"
                          placeholderTextColor="#bfbfbf"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          onFocus={() => setShowRoleDropdown(false)}   // cierra dropdown
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, styles.editLabel, { fontFamily: 'Combo_400Regular' }]}>Role</Text>
                      <TouchableOpacity 
                        style={[styles.editModalInput, styles.editDropdown]}
                        onPress={() => setShowRoleDropdown(!showRoleDropdown)} 
                        activeOpacity={0.8}
                      >
                        
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                          {editedRol ? (
                            <View style={[styles.roleDot, { backgroundColor: getRoleInfo(editedRol).bg }]} />
                          ) : null}
                          <Text style={[styles.searchInput, styles.editDropdownText, { fontFamily: 'Combo_400Regular', marginLeft: 8 }]}>
                            {ROLE_OPTIONS.find(r => r.value === editedRol)?.label || "Seleccionar rol"}
                          </Text>
                        </View>
                        <Ionicons 
                          name={showRoleDropdown ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color="#404040" 
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
                              <View style={{ flexDirection: 'row', alignItems: 'center'}}>
                                <View style={[styles.roleDot, { backgroundColor: getRoleInfo(role.value).bg }]} />
                                <Text style={[styles.dropdownOptionText, { fontFamily: 'Combo_400Regular', marginLeft: 8 }]}>
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
                        colors={['#404040', '#404040']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={styles.buttonGradient}
                      >
                        <Ionicons name="checkmark-outline" size={20} color="#f2f2f2" />
                        <Text style={[styles.buttonTextImproved, { fontFamily: 'Combo_400Regular' }]}>
                          Save Changes
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
            </ScrollView>

            </KeyboardAvoidingView>

          </SafeAreaView>
        </Modal>

        <NavigationBar />
      </View>
    </SafeAreaView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 38,
    paddingBottom: 110,
    paddingHorizontal: 20,
},
headerContent: {
  alignItems: 'flex-end',
  zIndex: 1,

},
fixedHeader: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 250, // puedes ajustar
  zIndex: 0, // detrás del contenido
  overflow: 'hidden',
},

fixedHeaderImage: {
  width: '100%',
  height: '130%',
},

listHeader: {
  alignItems: 'flex-start',
  marginTop: -50,
  zIndex: 1,
},
fadeOverlays: {
    position: 'absolute',
    inset: 0,
  },
fadeSide: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 30, // alto del difuminado superior/inferior
  },
fadeTopBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 50, // alto del difuminado superior/inferior
  },
subtitle: {
    fontSize: 30,
    textAlign: "left",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 20,
    color: "#3A3A3B",
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
    backgroundColor: '#f2f2f2',
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
    backgroundColor: '#f2f2f2aa',
    borderRadius: 10,
    marginHorizontal: 15,
    marginBottom: 8,
    paddingHorizontal: 15,
    height: 45,
    zIndex: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Combo_400Regular',
    fontSize: 16,
    color: '#404040',
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
  },
  userCard: { 
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2a7",
    borderRadius: 8,
    padding: 15,
    marginVertical: 5,
  },
   userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 2,
  },
  userRol: {
  fontSize: 16,
  marginLeft: 4,
  },
roleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rolePillText: {
    fontSize: 12,
  },

  roleDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: 4,
  },
  //////////////////////////// Modal Styles ////////////////////////////
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "#f2f2f2",
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
    padding: 10,
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
  },
  inputContainer: {
    marginBottom: 5,
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
  },
  fab: {
    position: "absolute",
    right: 20,
    backgroundColor: "#404040", 
    width: 70,
    height: 70,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#2e2e2e",
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  
  closeButtonModal: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  
  avatarNameSection: {
    alignItems: 'center',
    paddingTop: 5,
    paddingBottom: 5,
  },
  
  avatarLargeImproved: {
    marginBottom: 20,
    shadowColor: "#404040",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarGradient: {
    width: 90,
    height: 90,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
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

  },
  roleBadgeText: {
    marginLeft: 0,
    fontSize: 14,
  },
  
  dividerModal: {
    height: 1,
    backgroundColor: '#404040',
    marginVertical: 10,
    marginHorizontal: 30,
  },
  infoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  
  sectionTitle: {
    fontSize: 16,
    color: '#404040',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  infoCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#404040',
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
    color: '#404040',
  },
  
  actionButtonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 25,
    gap: 12,
  },
  
  editButtonImproved: {
    borderRadius: 10,
    overflow: 'hidden',
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
    borderRadius: 10,
    backgroundColor: '#631b1bff',
  },
  
  deleteButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  
  deleteButtonText: {
    color: '#f2f2f2',
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
    fontFamily: 'Combo_400Regular',
    color: '#666',
    fontSize: 16,
    paddingRight: 10,
  },
  infoValue: {
    fontFamily: 'Combo_400Regular',
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
    fontFamily: 'Combo_400Regular',
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

},
dropdownOverlay: {
  position: 'absolute',
  top: 245, // ajusta según la altura de tu header + searchContainer
  right: 15,
  zIndex: 1,
  elevation: 20,
},
dropdownOptionsSearch: {
  backgroundColor: '#f2f2f2ff',
  borderRadius: 8,
  minWidth: 150,
},
editSubtitle: {
    fontSize: 18,
    color: "#404040",

  },

  editFormContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  editLabel: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
  },
  editModalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 50,
  },

  editInputWrapper: {
    marginHorizontal: 0, // quita el margin del searchContainer original
    marginVertical: 0,
    marginBottom: 10,    // solo bottom margin para separar inputs
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
  },
  editInput: {
    fontSize: 16, 
  },
  editDropdown: {
    marginHorizontal: 0,
    marginVertical: 0,
    marginBottom: 5,
    paddingRight: 10, // espacio para la flecha
    borderWidth: 1,
    borderColor: "#bfbfbf",
    borderRadius: 10,
    backgroundColor: "#f2f2f2",
  },

  editDropdownText: {
    color: "#404040",
  },

  editDropdownList: {
    position: 'relative',
    top: 0,            
    right: 0,             
    zIndex: 1000,
    borderWidth: 1,
    borderColor: "#bfbfbf",
  },
    modalBodyScroll: {
    flexGrow: 1, // permite desbordar y hacer scroll al reducirse por el teclado
  },
    fullscreenModal: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  
})

export default UsersScreen
