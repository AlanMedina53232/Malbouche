import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import CryptoJS from 'crypto-js';
import reloj from './assets/reloje.png';
import { LinearGradient } from 'expo-linear-gradient';


export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (email === '' || password === '') {
      Alert.alert('Error', 'Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);

    try {
      // Cambia la URL por la de tu backend si es diferente
      const response = await fetch('https://malbouche-backend.onrender.com/api/auth/login', {
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
  <View style={styles.loginBox}>
    <Image
      source={reloj}
      style={styles.logo}
    />
    <Text style={styles.loginTitle}>Login</Text>
    <Text style={styles.subtitle}>Enter your email and password to log in</Text>

    <TextInput
      style={styles.input}
      placeholder="Email Address"
      keyboardType="email-address"
      value={email}
      onChangeText={setEmail}
      autoCapitalize="none"
      placeholderTextColor="#999"
    />

    <View style={styles.passwordContainer}>
      <TextInput
        style={styles.passwordInput}
        placeholder="Password"
        secureTextEntry={!showPassword}
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#999"
      />
      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
        <Ionicons
          name={showPassword ? 'eye-off' : 'eye'}
          size={22}
          color="#666"
        />
      </TouchableOpacity>
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

    <TouchableOpacity
      onPress={() => navigation.navigate('Mainfree')}
      disabled={isLoading}
    >
      <Text style={styles.guestText}>or continue as a guest</Text>
    </TouchableOpacity>
  </View>
  <StatusBar style="dark" />
</LinearGradient>

  );
}

const styles = StyleSheet.create({
   container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
    elevation: 10,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
    resizeMode: 'contain',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 48,
    borderColor: 'rgba(204, 204, 204, 0.6)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
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
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
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
  },
  guestText: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 5,
  },
});
