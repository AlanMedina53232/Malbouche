/**
 * API Client with conflict validation support
 * Handles the new backend event conflict validation
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import eventRefreshService from './eventRefreshService';

const BACKEND_URL = process.env.BACKEND_URL || 'https://malbouche-backend.onrender.com/api';

/**
 * Generic API request function with authentication
 */
const apiRequest = async (endpoint, options = {}) => {
  try {
    const token = await AsyncStorage.getItem('token');
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };

    const response = await fetch(`${BACKEND_URL}${endpoint}`, {
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        response: { data },
        message: data.error || 'Request failed'
      };
    }

    return data;
  } catch (error) {
    // Re-throw with consistent error structure
    throw {
      status: error.status || 500,
      response: error.response || { data: { error: error.message } },
      message: error.message || 'Network error'
    };
  }
};

/**
 * Event Management API Functions
 */

/**
 * Get all events
 */
export const getAllEvents = async () => {
  try {
    const response = await apiRequest('/events');
    return {
      success: true,
      events: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener eventos'
    };
  }
};

/**
 * Get event by ID
 */
export const getEventById = async (eventId) => {
  try {
    const response = await apiRequest(`/events/${eventId}`);
    return {
      success: true,
      event: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener evento'
    };
  }
};

/**
 * Create new event with conflict validation support
 */
export const createEvent = async (eventData) => {
  try {
    const response = await apiRequest('/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
    
    // Request refresh on successful creation
    eventRefreshService.requestRefresh();
    
    return {
      success: true,
      event: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al crear evento',
      details: error.response?.data?.details
    };
  }
};

/**
 * Update event with conflict validation support
 */
export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await apiRequest(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    });
    
    // Request refresh on successful update
    eventRefreshService.requestRefresh();
    
    return {
      success: true,
      event: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al actualizar evento',
      details: error.response?.data?.details
    };
  }
};

/**
 * Delete event
 */
export const deleteEvent = async (eventId) => {
  try {
    await apiRequest(`/events/${eventId}`, {
      method: 'DELETE'
    });
    
    // Request refresh on successful deletion
    eventRefreshService.requestRefresh();
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al eliminar evento'
    };
  }
};

/**
 * Movement Management API Functions
 */

/**
 * Get all movements
 */
export const getAllMovements = async () => {
  try {
    const response = await apiRequest('/movements');
    return {
      success: true,
      movements: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || 'Error al obtener movimientos'
    };
  }
};

/**
 * Error Handling Utilities
 */

/**
 * Handles event conflict errors specifically
 * @param {Object} error - Error object from API response
 * @returns {Object} Conflict information and user-friendly message
 */
export const handleEventConflictError = (error) => {
  if (error.details && Array.isArray(error.details)) {
    const conflictError = error.details.find(detail => 
      detail.msg && detail.msg.includes('Conflicto de horarios detectado')
    );
    
    if (conflictError) {
      return {
        isConflict: true,
        message: conflictError.msg,
        suggestion: 'Intenta cambiar el horario o los días del evento para evitar superposiciones',
        param: conflictError.param || 'horaInicio'
      };
    }
  }
  
  return {
    isConflict: false,
    message: error.error || 'Error desconocido'
  };
};

/**
 * Generic error handler for API responses
 * @param {Object} error - Error object
 * @returns {Object} User-friendly error information
 */
export const handleApiError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        // Check if it's a conflict error first
        const conflictInfo = handleEventConflictError(data);
        if (conflictInfo.isConflict) {
          return {
            title: 'Conflicto de Horarios',
            message: conflictInfo.message,
            suggestion: conflictInfo.suggestion,
            isConflict: true
          };
        }
        
        // Handle other validation errors
        const validationErrors = data.details 
          ? data.details.map(detail => detail.msg).join('\n')
          : data.error;
        
        return {
          title: 'Error de Validación',
          message: validationErrors || 'Los datos proporcionados no son válidos'
        };
      
      case 401:
        return {
          title: 'Sesión Expirada',
          message: 'Por favor, inicia sesión nuevamente'
        };
      
      case 403:
        return {
          title: 'Sin Permisos',
          message: 'No tienes permisos para realizar esta acción'
        };
      
      case 404:
        return {
          title: 'No Encontrado',
          message: 'El recurso solicitado no existe'
        };
      
      case 409:
        return {
          title: 'Conflicto',
          message: data.error || 'Ya existe un recurso con estos datos'
        };
      
      case 429:
        return {
          title: 'Demasiadas Peticiones',
          message: 'Has excedido el límite de peticiones. Intenta más tarde'
        };
      
      default:
        return {
          title: 'Error del Servidor',
          message: data.error || 'Ha ocurrido un error inesperado'
        };
    }
  } else if (error.request) {
    return {
      title: 'Error de Conexión',
      message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet'
    };
  } else {
    return {
      title: 'Error',
      message: 'Ha ocurrido un error inesperado'
    };
  }
};

export default {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllMovements,
  handleEventConflictError,
  handleApiError
};
