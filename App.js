import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventsScreen from './principals/restricted/eventsScreen';
import NewEventScreen from './principals/restricted/newEventScreen';
import Login from './principals/restricted/login.js';
import ScheduleScreen from './principals/restricted/scheduleScreen'; 
import { EventProvider } from './context/eventContext';
import usersScreen from "./principals/restricted/usersScreen.js"
import UserDetailScreen from "./principals/restricted/userDetailScreen.js"
import Mainfree from "./principals/free/main.js"
import MainRest from "./principals/restricted/main.js"
import MovementsScreen from './principals/restricted/movementsScreen.js';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <EventProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Mainfree" component={Mainfree} />
          <Stack.Screen name='MainRestricted' component={MainRest} />
          <Stack.Screen name="EventsScreen" component={EventsScreen} />
          <Stack.Screen name="MovementsScreen" component={MovementsScreen} />
          <Stack.Screen name="NewEventScreen" component={NewEventScreen} />
          <Stack.Screen name="Schedule" component={ScheduleScreen} />
          <Stack.Screen name="Users" component={usersScreen} />
          <Stack.Screen name="UserDetail" component={UserDetailScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </EventProvider>
  );
}