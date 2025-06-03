import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NavigationBar from '../../components/NavigationBar';

const UsersScreen = ({ navigation }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const users = [
    { 
      id: 1, 
      name: 'Almendro Isaac Medina Ramírez',
      email: 'AlmIsaMedRam@gmail.com'
    },
    { 
      id: 2, 
      name: 'Pablo Jose Urbano',
      email: 'PabloJU@gmail.com'
    },
    { 
      id: 3, 
      name: 'Angela María Rus',
      email: 'AngelaMR@gmail.com'
    }
  ];

  const openUserModal = (user) => {
    setSelectedUser(user);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>USER</Text>
      </View>

      <ScrollView style={styles.userList}>
        {users.map(user => (
          <TouchableOpacity
            key={user.id}
            style={styles.userItem}
            onPress={() => openUserModal(user)}
          >
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#666" />
            </View>
            <Text style={styles.userName}>{user.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.avatarLarge}>
                    <Ionicons name="person" size={50} color="#666" />
                  </View>
                  <Text style={styles.modalName}>{selectedUser.name}</Text>
                  <Text style={styles.modalEmail}>{selectedUser.email}</Text>
                </View>
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.button}>
                    <Text style={styles.buttonText}>Change Password</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.button, styles.logoutButton]}>
                    <Text style={[styles.buttonText, styles.logoutText]}>Log out</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <NavigationBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  userList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userName: {
    fontSize: 16,
    color: '#333333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    width: '100%',
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 5,
  },
  userInfo: {
    alignItems: 'center',
    marginVertical: 20,
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
  modalName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalEmail: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 20,
  },
  actionButtons: {
    width: '100%',
    gap: 15,
  },
  button: {
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
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
});

export default UsersScreen;