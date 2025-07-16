import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import EventsScreen from "./principals/restricted/eventsScreen";
import NewEventScreen from "./principals/restricted/newEventScreen";
import Login from "./login.js";
import { EventProvider } from "./context/eventContext";
import usersScreen from "./principals/restricted/usersScreen.js";
import UserDetailScreen from "./principals/restricted/userDetailScreen.js";
import MainRest from "./principals/restricted/main.js";
import MovementsScreen from "./principals/restricted/movementsScreen.js";
import CreateMovementScreen from "./principals/restricted/createMovement.js";
import EditMovementScreen from "./principals/restricted/editMovement.js";
import CreateUsers from "./principals/restricted/createUsers.js";
import EditEventModal from "./principals/restricted/editEventModal.js";
//fuentes
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { useCallback } from "react";
import { useFonts } from "expo-font";
import {Montserrat_400Regular, Montserrat_500Medium,Montserrat_600SemiBold, Montserrat_700Bold, Montserrat_300Light } from "@expo-google-fonts/montserrat";
import {Cinzel_400Regular,Cinzel_500Medium, Cinzel_600SemiBold, Cinzel_700Bold } from "@expo-google-fonts/cinzel";


SplashScreen.preventAutoHideAsync();

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_300Light,
    Cinzel_400Regular,
    Cinzel_500Medium,
    Cinzel_600SemiBold,
    Cinzel_700Bold,
  });

  // Oculta la pantalla de carga una vez que las fuentes están listas
  const onLayoutRootView = useCallback(async () => {
  if (fontsLoaded) {
    console.log("Fuentes cargadas"); // <--- esto debería salir en la consola de Expo
    await SplashScreen.hideAsync();
  }
}, [fontsLoaded]);


  if (!fontsLoaded) {
    return null; // <- No renderiza nada hasta que la fuente esté lista
  }

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <EventProvider>
        <NavigationContainer>
          <SafeAreaProvider>
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false, animation: "none" }}>
              <Stack.Screen name="Login" component={Login} />
              <Stack.Screen name="Home" component={MainRest} />
              <Stack.Screen name="Events" component={EventsScreen} />
              <Stack.Screen name="Movements" component={MovementsScreen} />
              <Stack.Screen name="NewEventScreen" component={NewEventScreen} />
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
    </View>
  );

}
