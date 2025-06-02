import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventsScreen from './principals/eventsScreen';
import NewEventScreen from './principals/newEventScreen';
import Login from './principals/login';
import ScheduleScreen from './principals/scheduleScreen';
import UsersScreen from './principals/usersScreen';
import { EventProvider } from './context/eventContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <EventProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="NewEventScreen" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="EventsScreen" component={EventsScreen} />
          <Stack.Screen name="NewEventScreen" component={NewEventScreen} />
          <Stack.Screen name="Schedule" component={ScheduleScreen} />
          <Stack.Screen name="Users" component={UsersScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </EventProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});