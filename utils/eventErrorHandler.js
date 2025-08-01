/**
 * Event Conflict Handler Component
 * Displays user-friendly error messages for event conflicts
 */

import React from 'react';
import { Alert } from 'react-native';

/**
 * Shows an alert for event conflicts with user-friendly options
 * @param {Object} conflictInfo - Conflict information from handleEventConflictError
 * @param {Function} onViewEvents - Callback to navigate to events list
 * @param {Function} onEditEvent - Callback to edit the current event
 */
export const showEventConflictAlert = (conflictInfo, onViewEvents = null, onEditEvent = null) => {
  const buttons = [
    { text: 'Entendido', style: 'default' }
  ];

  // Add navigation options if provided
  if (onViewEvents) {
    buttons.push({
      text: 'Ver Eventos Existentes',
      onPress: onViewEvents,
      style: 'default'
    });
  }

  if (onEditEvent) {
    buttons.push({
      text: 'Modificar Horarios',
      onPress: onEditEvent,
      style: 'default'
    });
  }

  Alert.alert(
    '⚠️ Conflicto de Horarios',
    `${conflictInfo.message}\n\n💡 ${conflictInfo.suggestion || 'Intenta cambiar el horario o los días del evento.'}`,
    buttons,
    { cancelable: true }
  );
};

/**
 * Shows a generic validation error alert
 * @param {Object} errorInfo - Error information from handleApiError
 * @param {Function} onDismiss - Optional callback when alert is dismissed
 */
export const showValidationErrorAlert = (errorInfo, onDismiss = null) => {
  Alert.alert(
    errorInfo.title || 'Error de Validación',
    errorInfo.message,
    [{ text: 'OK', onPress: onDismiss }]
  );
};

/**
 * Generic error alert handler
 * @param {Object} errorInfo - Error information from handleApiError
 * @param {Function} onDismiss - Optional callback when alert is dismissed
 */
export const showGenericErrorAlert = (errorInfo, onDismiss = null) => {
  Alert.alert(
    errorInfo.title || 'Error',
    errorInfo.message,
    [{ text: 'OK', onPress: onDismiss }]
  );
};

/**
 * Main error handler that decides which type of alert to show
 * @param {Object} errorInfo - Error information from handleApiError
 * @param {Object} options - Options for navigation and callbacks
 */
export const handleErrorWithAlert = (errorInfo, options = {}) => {
  const { onViewEvents, onEditEvent, onDismiss } = options;

  if (errorInfo.isConflict) {
    showEventConflictAlert(errorInfo, onViewEvents, onEditEvent);
  } else if (errorInfo.title === 'Error de Validación') {
    showValidationErrorAlert(errorInfo, onDismiss);
  } else {
    showGenericErrorAlert(errorInfo, onDismiss);
  }
};

/**
 * Hook for handling event operations with conflict validation and auto-refresh
 */
export const useEventErrorHandler = () => {
  /**
   * Handles the result of an event creation/update operation
   * @param {Object} result - Result from createEvent or updateEvent
   * @param {Object} navigation - React Navigation object
   * @param {Function} onSuccess - Callback for successful operations
   * @param {boolean} shouldRefreshEvents - Whether to navigate to Events screen to refresh
   */
  const handleEventOperationResult = (result, navigation = null, onSuccess = null, shouldRefreshEvents = true) => {
    if (result.success) {
      if (onSuccess) {
        onSuccess(result);
      }
      
      // If shouldRefreshEvents is true and we have navigation, go to Events to refresh
      if (shouldRefreshEvents && navigation) {
        setTimeout(() => {
          navigation.navigate('Events');
        }, 100); // Small delay to allow state updates
      }
      
      return true;
    } else {
      const conflictInfo = handleEventConflictError(result);
      
      if (conflictInfo.isConflict) {
        showEventConflictAlert(
          conflictInfo,
          navigation ? () => navigation.navigate('Events') : null,
          navigation ? () => navigation.goBack() : null
        );
      } else {
        const errorInfo = handleApiError({ response: { data: result } });
        showGenericErrorAlert(errorInfo);
      }
      return false;
    }
  };

  return { handleEventOperationResult };
};

// Re-export from apiClient for convenience
export { handleEventConflictError, handleApiError } from './apiClient';

export default {
  showEventConflictAlert,
  showValidationErrorAlert,
  showGenericErrorAlert,
  handleErrorWithAlert,
  useEventErrorHandler
};
