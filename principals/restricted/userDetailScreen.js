import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
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
          Alert.alert('Error', 'Authentication token not found. Please log in again.');
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
          Alert.alert('Error', errorData.error || 'Error loading user data');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setUser(data.data || data);
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Could not connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please complete all fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirmation do not match.');
      return;
    }
    setChangingPassword(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const currentUserId = await AsyncStorage.getItem('currentUserId');
      if (!token || !currentUserId) {
        Alert.alert('Error', 'Authentication token not found. Please log in again.');
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
        Alert.alert('Error', errorData.error || 'Error changing password');
        setChangingPassword(false);
        return;
      }
      Alert.alert('Success', 'Password changed successfully');
      setModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert('Error', 'Could not connect to server');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#404040" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Could not load user information.</Text>
      </View>
    );
  }

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <LinearGradient
          colors={['#8C8C8C', '#3A3A3B', '#2E2E2E']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1 }}
        />
      </View>

        <View style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#f2f2f2" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={[styles.titleGradient, { fontFamily: 'Combo_400Regular' }]}>USER PROFILE</Text>
            </View>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View>
            {/* Profile Section */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <LinearGradient
                    colors={['#bfbfbf', '#404040']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarGradient}
                  >
                    <Ionicons name="person" size={60} color="#fff" />
                  </LinearGradient>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { fontFamily: 'Combo_400Regular' }]}>
                    {user.name || user.nombre}
                  </Text>
                  <Text style={[styles.userEmail, { fontFamily: 'Combo_400Regular' }]}>
                    {user.email || user.correo}
                  </Text>
                  {(() => {
                    const roleInfo = getRoleInfo(user.rol || user.Rol);
                    return (
                      <View style={styles.roleContainer}>
                        <View style={[styles.rolePill, { backgroundColor: roleInfo.bg }]}>
                          <Text style={[styles.rolePillText, { color: roleInfo.text, fontFamily: 'Combo_400Regular' }]}>
                            {roleInfo.label}
                          </Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Text style={[styles.sectionTitle, { fontFamily: 'Combo_400Regular' }]}>
                Account Settings
              </Text>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => setModalVisible(true)}
              >
                <View style={styles.actionButtonContent}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="lock-closed-outline" size={24} color="#404040" />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={[styles.actionTitle, { fontFamily: 'Combo_400Regular' }]}>
                      Change Password
                    </Text>
                    <Text style={[styles.actionSubtitle, { fontFamily: 'Combo_400Regular' }]}>
                      Update your account password
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#8c8c8c" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={() => {
                  Alert.alert(
                    "Log Out",
                    "Are you sure you want to log out?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { 
                        text: "Log Out", 
                        style: "destructive",
                        onPress: () => navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        })
                      }
                    ]
                  );
                }}
              >
                <View style={styles.actionButtonContent}>
                  <View style={styles.actionIcon}>
                    <Ionicons name="log-out-outline" size={24} color="#631b1bff" />
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={[styles.actionTitle, styles.logoutText, { fontFamily: 'Combo_400Regular' }]}>
                      Log Out
                    </Text>
                    <Text style={[styles.actionSubtitle, { fontFamily: 'Combo_400Regular' }]}>
                      Sign out of your account
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#631b1bff" />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Change Password Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalKeyboardView}
            >
              <View style={styles.modalContent}>
                <LinearGradient
                  colors={['#33002A', 'rgba(102, 1, 84, 0.8)']}
                   start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.modalHeaderGradient}
                >
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { fontFamily: 'Combo_400Regular' }]}>
                      Change Password
                    </Text>
                    <TouchableOpacity 
                      onPress={() => setModalVisible(false)}
                      style={styles.modalCloseButton}
                    >
                      <Ionicons name="close-circle" size={25} color="#999" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>

                <ScrollView 
                  style={styles.modalBody}
                  contentContainerStyle={styles.modalScrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={styles.modalAvatarContainer}>
                    <View style={styles.modalAvatarLarge}>
                      <Ionicons name="lock-closed" size={40} color="#404040" />
                    </View>
                    <Text style={[styles.modalSubtitle, { fontFamily: 'Combo_400Regular' }]}>
                      Enter your current and new password
                    </Text>
                  </View>

                  <View style={styles.modalDivider} />

                  <View style={styles.modalInputContainer}>
                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { fontFamily: 'Combo_400Regular' }]}>
                        Current Password<Text style={{ color: "#af0808ff" }}> *</Text>
                      </Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="lock-closed-outline" size={20} color="#404040" style={styles.inputIcon} />
                        <TextInput
                          style={[styles.modalInput, { fontFamily: 'Combo_400Regular' }]}
                          placeholder="Enter current password"
                          placeholderTextColor="#999"
                          secureTextEntry
                          value={currentPassword}
                          onChangeText={setCurrentPassword}
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { fontFamily: 'Combo_400Regular' }]}>
                        New Password<Text style={{ color: "#af0808ff" }}> *</Text>
                      </Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="key-outline" size={20} color="#404040" style={styles.inputIcon} />
                        <TextInput
                          style={[styles.modalInput, { fontFamily: 'Combo_400Regular' }]}
                          placeholder="Enter new password"
                          placeholderTextColor="#999"
                          secureTextEntry
                          value={newPassword}
                          onChangeText={setNewPassword}
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <Text style={[styles.label, { fontFamily: 'Combo_400Regular' }]}>
                        Confirm New Password<Text style={{ color: "#af0808ff" }}> *</Text>
                      </Text>
                      <View style={styles.inputWrapper}>
                        <Ionicons name="checkmark-circle-outline" size={20} color="#404040" style={styles.inputIcon} />
                        <TextInput
                          style={[styles.modalInput, { fontFamily: 'Combo_400Regular' }]}
                          placeholder="Confirm new password"
                          placeholderTextColor="#999"
                          secureTextEntry
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                        />
                      </View>
                    </View>

                    <View style={styles.passwordInfo}>
                      <View style={styles.infoRow}>
                        <Ionicons name="information-circle" size={16} color="#404040" />
                        <Text style={[styles.infoText, { fontFamily: 'Combo_400Regular' }]}>
                          Password must be at least 6 characters long
                        </Text>
                      </View>
                    </View>
                  </View>
                    <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.saveButton, changingPassword && styles.disabledButton]}
                    onPress={handleChangePassword}
                    disabled={changingPassword}
                  >
                    <View style={styles.buttonContent}>
                      <Ionicons 
                        name={changingPassword ? "reload" : "save-outline"} 
                        size={20} 
                        color="#fff" 
                      />
                      <Text style={[styles.saveButtonText, { fontFamily: 'Combo_400Regular' }]}>
                        {changingPassword ? 'Changing...' : 'Change Password'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setModalVisible(false)}
                    disabled={changingPassword}
                  >
                    <Text style={[styles.cancelButtonText, { fontFamily: 'Combo_400Regular' }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                </View>
                </ScrollView>


              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
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
    marginRight: 40,
  },
  titleGradient: {
    fontSize: 28,
    color: "#f2f2f2",

  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    paddingBottom: 100,
  },
  profileCard: {
   backgroundColor: "#f2f2f2",
    borderRadius: 10,
    padding: 25,
    marginBottom: 25,
    shadowColor: "#404040",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 20,
    shadowColor: "#404040",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarGradient: {
    width: 110,
    height: 110,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    fontSize: 28,
    color: "#333",
    marginBottom: 8,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderRadius: 0,
    shadowOpacity: 0,
  },
  rolePill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  rolePillText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  userRole: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 6,
    textTransform: 'capitalize',
  },
  actionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    color: "#f2f2f2",
    marginBottom: 20,
    textAlign: 'center',
  },
  actionButton: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,

  },
  logoutButton: {
    borderColor: "rgba(220, 53, 69, 0.2)",
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#bfbfbf',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    color: "#333",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  logoutText: {
    color: "#631b1bff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalKeyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    color: "#fff",
    flex: 1,
    textAlign: 'left',
  },
  modalCloseButton: {
    padding: 5,
  },
  modalBody: {
    backgroundColor: '#fff',
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  modalAvatarContainer: {
    alignItems: 'center',
    paddingTop: 25,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  modalAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 2,
    borderColor: "#404040",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: 'center',
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(209, 148, 22, 0.3)',
    marginBottom: 20,
    marginHorizontal: 40,
  },
  modalInputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
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
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 15,
    shadowColor: "#404040",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  modalInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: "#333",
  },
  passwordInfo: {
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    padding: 15,
    marginTop: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#404040",
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
  modalButtonContainer: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  saveButton: {
    backgroundColor: "#404040",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#404040",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "#631b1bff",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#631b1bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Combo_400Regular',
  },
});

export default UserDetailScreen;
