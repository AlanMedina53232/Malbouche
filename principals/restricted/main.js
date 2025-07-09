import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ImageBackground,
  ActivityIndicator,
  Alert
} from "react-native";
import Slider from "@react-native-community/slider";
import NavigationBar from "../../components/NavigationBar";
import AnalogClock from "../../components/analogClock";
import { Ionicons } from '@expo/vector-icons';
import FrameImage from '../../assets/reloj.png';
import axios from "axios";
import debounce from "lodash.debounce";

const MainRest = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState("normal");
  const [speed, setSpeed] = useState(50);
  const [loading, setLoading] = useState(false);

  const currentUser = {
    id: 1,
    name: 'Almendro Isaac Medina Ramírez',
    email: 'AlmIsaMedRam@gmail.com'
  };

  const options = [
    ["left", "right"],
    ["crazy", "swing"],
    ["customized", "normal"]
  ];

  // Handle preset button press: POST /api/movimiento-actual/:preset with optional speed
  const handlePresetSelect = async (preset) => {
    setLoading(true);
    try {
      const payload = speed ? { velocidad: speed } : {};
      const response = await axios.post(`/api/movimiento-actual/${preset.toLowerCase()}`, payload);
      // Update local state with returned data if any
      if (response.data && response.data.data) {
        const data = response.data.data;
        if (data.preset) {
          setSelectedOption(data.preset);
        } else {
          setSelectedOption(preset);
        }
        if (data.velocidad) {
          setSpeed(data.velocidad);
        }
      } else {
        setSelectedOption(preset);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        Alert.alert("Error", "Preset not found.");
      } else {
        Alert.alert("Error", "Failed to update movement preset.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounced PATCH /api/movimiento-actual/velocidad with new speed
  const sendSpeedUpdate = async (newSpeed) => {
    setLoading(true);
    try {
      const response = await axios.patch(`/api/movimiento-actual/velocidad`, { velocidad: newSpeed });
      if (response.data && response.data.data && response.data.data.velocidad) {
        setSpeed(response.data.data.velocidad);
      } else {
        setSpeed(newSpeed);
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Gracefully ignore 404
      } else {
        Alert.alert("Error", "Failed to update speed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounce speed update to avoid excessive requests
  const debouncedSpeedUpdate = useCallback(debounce(sendSpeedUpdate, 400), []);

  // Handle slider change complete event
  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    debouncedSpeedUpdate(newSpeed);
  };

  // Determine props for AnalogClock based on selected option and speed
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
            <Ionicons name="person" size={20} color="#660154" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer} 
          showsVerticalScrollIndicator={false} 
        >   
          <View style={styles.clockFrame}>
            <ImageBackground
              source={FrameImage} // Tu imagen de marco
              style={styles.clockImageFrame}
              resizeMode="contain" // Ajusta la imagen al contenedor
            >
            <View style={styles.clockInnerContainer}>
              <AnalogClock {...getClockProps()} />
            </View>
            </ImageBackground>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#660154" />
              <Text style={styles.loadingText}>Updating...</Text>
            </View>
          )}

          {options.map((row, index) => (
            <View key={index} style={styles.buttonRow}>
              {row.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.button,
                    selectedOption === item && styles.activeButton,
                  ]}
                  onPress={() => handlePresetSelect(item)}
                  disabled={loading}
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
                  onSlidingComplete={handleSpeedChange}
                  minimumTrackTintColor="#000"
                  maximumTrackTintColor="#aaa"
                  thumbTintColor="#660154"
                  disabled={loading}
                />
            </View> 
          </View>
      
         
        </ScrollView>
      <NavigationBar/>
    </View>
    
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Título a la izquierda, botón a la derecha
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30, // Espacio superior para el header
    backgroundColor: "#FAFAFA", // Mismo color que el fondo
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

    width: 300,
    height: 300,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    
  },
  clockImageFrame: {
    width: '94%',
    height: '94%',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 38, // Espacio superior para el marco
    marginBottom: 20, // Espacio superior para el marco
    marginTop: 20, // Espacio superior para el marco
    overflow: 'hidden', // Asegura que el reloj no sobresalga del marco
    
  },
  clockInnerContainer: {
    width: '75%',            // Ajusta el tamaño del reloj visualmente
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 34,   // Ajusta según el marco de la imagen
    marginBottom: 15,    // Sube ligeramente el reloj

  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    paddingHorizontal: 45,
    gap: 18,
    zIndex: 0,
  },
  button: {
    backgroundColor: "#fff",
    flex: 1,
    borderRadius: 30,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 100,
    minHeight: 20,
    elevation: 2,
    overflow: "hidden",
  },
  activeButton: {
  backgroundColor: "#660154",
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
    backgroundColor: "#fff",
    width: "90%",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#fff",
    marginTop: 45,
    elevation: 2,
    overflow: "hidden",

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
    alignSelf: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80, // Espacio para el NavigationBar
  },
  loadingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  loadingText: {
    color: "#660154",
    fontWeight: "600",
  },
});

export default MainRest;
