/**
 * Ejemplo de cómo probar el sistema de eventos en tiempo real
 * 
 * Para probar que funciona correctamente, puedes seguir estos pasos:
 */

// 1. En Firebase, crear un evento de prueba para dentro de 2 minutos:
const eventoTest = {
  id: "test123",
  nombreEvento: "Prueba en Tiempo Real",
  activo: true,
  horaInicio: "14:32", // Pon la hora actual + 2 minutos
  diasSemana: {
    Lu: true,
    Ma: true,
    Mi: true,
    Ju: true,
    Vi: true,
    Sa: true,
    Do: true
  },
  movementId: "left", // Usar un preset simple
  creadorPor: "user123"
};

// 2. En el componente React, usar el hook para testing:
import { useEventScheduler } from '../hooks/useEventScheduler';

const TestComponent = () => {
  const { 
    isSchedulerRunning, 
    schedulerStatus,
    executeEventNow,
    getUpcomingEvents,
    checkEventsNow,
    refreshEvents
  } = useEventScheduler();

  // Función para probar evento inmediatamente
  const testEventNow = async () => {
    const result = await executeEventNow("test123");
    console.log("Resultado test:", result);
    // Deberías ver el reloj moverse inmediatamente
  };

  // Función para ver próximos eventos
  const checkUpcoming = () => {
    const upcoming = getUpcomingEvents(2); // Próximas 2 horas
    console.log("Próximos eventos:", upcoming);
  };

  // Función para verificar eventos manualmente
  const forceCheck = async () => {
    const result = await checkEventsNow();
    console.log("Verificación forzada:", result);
  };

  return (
    <View>
      <Text>Programador: {isSchedulerRunning ? 'Activo' : 'Inactivo'}</Text>
      <Text>Eventos cargados: {schedulerStatus.eventsCount}</Text>
      
      <Button title="Probar evento ahora" onPress={testEventNow} />
      <Button title="Ver próximos eventos" onPress={checkUpcoming} />
      <Button title="Verificar eventos ahora" onPress={forceCheck} />
      <Button title="Recargar eventos" onPress={refreshEvents} />
    </View>
  );
};

// 3. Lo que verás en la consola cuando funcione:
/*
🕐 Verificando eventos para Mi a las 14:32 (1 eventos cargados)
⚡ EJECUTANDO evento: "Prueba en Tiempo Real" programado para 14:32
Ejecutando evento: Prueba en Tiempo Real
Enviando comando al prototipo: http://192.168.0.175/left
Evento "Prueba en Tiempo Real" ejecutado exitosamente
✅ Verificación completada: 1 eventos ejecutados de 1 verificados
*/

// 4. Ejemplo de estructura del evento en Firebase:
const eventoCompleto = {
  // Datos básicos del evento
  id: "evento_matutino_001",
  nombreEvento: "Movimiento Matutino",
  activo: true,
  
  // Programación temporal
  horaInicio: "08:00",
  horaFin: "08:01", // Opcional
  diasSemana: {
    Lu: true,  // Lunes
    Ma: true,  // Martes  
    Mi: true,  // Miércoles
    Ju: true,  // Jueves
    Vi: true,  // Viernes
    Sa: false, // Sábado
    Do: false  // Domingo
  },
  
  // Relación con movimiento
  movementId: "mov_left_slow", // ID del movimiento a ejecutar
  
  // Metadatos
  creadorPor: "user_abc123",
  fechaCreacion: "2025-01-15T08:00:00.000Z",
  fechaActualizacion: "2025-01-15T08:00:00.000Z"
};

// 5. Para debugging, revisa estos logs en tiempo real:
/*
- Cada 30 segundos verás: "Verificando eventos para..."
- Cuando se ejecute un evento: "EJECUTANDO evento..."
- Si hay errores: "Error ejecutando evento..."
- Estado del programador: "Programador de eventos iniciado"
*/
