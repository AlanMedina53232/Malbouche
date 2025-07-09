import React, { useState, useCallback, useEffect } from "react";
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
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';

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

  // Get authentication token from AsyncStorage
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert("Authentication Error", "Please log in again.");
        navigation.replace('Login');
        return null;
      }
      return token;
    } catch (error) {
      console.error("Error getting auth token:", error);
      Alert.alert("Error", "Failed to get authentication token.");
      return null;
    }
  };

  // Handle preset button press: POST /api/movimiento-actual/:preset with optional speed
  const handlePresetSelect = async (preset) => {
    setLoading(true);
    
    try {
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const payload = { velocidad: speed };
      
      const response = await fetch(`${BACKEND_URL}/movimiento-actual/${preset.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Preset update error:", data);
        if (response.status === 404) {
          Alert.alert("Error", `Movement preset '${preset}' not found.`);
        } else if (response.status === 401) {
          Alert.alert("Authentication Error", "Please log in again.");
          navigation.replace('Login');
        } else {
          Alert.alert("Error", data.error || "Failed to update movement preset.");
        }
        setLoading(false);
        return;
      }

      // Update local state with returned data
      if (data.success && data.data) {
        setSelectedOption(preset);
        if (data.data.movimiento?.horas?.velocidad) {
          setSpeed(data.data.movimiento.horas.velocidad);
        }
        console.log("Preset updated successfully:", preset);
      } else {
        setSelectedOption(preset);
        console.log("Preset updated (no data returned):", preset);
      }

    } catch (error) {
      console.error("Network error updating preset:", error);
      Alert.alert("Network Error", "Failed to connect to server. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  // Handle speed change: PATCH /api/movimiento-actual/velocidad
  const sendSpeedUpdate = async (newSpeed) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return;
      }

      const response = await fetch(`${BACKEND_URL}/movimiento-actual/velocidad`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ velocidad: newSpeed }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Speed update error:", data);
        if (response.status === 404) {
          // Gracefully handle 404 - movement document might not exist yet
          console.log("Movement document not found, speed update skipped");
        } else if (response.status === 401) {
          Alert.alert("Authentication Error", "Please log in again.");
          navigation.replace('Login');
        } else {
          Alert.alert("Error", data.error || "Failed to update speed.");
        }
        return;
      }

      // Update local state with returned data
      if (data.success && data.data?.movimiento?.horas?.velocidad) {
        setSpeed(data.data.movimiento.horas.velocidad);
      }
      console.log("Speed updated successfully:", newSpeed);

    } catch (error) {
      console.error("Network error updating speed:", error);
      Alert.alert("Network Error", "Failed to update speed. Please check your internet connection.");
    }
  };

  // Debounce speed update to avoid excessive requests
  const debouncedSpeedUpdate = useCallback(
    debounce((newSpeed) => {
      sendSpeedUpdate(newSpeed);
    }, 500),
    []
  );

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
              source={FrameImage}
              style={styles.clockImageFrame}
              resizeMode="contain"
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
              <Text style={styles.sliderLabel}>Speed: {speed}</Text>
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

// Simple debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    zIndex: 100,
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
    marginLeft: 38,
    marginBottom: 20,
    marginTop: 20,
    overflow: 'hidden',
  },
  clockInnerContainer: {
    width: '75%',
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 34,
    marginBottom: 15,
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
    paddingBottom: 20,
  },
  sliderLabel: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
  },
  slider: {
    width: "85%",
    height: 30,
    alignSelf: "center",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 80,
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