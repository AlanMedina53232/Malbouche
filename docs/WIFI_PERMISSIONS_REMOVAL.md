# Eliminación de Permisos WiFi y Ubicación

## Cambios Realizados

### 1. Actualización de `app.json`
- Eliminados permisos relacionados con WiFi y ubicación del archivo de configuración.
- Solo se mantienen permisos esenciales: INTERNET, ACCESS_NETWORK_STATE y WAKE_LOCK.
- Eliminado el plugin de ubicación (expo-location) que ya no es necesario.

### 2. Actualización de `android_permissions_manifest.xml`
- Eliminados permisos relacionados con WiFi y ubicación.
- Simplificado a solo los permisos esenciales para el funcionamiento de la app.

### 3. Modificación de `networkHelper.js`
- Eliminadas todas las funciones relacionadas con escaneo de red y validación de IPs.
- Se mantiene solo la funcionalidad básica para verificar conectividad a internet.

### 4. Actualización de `ESP32Service.js`
- Modificado para usar el backend en lugar de comunicarse directamente con el reloj.
- Reemplazadas las llamadas directas HTTP por llamadas a apiClient al backend.
- Actualizado el manejo de errores para reflejar los posibles problemas de comunicación con el backend.
- Se cambia el concepto de "IP" por "deviceId" para reflejar que ahora el backend gestiona los dispositivos.

### 5. Actualización parcial de `ESP32Prototype28BYJService.js`
- Comenzada la actualización para usar el backend.
- Actualizada la función principal `sendPrototypeCommand` y algunas otras.

## Cambios Pendientes

### 1. Completar actualización de `ESP32Prototype28BYJService.js`
- Actualizar todas las referencias de validación de IP a validación de deviceId.
- Completar la migración de todas las funciones para usar el backend.

### 2. Actualizar `UnifiedClockService.js`
- Adaptar para que utilice los servicios actualizados de ESP32 y ESP32Prototype.
- Eliminar cualquier funcionalidad relacionada con detección local de dispositivos.

### 3. Actualizar componentes de UI
- Revisar y actualizar cualquier componente que aún haga referencia a IPs de dispositivos.
- Cambiar los flujos de usuario que involucren escaneo de red o configuración manual de IPs.

### 4. Verificar dependencias
- Revisar el archivo `package.json` y eliminar dependencias relacionadas con WiFi/ubicación que ya no sean necesarias.

### 5. Pruebas Exhaustivas
- Probar todo el flujo de la aplicación para asegurarse de que la comunicación con el reloj funciona correctamente a través del backend.
- Verificar que no queden rastros de la funcionalidad de escaneo de red.

## Notas Importantes

1. **Arquitectura:** La app ahora se comunica exclusivamente con el backend, que a su vez gestiona la comunicación con los dispositivos físicos.

2. **Identificación de Dispositivos:** En lugar de usar direcciones IP, ahora se usan identificadores de dispositivos proporcionados por el backend.

3. **Reducción de Permisos:** La app ahora requiere significativamente menos permisos, mejorando la privacidad y simplificando la experiencia del usuario.

4. **Actualizaciones de API:** Es posible que sea necesario revisar la documentación del backend para asegurarse de que las rutas y parámetros de API utilizados son correctos.
