import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnalogClock from '../../components/analogClock';
import NavigationBar from '../../components/NavigationBar';

export default function ScheduleScreen({ navigation }) {
  const [selectedDays, setSelectedDays] = useState(['Th', 'F', 'S']);

  const toggleDay = (label) => {
    setSelectedDays((prev) =>
      prev.includes(label) ? prev.filter((d) => d !== label) : [...prev, label]
    );
  };

  const days = [
    { label: 'S', id: 'sun' },
    { label: 'M', id: 'mon' },
    { label: 'T', id: 'tue' },
    { label: 'W', id: 'wed' },
    { label: 'Th', id: 'thu' },
    { label: 'F', id: 'fri' },
    { label: 'S', id: 'sat' },
  ];

  const renderDayButton = (day) => (
    <TouchableOpacity
      key={day.id}
      style={[
        styles.dayButton,
        selectedDays.includes(day.label) && styles.dayButtonSelected
      ]}
      onPress={() => toggleDay(day.label)}
    >
      <Text style={styles.dayText}>{day.label}</Text>
    </TouchableOpacity>
  );
  const currentUser = {
  id: 1,
  name: 'Almendro Isaac Medina Ramírez',
  email: 'AlmIsaMedRam@gmail.com'
};


  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
  <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
    <Ionicons name="arrow-back" size={24} />
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.profileButton}
    onPress={() => navigation.navigate('UserDetail', { user: currentUser })}
  >
    <View style={styles.avatarSmall}>
      <Ionicons name="person" size={20} color="#666" />
    </View>
  </TouchableOpacity>
</View>

        <AnalogClock hour={21} minute={0} />

        <View style={styles.timeRange}>
          <Text style={styles.timeText}>09:00 PM</Text>
          <Text style={styles.timeText}>10:00 PM</Text>
        </View>

        <View style={styles.daysContainer}>
          {days.map(renderDayButton)}
        </View>

        <TextInput style={styles.input} placeholder="Event Name" />

        {[1, 2].map((_, i) => (
          <View key={i} style={styles.moveRow}>
            <TextInput style={styles.inputSmall} placeholder="Move type" />
            <TextInput style={styles.inputSmall} placeholder="Speed" keyboardType="numeric" />
            <TextInput style={styles.inputSmall} placeholder="Time (seg)" keyboardType="numeric" />
          </View>
        ))}

        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <NavigationBar />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 20,
    paddingTop: 60,
    flexGrow: 1,
  },
  backButton: {
    marginBottom: 10,
  },
  clockPlaceholder: {
    alignSelf: 'center',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#ddd',
    marginBottom: 20,
  },
  timeRange: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dayButton: {
    padding: 10,
    backgroundColor: '#ddd',
    borderRadius: 8,
  },
  dayButtonSelected: {
    backgroundColor: '#444',
  },
  dayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 20,
    paddingVertical: 8,
  },
  moveRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  inputSmall: {
    flex: 1,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginHorizontal: 5,
    paddingVertical: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#aaa',
    padding: 15,
    borderRadius: 10,
    marginRight: 10,
    alignItems: 'center',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
   profileButton: {
    padding: 4,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10,
},
});
