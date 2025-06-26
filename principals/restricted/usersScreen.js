"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList, SafeAreaView, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import NavigationBar from "../../components/NavigationBar"
import AsyncStorage from '@react-native-async-storage/async-storage'

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api' // Fallback if env not set

const UsersScreen = ({ navigation }) => {
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedApellidos, setEditedApellidos] = useState("")
  const [editedEmail, setEditedEmail] = useState("")
  const [editedPuesto, setEditedPuesto] = useState("")
  const [editedRol, setEditedRol] = useState("")
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const currentUser = {
    id: 1,
    name: 'Almendro Isaac Medina Ramírez',
    email: 'AlmIsaMedRam@gmail.com'
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const token = await AsyncStorage.getItem('token')
        if (!token) {
          Alert.alert("Error", "No se encontró token de autenticación. Por favor inicie sesión nuevamente.")
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
          Alert.alert("Error", errorData.error || "Error al obtener usuarios")
          setLoading(false)
          return
        }
        const data = await response.json()
        setUsers(data.data || data)
      } catch (error) {
        console.error("Error fetching users:", error)
        Alert.alert("Error", "No se pudo conectar con el servidor")
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  const openUserModal = (user) => {
    setSelectedUser(user)
    setEditedName(user.name || user.nombre)
    setEditedApellidos(user.apellidos || "")
    setEditedEmail(user.email || user.correo)
    setEditedPuesto(user.puesto || "")
    setEditedRol(user.rol || user.Rol)
    setModalVisible(true)
  }

  const handleSave = async () => {
    if (!editedName.trim() || !editedApellidos.trim() || !editedEmail.trim()) {
      Alert.alert("Error", "Por favor complete los campos obligatorios: Nombre, Apellidos y Correo")
      return
    }
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        Alert.alert("Error", "No se encontró token de autenticación. Por favor inicie sesión nuevamente.")
        return
      }
      const userId = selectedUser.id || selectedUser._id
      const updatedUser = {
        nombre: editedName.trim(),
        apellidos: editedApellidos.trim(),
        correo: editedEmail.trim(),
        puesto: editedPuesto.trim(),
        rol: editedRol,
      }
      const response = await fetch(`${BACKEND_URL}/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedUser),
      })
      if (!response.ok) {
        const errorData = await response.json()
        Alert.alert("Error", errorData.error || "Error actualizando usuario")
        return
      }
      // Update users state with updated user data
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          (user.id === userId || user._id === userId) ? { ...user, ...updatedUser } : user
        )
      )
      Alert.alert("Éxito", "Usuario actualizado exitosamente")
      setModalVisible(false)
    } catch (error) {
      console.error("Error updating user:", error)
      Alert.alert("Error", "No se pudo conectar con el servidor")
    }
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard} 
      onPress={() => openUserModal(item)}
    >
      <View style={styles.avatar}>
        <Ionicons name="person" size={24} color="#666" />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.nombre || item.name}</Text>
        <Text style={styles.userEmail}>{item.correo || item.email}</Text>
        <Text style={styles.userRol}>{item.rol || item.Rol}</Text>
      </View>
      <Ionicons name="create-outline" size={20} color="#666" />
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>USERS</Text>
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
          data={users}
          renderItem={renderItem}
          keyExtractor={item => (item.id || item._id).toString()}
          contentContainerStyle={styles.listContent}
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
              Alert.alert("Error", "No se encontró token de autenticación. Por favor inicie sesión nuevamente.")
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
              Alert.alert("Error", errorData.error || "Error al obtener usuarios")
              setLoading(false)
              return
            }
            const data = await response.json()
            setUsers(data.data || data)
          } catch (error) {
            console.error("Error fetching users:", error)
            Alert.alert("Error", "No se pudo conectar con el servidor")
          } finally {
            setLoading(false)
          }
        }}
        />
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => navigation.navigate('CreateUsers')}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>

        {/* MODAL */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
            <TouchableOpacity style={styles.modalContent} activeOpacity={1} onPress={() => {}}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit User</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <View style={styles.avatarLarge}>
                  <Ionicons name="person" size={50} color="#666" />
                </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editedName}
                  onChangeText={setEditedName}
                  placeholder="Enter name"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Apellidos</Text>
                <TextInput
                  style={styles.input}
                  value={editedApellidos}
                  onChangeText={setEditedApellidos}
                  placeholder="Enter apellidos"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={editedEmail}
                  onChangeText={setEditedEmail}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Puesto</Text>
                <TextInput
                  style={styles.input}
                  value={editedPuesto}
                  onChangeText={setEditedPuesto}
                  placeholder="Enter puesto"
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
    listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
 /*    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, */
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
    color: "#660154",
    fontWeight: "500",
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
    backgroundColor: "white",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalBody: {
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
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
  inputContainer: {
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
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

export default UsersScreen
