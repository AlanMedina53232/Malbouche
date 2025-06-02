import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NavigationBar from '../components/NavigationBar';

const UsersScreen = ({ navigation }) => {
  const users = [
    { id: 1, name: 'Almendro Isaac Medina Ramírez' },
    { id: 2, name: 'Pablo Jose Urbano' },
    { id: 3, name: 'Angela María Rus' }
  ];

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
          <View key={user.id} style={styles.userItem}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#666" />
            </View>
            <Text style={styles.userName}>{user.name}</Text>
          </View>
        ))}
      </ScrollView>

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
});

export default UsersScreen;