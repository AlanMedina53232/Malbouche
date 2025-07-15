import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import reloj from './assets/icono.png';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: ''
    };

    // Validación de email
    if (!email) {
      newErrors.email = 'Email required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'No valid email address';
      valid = false;
    }

    // Validación de contraseña
    if (!password) {
      newErrors.password = 'Passrword required';
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = 'At least 6 characters required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };


  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      // Cambia la URL por la de tu backend si es diferente
      const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';
      const response = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          correo: email,
          password: password,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login error response:', errorText);
        Alert.alert('Error', `Error en el servidor: ${errorText}`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.data && data.data.token) {
        // Guarda el token para futuras peticiones
        await AsyncStorage.setItem('token', data.data.token);
        // Save the user ID for current user info
        if (data.data && data.data.user && data.data.user.id) {
          await AsyncStorage.setItem('currentUserId', data.data.user.id);
        }
        navigation.replace('Home');
      } else {
        Alert.alert('Error', data.error || 'Credenciales incorrectas');
      }
    } catch (error) {
      console.error('Fetch login error:', error);
      Alert.alert('Error', `Ocurrió un problema al iniciar sesión: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

 return (
   
  <LinearGradient
    colors={['rgba(51, 0, 42, 1)', 'rgba(254, 185, 220, 0.9)']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.container}
  >
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidContainer}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.loginBox}>
          <View>
            <Text style={styles.title}>MALBOUCHE</Text>
          </View>
          <Image
            source={reloj}
            style={styles.logo}
          />
          <Text style={styles.loginTitle}>LOGIN</Text>
          <Text style={styles.subtitle}>Enter your email and password to log in</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.input,
                errors.email && styles.inputError
              ]}
              placeholder="Email Address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                // Limpiar error cuando se escribe
                if (errors.email) {
                  setErrors({...errors, email: ''});
                }
              }}
              />
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            <View style={styles.inputContainer}>
              <View style={[
                styles.passwordContainer,
                errors.password && styles.inputError
              ]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({...errors, password: ''});
                    }
                  }}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Log In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        <StatusBar style="dark" />
        </KeyboardAvoidingView>
      </LinearGradient>
    
  );
}

const styles = StyleSheet.create({
 keyboardAvoidContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  scrollContainer: {
    flexGrow: 1,//
    justifyContent: 'center',
  },
  loginBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'rgba(245, 245, 245, 1)',
    borderRadius: 18,
    padding: 24,
    paddingBottom: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    alignSelf: 'center'
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#660154',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'serif-bold',  
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 20,
    color: 'rgba(102, 1, 84,0.9)',
    fontFamily: 'serif-bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    
  },
  inputContainer: {
    width: '100%',
    marginBottom: 12,
  },
  inputError: {
    borderColor: '#ff4444',
    backgroundColor: '#fff0f0',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    paddingBottom: 10,
    marginLeft: 10,
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: 'rgba(204, 204, 204, 0.6)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderColor: 'rgba(204, 204, 204, 0.6)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    backgroundColor: '#f9fafb',
    height: 48,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  passwordInput: {
    flex: 1,
    fontSize: 14,
  },
  button: {
    backgroundColor: '#660154',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'serif'
  },

});
