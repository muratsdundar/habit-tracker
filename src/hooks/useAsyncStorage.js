import { useState, useEffect, useRef, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';

export function useAsyncStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const valueRef = useRef(storedValue);
  const initialValueRef = useRef(initialValue);

  const loadStoredValue = useCallback(async () => {
    try {
      const item = await AsyncStorage.getItem(key);
      if (item !== null) {
        try {
          const parsed = JSON.parse(item);
          setStoredValue(parsed);
          valueRef.current = parsed;
        } catch (parseError) {
          console.warn(`Error parsing JSON for key "${key}":`, parseError);
          // Graceful degradation: clear corrupted state
          await AsyncStorage.removeItem(key);
          setStoredValue(initialValueRef.current);
          valueRef.current = initialValueRef.current;
        }
      } else {
        setStoredValue(initialValueRef.current);
        valueRef.current = initialValueRef.current;
      }
    } catch (error) {
      console.warn(`Error reading AsyncStorage key "${key}":`, error);
    } finally {
      setIsLoading(false);
    }
  }, [key]);

  useEffect(() => {
    loadStoredValue();
    
    const subscription = DeviceEventEmitter.addListener(`async-storage-${key}`, (newValue) => {
      setStoredValue(newValue);
      valueRef.current = newValue;
    });

    return () => {
      subscription.remove();
    };
  }, [loadStoredValue, key]);

  const setValue = useCallback(async (value) => {
    try {
      const valueToStore = value instanceof Function ? value(valueRef.current) : value;
      
      setStoredValue(valueToStore);
      valueRef.current = valueToStore;
      
      if (valueToStore === undefined || valueToStore === null) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      }
      
      DeviceEventEmitter.emit(`async-storage-${key}`, valueToStore);
    } catch (error) {
      console.warn(`Error setting AsyncStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue, isLoading, loadStoredValue];
}
