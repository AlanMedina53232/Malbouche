import { StatusBar } from "expo-status-bar"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { SafeAreaProvider } from "react-native-safe-area-context"
import EventsScreen from "./principals/restricted/eventsScreen"
import NewEventScreen from "./principals/restricted/newEventScreen"
import Login from "./login.js"
import { EventProvider } from "./context/eventContext"
import usersScreen from "./principals/restricted/usersScreen.js"
import UserDetailScreen from "./principals/restricted/userDetailScreen.js"
import Mainfree from "./principals/free/main.js"
import MainRest from "./principals/restricted/main.js"
import MovementsScreen from "./principals/restricted/movementsScreen.js"
import CreateMovementScreen from "./principals/restricted/createMovement.js"
import EditMovementScreen from "./principals/restricted/editMovement.js"
import CreateUsers from "./principals/restricted/createUsers.js"
import EditEventModal from "./principals/restricted/editEventModal.js"

const Stack = createNativeStackNavigator()

export default function App() {
  return (
      <EventProvider>
        <NavigationContainer> 
          
        <SafeAreaProvider>
          <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false, animation:'none' }}>
            
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Mainfree" component={Mainfree}  />
            <Stack.Screen name="Home" component={MainRest} />
            <Stack.Screen name="Events" component={EventsScreen}  />
            <Stack.Screen name="Movements" component={MovementsScreen} />
            <Stack.Screen name="NewEventScreen" component={NewEventScreen}/>
            <Stack.Screen name="EditEventModal" component={EditEventModal} />
            <Stack.Screen name="Users" component={usersScreen} />
            <Stack.Screen name="UserDetail" component={UserDetailScreen} />
            <Stack.Screen name="CreateMovement" component={CreateMovementScreen} />
            <Stack.Screen name="EditMovement" component={EditMovementScreen} />
            <Stack.Screen name="CreateUsers" component={CreateUsers} />
          </Stack.Navigator>
          <StatusBar style="auto" />
          
        </SafeAreaProvider>
        </NavigationContainer>
      </EventProvider>
  )
}
