# Configuración de Permisos WiFi para Builds EAS

## Problema Resuelto
La aplicación funcionaba en desarrollo con Expo pero no se podía conectar al ESP32 por WiFi cuando se buildea e instala desde un APK/AAB.

## Cambios Realizados

### 1. Permisos Agregados en app.json
Se agregaron los siguientes permisos críticos para comunicación WiFi:

- `ACCESS_WIFI_MULTICAST`: Permite acceso a transmisión multicast WiFi
- `NEARBY_WIFI_DEVICES`: Para Android 13+ permite comunicación con dispositivos WiFi cercanos sin requerir ubicación
- `CHANGE_WIFI_MULTICAST_STATE`: Permite cambiar el estado de multicast WiFi

### 2. Configuración de Plugin expo-location
Se configuró explícitamente el plugin de localización con mensajes personalizados para que el usuario entienda por qué se necesitan los permisos.

### 3. Configuración Android Adicional
- Se estableció `targetSdkVersion` y `compileSdkVersion` en 34
- Se mantiene `usesCleartextTraffic: true` para permitir HTTP local
- Se mantiene `networkSecurityConfig` para configuración de red personalizada

### 4. Configuración EAS Build
Se actualizó eas.json para incluir configuraciones específicas de build que aseguren la correcta compilación de permisos.

## Archivos Creados/Modificados

1. **app.json**: Permisos y configuración de plugins actualizados
2. **eas.json**: Configuración de build mejorada
3. **android_permissions_manifest.xml**: Referencia de permisos para Android
4. **res/xml/network_security_config.xml**: Ya existía y está correctamente configurado

## Próximos Pasos

1. Ejecutar `eas build --platform android --profile preview` para crear un nuevo APK
2. Instalar el APK en el dispositivo
3. Asegurar que se otorguen todos los permisos cuando la app los solicite
4. Probar la conexión WiFi con el ESP32

## Notas Importantes

- Los permisos de ubicación son necesarios en Android para escanear redes WiFi, aunque no uses GPS
- El permiso `NEARBY_WIFI_DEVICES` es específico para Android 13+ y mejora la conectividad local
- La configuración `usesCleartextTraffic: true` es esencial para comunicación HTTP con dispositivos locales como ESP32

## Troubleshooting

Si aún hay problemas:
1. Verificar que el dispositivo y ESP32 estén en la misma red
2. Confirmar que todos los permisos fueron otorgados en Configuración > Apps > Malbouche > Permisos
3. Reiniciar la aplicación después de otorgar permisos
4. Verificar que el ESP32 responda a ping desde la red local
