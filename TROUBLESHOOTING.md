# Guía de Solución de Problemas - Conexión con Arduino ESP32

## Problema: La aplicación no se conecta al Arduino ESP32 en la APK

### Soluciones Implementadas (Versión 2.0):

1. **Network Security Config mejorado**
   - Archivo: `res/xml/network_security_config.xml`
   - Permite tráfico HTTP (cleartext) para redes locales
   - Configuración base para permitir tráfico no seguro

2. **Permisos adicionales en Android**
   - Archivo: `app.json`
   - `usesCleartextTraffic: true` para permitir HTTP
   - Permisos de red y ubicación completos

3. **Funciones de conexión mejoradas**
   - Archivo: `utils/networkHelper.js`
   - Múltiples métodos de conexión para Android
   - Escaneo automático de red local
   - Validación de formato IP

4. **Interface mejorada**
   - Botón "Escanear Red" para encontrar automáticamente el ESP32
   - Mejor manejo de errores y timeouts
   - Debugging detallado

### Nuevas Funcionalidades:

#### 1. **Escaneo Automático de Red**
- Botón "Escanear Red" en el modal de configuración
- Escanea automáticamente redes comunes (192.168.1.x, 192.168.0.x, etc.)
- Detecta automáticamente dispositivos que respondan en puerto 80

#### 2. **Múltiples Métodos de Conexión**
- Para Android: intenta 3 métodos diferentes de conexión
- Headers personalizados para mejor compatibilidad
- Timeouts ajustables por método

#### 3. **Debugging Avanzado**
- Endpoint `/status` en el ESP32 para información detallada
- Endpoint `/test` para pruebas rápidas
- Script de debugging (`debug_esp32.sh`) para diagnóstico

### Pasos para Resolver el Problema:

1. **Actualizar código del Arduino**:
   - Usa el archivo `arduino_code_improved.ino`
   - Incluye endpoints de debugging adicionales
   - Mejor manejo de CORS

2. **Configurar IP en la aplicación**:
   - Abre la aplicación y ve a configuración de IP
   - Usa "Escanear Red" para encontrar automáticamente el ESP32
   - Si no funciona, ingresa la IP manualmente
   - Usa "Probar Conexión" para verificar

3. **Verificar configuración de red**:
   - Dispositivo Android y ESP32 deben estar en la misma red WiFi
   - Evita redes de invitados o con aislamiento de dispositivos
   - Verifica que el router no tenga AP isolation activado

4. **Crear nueva APK**:
   ```bash
   # Instalar dependencias
   npm install
   
   # Crear APK
   eas build --platform android
   # o
   npx expo build:android --type apk
   ```

5. **Debugging con script**:
   ```bash
   # En Linux/Mac
   chmod +x debug_esp32.sh
   ./debug_esp32.sh 192.168.1.100
   
   # En Windows (PowerShell)
   # Usar equivalente con curl o PowerShell
   ```

### Debugging Paso a Paso:

1. **Verificar que el ESP32 responde**:
   ```bash
   curl http://192.168.1.100/test
   # Debería responder: TEST_OK
   ```

2. **Verificar estado del ESP32**:
   ```bash
   curl http://192.168.1.100/status
   # Debería mostrar JSON con estado
   ```

3. **Probar comandos**:
   ```bash
   curl http://192.168.1.100/stop
   curl http://192.168.1.100/left
   curl http://192.168.1.100/speed?value=50
   ```

### Problemas Comunes y Soluciones:

#### 1. **"Network request failed"**
- **Causa**: Problema de conectividad de red
- **Solución**: Verificar que ambos dispositivos estén en la misma red WiFi
- **Test**: `ping [IP_DEL_ESP32]` desde el PC

#### 2. **"AbortError" / Timeout**
- **Causa**: ESP32 no responde en tiempo establecido
- **Solución**: Verificar que el ESP32 esté encendido y funcionando
- **Test**: Acceder a `http://[IP_DEL_ESP32]` desde un navegador

#### 3. **"HTTP 404"**
- **Causa**: Endpoint no encontrado en el ESP32
- **Solución**: Verificar que el código del Arduino esté actualizado
- **Test**: Usar endpoints de debugging como `/test`

#### 4. **Funciona en desarrollo pero no en APK**
- **Causa**: Restricciones de seguridad de Android
- **Solución**: 
  - Verificar `usesCleartextTraffic: true` en `app.json`
  - Verificar `network_security_config.xml`
  - Verificar permisos de red
  - Usar la función `connectToESP32Android()`

### Códigos de Error Específicos:

- **TEST_OK**: Conexión exitosa con ESP32
- **Timeout**: ESP32 no responde (verificar IP y red)
- **Network request failed**: Problema de conectividad
- **HTTP 404**: Endpoint no encontrado (actualizar código Arduino)
- **Connection refused**: Puerto 80 cerrado o ESP32 apagado

### Notas de Implementación:

1. **Para Android**: Se usan múltiples métodos de conexión automáticamente
2. **Para iOS**: Se usa el método estándar con timeouts
3. **Para desarrollo**: Funciona normalmente con Expo proxy
4. **Para producción**: Usa conexión directa con validaciones

### Archivos Importantes:

- `utils/networkHelper.js`: Funciones de conectividad
- `res/xml/network_security_config.xml`: Configuración de seguridad
- `app.json`: Permisos y configuración de Android
- `arduino_code_improved.ino`: Código mejorado del ESP32
- `debug_esp32.sh`: Script de debugging

### Contacto y Soporte:

Si el problema persiste después de seguir esta guía:
1. Ejecuta el script de debugging
2. Verifica los logs de la aplicación
3. Comprueba que el ESP32 responda a los endpoints de test
4. Verifica la configuración de red del router
