import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import Slider from "@react-native-community/slider";
import NavigationBar from "../../components/NavigationBar";
import AnalogClock from "../../components/analogClock";
import { Ionicons } from '@expo/vector-icons';

const MainRest = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState("normal");
  const [speed, setSpeed] = useState(50);

  const currentUser = {
    id: 1,
    name: 'Almendro Isaac Medina Ramírez',
    email: 'AlmIsaMedRam@gmail.com'
  };

  const options = [
    ["Left", "Right"],
    ["Crazy", "Swing"],
    ["Customized", "Normal"]
  ];

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };
    // Determina qué props enviar al AnalogClock basado en la selección
  const getClockProps = () => {
    const lowerOption = selectedOption.toLowerCase();
    return {
      direction: lowerOption === "left" ? "left" : lowerOption === "right" ? "right" : "normal",
      isCrazy: lowerOption === "crazy",
      isSwing: lowerOption === "swing",
      speed: speed
    };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
         <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>MALBOUCHE</Text>
      </View>
      <TouchableOpacity
        style={styles.profileButton}
        onPress={() => navigation.navigate('UserDetail', { user: currentUser })}
      >
        <View style={styles.avatarSmall}>
          <Ionicons name="person" size={20} color="#666" />
        </View>
      </TouchableOpacity>
    </View>
      <View style={styles.container}>
 

        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false} 
        >   


      <View style={styles.clockFrame}>
        <AnalogClock {...getClockProps()} />
      </View>

      {options.map((row, index) => (
        <View key={index} style={styles.buttonRow}>
          {row.map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.button,
                selectedOption === item && styles.activeButton,
              ]}
              onPress={() => setSelectedOption(item)}
            >
              <Text
                style={[
                  styles.buttonText,
                  selectedOption === item && { color: "#fff" },
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
      <View style={styles.sliderContainer}>
        <View style={styles.sliderBox}>
          <Text style={styles.sliderLabel}>Speed</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={100}
              step={1}
              value={speed}
              onSlidingComplete={setSpeed}
              minimumTrackTintColor="#000"
              maximumTrackTintColor="#aaa"
              thumbTintColor="#8C0200"
            />
        </View> 
      </View>
     
      <TouchableOpacity style={styles.turnOnButton}>
        <Text style={styles.turnOnText}>Turn On</Text>
      </TouchableOpacity>
      </ScrollView>
      <NavigationBar/>
      </View>
    

    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,

  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fdffff",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Título a la izquierda, botón a la derecha
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 35, // Espacio superior para el header
    backgroundColor: "#fdffff", // Mismo color que el fondo
    borderBottomWidth: 1, // Opcional: línea divisoria
    borderBottomColor: "#eee",
    zIndex: 100, // Asegura que esté por encima del contenido
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",

  },
  profileButton: {
    marginLeft: 10,
    marginBottom: 10,
  },
    avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockFrame: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    paddingHorizontal: 45,
    gap: 18,
    zIndex: 0,
  },
    button: {
    borderWidth: 2,
    flex: 1,
    borderRadius: 30,
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
    minHeight: 20,
    borderColor: "#e0e0e0",
    elevation: 2,
    overflow: "hidden",
  },
  activeButton: {
  backgroundColor: "rgba(74, 127, 231, 0.5)",
  },
  buttonText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
  sliderContainer: {
    width: "100%",
    alignItems: "center",
  },
  sliderBox: {
    backgroundColor: "rgba(254, 195, 59, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(254, 195, 59, 0.3)",
    width: "90%",
    borderRadius: 20,
    marginTop: 20,

  },
  sliderLabel: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  slider: {
    width: "85%",
    height: 30,
    marginVertical: 10,
    alignSelf: "center",
  },
  turnOnButton: {
    width: "85%",
    backgroundColor: "#8C0200",
    marginTop: 20,
    paddingVertical: 10,
    borderRadius: 15,
    alignItems: "center",
    alignSelf: "center",
  },
  turnOnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 100, // Espacio para el NavigationBar
  },
container: {
  flex: 1,
  backgroundColor: "#fdffff",
},
  
});

export default MainRest;