import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { EventContext } from '../../context/eventContext';
import { Ionicons } from '@expo/vector-icons';
import NavigationBar from '../../components/NavigationBar';

const EventsScreen = () => {
  const navigation = useNavigation();
  const { events, toggleEventStatus } = useContext(EventContext);

  const renderItem = ({ item }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventName}>{item.name}</Text>
        <Switch
          value={item.enabled}
          onValueChange={() => toggleEventStatus(item.id)}
        />
      </View>
      <Text style={styles.eventTime}>{item.startTime} - {item.endTime}</Text>
      <Text style={styles.eventDays}>{item.days.join(' ')}</Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Events</Text>
          <TouchableOpacity onPress={() => navigation.navigate('NewEventScreen')}>
            <Ionicons name="add" size={28} color="black" />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          {events[0] ? `The ${events[0].name} event is ongoing` : 'No ongoing event'}
        </Text>

        <FlatList
          data={events}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <NavigationBar />
    </View>
  );
};

export default EventsScreen;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  eventCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  eventTime: {
    fontSize: 14,
    marginTop: 4,
  },
  eventDays: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
});
