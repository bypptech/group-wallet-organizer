/**
 * Biometric authentication utilities
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { biometricStorage } from './storage';

export type BiometricType = 'fingerprint' | 'facial_recognition' | 'iris';

/**
 * Check if biometric hardware is available
 */
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
};

/**
 * Get available biometric types
 */
export const getBiometricTypes = async (): Promise<BiometricType[]> => {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const biometricTypes: BiometricType[] = [];

    types.forEach((type) => {
      switch (type) {
        case LocalAuthentication.AuthenticationType.FINGERPRINT:
          biometricTypes.push('fingerprint');
          break;
        case LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION:
          biometricTypes.push('facial_recognition');
          break;
        case LocalAuthentication.AuthenticationType.IRIS:
          biometricTypes.push('iris');
          break;
      }
    });

    return biometricTypes;
  } catch (error) {
    console.error('Error getting biometric types:', error);
    return [];
  }
};

/**
 * Get biometric type display name
 */
export const getBiometricDisplayName = (types: BiometricType[]): string => {
  if (types.includes('facial_recognition')) {
    return 'Face ID';
  }
  if (types.includes('fingerprint')) {
    return 'Fingerprint';
  }
  if (types.includes('iris')) {
    return 'Iris';
  }
  return 'Biometric';
};

/**
 * Authenticate with biometrics
 */
export const authenticateWithBiometric = async (
  promptMessage: string = 'Authenticate to continue'
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Check if biometric is enabled in settings
    const isEnabled = await biometricStorage.isBiometricEnabled();
    if (!isEnabled) {
      return {
        success: false,
        error: 'Biometric authentication is not enabled',
      };
    }

    // Check if biometric is available
    const isAvailable = await isBiometricAvailable();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication is not available',
      };
    }

    // Authenticate
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Use passcode',
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error) {
    console.error('Error authenticating with biometric:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
};

/**
 * Enable biometric authentication
 */
export const enableBiometric = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Check if biometric is available
    const isAvailable = await isBiometricAvailable();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication is not available on this device',
      };
    }

    // Test authentication
    const authResult = await authenticateWithBiometric('Enable biometric authentication');
    if (!authResult.success) {
      return authResult;
    }

    // Save to storage
    await biometricStorage.enableBiometric();

    return { success: true };
  } catch (error) {
    console.error('Error enabling biometric:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable biometric',
    };
  }
};

/**
 * Disable biometric authentication
 */
export const disableBiometric = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    await biometricStorage.disableBiometric();
    return { success: true };
  } catch (error) {
    console.error('Error disabling biometric:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable biometric',
    };
  }
};

/**
 * Check if biometric is enabled
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  return biometricStorage.isBiometricEnabled();
};
