# Guía de Solución de Problemas - Conexión con Arduino ESP32

## Problema: La aplicación no se conecta al Arduino ESP32 en la APK

### Soluciones Implementadas:

1. **Network Security Config mejorado**
   - Archivo: `res/xml/network_security_config.xml`
   - Permite tráfico HTTP (cleartext) para redes locales
   - Incluye configuración para todas las redes privadas (192.168.x.x, 10.x.x.x, 172.16-31.x.x)

2. **Permisos adicionales en Android**
   - Archivo: `app.json`
   - Agregados: `ACCESS_COARSE_LOCATION`, `CHANGE_NETWORK_STATE`, `WAKE_LOCK`
   - `usesCleartextTraffic: true` para permitir HTTP

3. **Verificación de conectividad**
   - Archivo: `principals/restricted/main.js`
   - Chequeo de estado de red antes de enviar comandos
   - Manejo de timeouts y errores mejorado

4. **Prueba de conexión**
   - Botón "Probar Conexión" en el modal de configuración IP
   - Validación de formato IP
   - Timeout de 5-10 segundos para evitar bloqueos

### Pasos para Resolver el Problema:

1. **Instalar dependencias**:
   ```bash
   npm install expo-network
   ```

2. **Verificar configuración del ESP32**:
   - Asegúrate de que el Arduino esté conectado a la misma red WiFi
   - Verifica que el servidor web esté funcionando (puerto 80)
   - Comprueba que no haya firewall bloqueando el puerto

3. **Configurar IP en la aplicación**:
   - Abre la aplicación y ve a configuración de IP
   - Ingresa la IP del Arduino ESP32
   - Usa el botón "Probar Conexión" para verificar

4. **Verificar red WiFi**:
   - Dispositivo Android y ESP32 deben estar en la misma red
   - Evita redes de invitados o con aislamiento de dispositivos
   - Verifica que la red permite comunicación entre dispositivos

5. **Crear nueva APK**:
   ```bash
   npx expo build:android
   # o
   eas build --platform android
   ```

### Debugging Adicional:

Si el problema persiste, usa estos comandos para debugging:

1. **Verificar estado de red**:
   ```javascript
   import { checkNetworkStatus } from '../utils/networkHelper';
   const networkStatus = await checkNetworkStatus();
   console.log('Network status:', networkStatus);
   ```

2. **Obtener IP local**:
   ```javascript
   import { getLocalIP } from '../utils/networkHelper';
   const localIP = await getLocalIP();
   console.log('Local IP:', localIP);
   ```

3. **Validar formato IP**:
   ```javascript
   import { validateIPFormat } from '../utils/networkHelper';
   const isValid = validateIPFormat('192.168.1.100');
   console.log('IP válida:', isValid);
   ```

### Posibles Problemas Adicionales:

1. **Versión de Android**:
   - Android 9+ tiene restricciones más estrictas de HTTP
   - Asegúrate de que `usesCleartextTraffic` esté en `true`

2. **Configuración del Router**:
   - Algunos routers tienen aislamiento de dispositivos activado
   - Verifica configuración AP isolation

3. **Firewall del dispositivo**:
   - Algunos dispositivos tienen firewall integrado
   - Asegúrate de que no bloquee el puerto 80

4. **Configuración de DNS**:
   - Usa IP directa en lugar de nombres de dominio
   - Evita usar localhost o 127.0.0.1

### Códigos de Error Comunes:

- **Network request failed**: Problema de conectividad de red
- **AbortError**: Timeout de conexión
- **HTTP 404**: Endpoint no encontrado en el ESP32
- **Connection refused**: ESP32 no está escuchando en el puerto

### Notas Importantes:

- El problema NO ocurre en modo desarrollo (Expo Go) porque usa proxy
- La APK ejecuta directamente en el dispositivo sin proxy
- Las restricciones de seguridad son más estrictas en aplicaciones empaquetadas
- Es importante probar en la misma red WiFi donde funcionó en desarrollo
