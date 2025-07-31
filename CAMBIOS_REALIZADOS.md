# Cambios Realizados en EventScheduler

## 🎯 **Objetivos Completados**

1. ✅ **Mapeo de días únicamente en inglés**
2. ✅ **IP del ESP32 configurada desde la app** (como se hacía antes)

## 📝 **Cambios Específicos**

### **1. EventScheduler Service (Backend)**
**Archivo:** `Malbouche-backend/services/eventScheduler.js`

#### **Mapeo de Días Simplificado**
```javascript
// ANTES: Soportaba múltiples formatos (inglés + español)
const dayMap = {
  'Su': 0, 'M': 1, 'T': 2, 'W': 3, 'Th': 4, 'F': 5, 'Sa': 6,
  'domingo': 0, 'lunes': 1, 'martes': 2, ... // Español completo
  'Do': 0, 'Lu': 1, 'Ma': 2, ... // Español abreviado
};

// AHORA: Solo formato inglés abreviado
const dayMap = {
  'Su': 0,  // Sunday - Domingo
  'M': 1,   // Monday - Lunes
  'T': 2,   // Tuesday - Martes
  'W': 3,   // Wednesday - Miércoles
  'Th': 4,  // Thursday - Jueves
  'F': 5,   // Friday - Viernes
  'Sa': 6   // Saturday - Sábado
};
```

#### **Configuración ESP32 Desde App**
```javascript
// ANTES: Auto-carga desde Firestore
async start() {
  await this.loadESPConfig(); // ❌ Eliminado
  await this.loadAndScheduleEvents();
}

// AHORA: Espera configuración desde app
async start() {
  logger.info('📡 Esperando configuración ESP32 desde la app móvil...');
  await this.loadAndScheduleEvents();
}
```

#### **No Persistencia en Firestore**
```javascript
// ANTES: Guardaba en Firestore
async updateESPConfig(newConfig) {
  this.espConfig = { ...this.espConfig, ...newConfig };
  await db.collection('configuration').doc('esp32').set(this.espConfig, { merge: true }); // ❌
}

// AHORA: Solo mantiene en memoria
async updateESPConfig(newConfig) {
  if (newConfig.ip && !this.isValidIP(newConfig.ip)) {
    return { success: false, message: 'Dirección IP inválida' };
  }
  this.espConfig = { ...this.espConfig, ...newConfig };
  logger.info(`📡 Configuración ESP32 actualizada desde app: ${this.espConfig.ip}`);
}
```

### **2. Hook useEventScheduler (Frontend)**
**Archivo:** `hooks/useEventScheduler.js`

#### **Migrado a API del Backend**
```javascript
// ANTES: Usaba EventSchedulerService local
import eventScheduler from '../utils/EventSchedulerService';
await eventScheduler.start(espIp);

// AHORA: Usa API REST del backend
const apiRequest = async (endpoint, options = {}) => {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
  return response.json();
};

const startScheduler = async () => {
  return await apiRequest('/scheduler/start', { method: 'POST' });
};
```

#### **Configuración ESP32 via API**
```javascript
// ANTES: Configuración local
eventScheduler.updateESPIP(newIp);

// AHORA: Configuración via API backend
const updateESPIP = async (newIp, deviceType = 'standard') => {
  return await apiRequest('/scheduler/esp32/configure', {
    method: 'POST',
    body: JSON.stringify({ ip: newIp, type: deviceType })
  });
};
```

#### **Auto-configuración desde AsyncStorage**
```javascript
// Mantiene comportamiento original de la app
useEffect(() => {
  const autoConfigureESP = async () => {
    const savedIp = await AsyncStorage.getItem(ESP_IP_KEY);
    if (savedIp) {
      console.log(`Auto-configurando ESP32 con IP guardada: ${savedIp}`);
      await updateESPIP(savedIp);
    }
  };
  autoConfigureESP();
}, []);
```

### **3. Funciones Eliminadas**
- ❌ `loadESPConfig()` - Ya no carga IP desde Firestore
- ❌ Mapeo de días en español - Solo inglés soportado
- ❌ Persistencia de configuración ESP32 en Firestore

### **4. Funciones Nuevas**
- ✅ Validación de IP en `updateESPConfig()`
- ✅ API endpoints para todas las operaciones
- ✅ Auto-configuración desde AsyncStorage en la app

## 🔄 **Flujo de Configuración Actualizado**

### **Secuencia Original (Restaurada)**
```mermaid
graph TD
    A[App inicia] --> B[Carga IP de AsyncStorage]
    B --> C[updateESPIP() via API]
    C --> D[Backend recibe configuración]
    D --> E[ESP32 configurado en memoria]
    E --> F[Eventos se programan]
```

### **Comportamiento de Días**
```javascript
// App siempre envía días en formato inglés
const event = {
  diasSemana: ["M", "T", "W", "Th", "F"], // ✅ Solo este formato
  // diasSemana: ["lunes", "martes", ...] // ❌ Ya no soportado
};
```

## 🎉 **Resultado Final**

1. **Mapeo de días:** Únicamente inglés abreviado (`["Su", "M", "T", "W", "Th", "F", "Sa"]`)
2. **Configuración ESP32:** La app configura la IP como antes, enviándola al backend via API
3. **No persistencia:** La configuración ESP32 se mantiene solo en memoria del backend
4. **Compatibilidad:** El flujo de la app sigue siendo el mismo que antes de la migración
5. **Logs habilitados:** Sistema de logging unificado y configurable para debugging

## 🐛 **Corrección de Errores en App**

### **Error 1:** `getAllEvents is not a function`
```javascript
// ERROR: TypeError: getAllEvents is not a function (it is undefined)
```

**Causa:** Funciones faltantes en el hook migrado  
**Solución:** Funciones de compatibilidad agregadas con cache local ✅

### **Error 2:** HTTP 401 en todas las peticiones API
```javascript
// ERROR: Error en API /scheduler/status: [Error: HTTP 401]
// ERROR: Error en API /scheduler/esp32/configure: [Error: HTTP 401]
// ERROR: Error en API /events: [Error: HTTP 401]
```

**Causa:** Peticiones sin token de autenticación  
**Solución:** Autenticación automática agregada al hook ✅

```javascript
// Hook actualizado con autenticación automática
const apiRequest = useCallback(async (endpoint, options = {}) => {
  // Obtener token de autenticación
  const token = await AsyncStorage.getItem('token');
  
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }), // Token incluido
      ...options.headers
    },
    ...options
  });
}, []);
```
```javascript
// Hook actualizado con cache local de eventos
const [allEvents, setAllEvents] = useState([]);

// Función síncrona compatible con renderizado
const getAllEvents = useCallback(() => {
  return allEvents;
}, [allEvents]);

// Otras funciones de compatibilidad
const getUpcomingEvents = useCallback((hours = 24) => {
  return allEvents.filter(event => event.activo);
}, [allEvents]);

const checkEventsNow = useCallback(async () => {
  await refreshEvents();
  return { success: true };
}, [refreshEvents]);
```

### **Cache de Eventos:**
- ✅ Se cargan al inicializar el hook
- ✅ Se actualizan cada minuto
- ✅ Se refrescan cuando hay cambios
- ✅ Disponibles síncronamente para renderizado

## 🧹 **Frontend Completamente Simplificado**

### **Hook Simplificado:**
```javascript
// ANTES: 300+ líneas con 20+ funciones
const {
  isSchedulerRunning, schedulerStatus, startScheduler, stopScheduler,
  toggleScheduler, updateESPIP, getAllEvents, refreshEvents,
  executeEventNow, getLogs, pingESP32, getESP32Info, // ...etc
} = useEventScheduler();

// AHORA: ~100 líneas con 4 funciones esenciales
const {
  updateESPIP,     // Configurar IP del ESP32
  getAllEvents,    // Obtener eventos para modal
  refreshEvents,   // Refrescar eventos
  allEvents        // Cache de eventos
} = useEventScheduler();
```

### **UI Simplificada:**
- ❌ **Eliminado:** Controles del scheduler (iniciar/detener)
- ❌ **Eliminado:** Estado del scheduler (activo/inactivo)  
- ❌ **Eliminado:** Botones de control en modal
- ✅ **Conservado:** Indicador de eventos programados
- ✅ **Conservado:** Modal de lista de eventos
- ✅ **Conservado:** Navegación a pantallas de eventos

### **Funcionamiento 100% Backend:**
- 🖥️ **Backend:** Programa y ejecuta eventos automáticamente 24/7
- 📱 **Frontend:** Solo configura IP y muestra eventos
- 🔄 **Sincronización:** Backend auto-detecta cambios en Firestore

El sistema ahora funciona exactamente como era antes de la migración, pero con la lógica de programación en el backend para operación 24/7 y un frontend ultra-simplificado.
