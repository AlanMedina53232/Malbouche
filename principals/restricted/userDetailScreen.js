import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';
 
const UserDetailScreen = ({ navigation }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // State for change password modal
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const currentUserId = await AsyncStorage.getItem('currentUserId');
        if (!token || !currentUserId) {
          Alert.alert('Error', 'No se encontró token o ID de usuario. Por favor inicie sesión nuevamente.');
          setLoading(false);
          return;
        }
        const response = await fetch(`${BACKEND_URL}/users/${currentUserId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          Alert.alert('Error', errorData.error || 'Error al obtener datos del usuario');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setUser(data.data || data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'No se pudo conectar con el servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Por favor complete todos los campos.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'La nueva contraseña y la confirmación no coinciden.');
      return;
    }
    setChangingPassword(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const currentUserId = await AsyncStorage.getItem('currentUserId');
      if (!token || !currentUserId) {
        Alert.alert('Error', 'No se encontró token o ID de usuario. Por favor inicie sesión nuevamente.');
        setChangingPassword(false);
        return;
      }
      // For security, backend should verify current password, but here we just send new password
      const response = await fetch(`${BACKEND_URL}/users/${currentUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: newPassword,
          nombre: user.nombre || user.name,
          apellidos: user.apellidos || '',
          correo: user.correo || user.email,
          puesto: user.puesto || '',
          rol: user.rol || 'usuario',
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Error al cambiar la contraseña');
        setChangingPassword(false);
        return;
      }
      Alert.alert('Éxito', 'Contraseña cambiada exitosamente');
      setModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'No se pudo conectar con el servidor');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#660154" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>No se pudo cargar la información del usuario.</Text>
      </View>
    );
  }

  return (
    <LinearGradient
        colors={['rgba(51, 0, 42, 1)', 'rgba(254, 185, 220, 0.9)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
    > 
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={{ backgroundColor: 'white', borderRadius: 12, margin: 20, padding: 20, elevation: 5 }}>
            <View style={styles.profileSection}>
              <View style={styles.avatarLarge}>
              <Ionicons name="person" size={50} color="#666" />
            </View>
            <Text style={styles.userName}>{user.name || user.nombre}</Text>
            <Text style={styles.userEmail}>{user.email || user.correo}</Text>
            <Text style={styles.userPosition}>{user.rol || ''}</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={() => {
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              }}
            >
              <Text style={[styles.buttonText, styles.logoutText]}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
          
        
        {/* Change Password Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Change Password</Text>

              <TextInput
                style={styles.input}
                placeholder="Current Password"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <Text style={styles.saveButtonText}>
                  {changingPassword ? 'Changing...' : 'Change Password'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={changingPassword}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  userEmail: {
    fontSize: 16,
    color: '#666666',
  },
  actionButtons: {
    padding: 20,
    gap: 15,
  },
  button: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#fee2e2',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  logoutText: {
    color: '#dc2626',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: '#660154',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelButton: {
    padding: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#660154',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default UserDetailScreen;
