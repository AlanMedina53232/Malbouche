import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UserDetailScreen = ({ route, navigation }) => {
  const { user } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarLarge}>
          <Ionicons name="person" size={50} color="#666" />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.button}>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
});

export default UserDetailScreen;