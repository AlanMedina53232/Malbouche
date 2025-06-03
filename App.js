import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import BottomTabsNavigator from './navigation/bottomTabsNavigator';
import EventsScreen from './principals/restricted/eventsScreen';
import NewEventScreen from './principals/restricted/newEventScreen';
import Login from './principals/restricted/login.js';
import ScheduleScreen from './principals/restricted/scheduleScreen'; 
import { EventProvider } from './context/eventContext';
import usersScreen from "./principals/restricted/usersScreen.js"
import Mainfree from "./principals/free/main.js"
import MainRest from "./principals/restricted/main.js"



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
          <Stack.Screen name="NewEventScreen" component={NewEventScreen} />
          <Stack.Screen name="Schedule" component={ScheduleScreen} />
          <Stack.Screen name="Users" component={usersScreen} />
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