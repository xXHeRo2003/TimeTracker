import AsyncStorage from '@react-native-async-storage/async-storage';

const warn = (message, error) => {
  console.warn(`[storage] ${message}`, error);
};

export const readString = async (key) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    warn(`Unable to read key "${key}"`, error);
    return null;
  }
};

export const writeString = async (key, value) => {
  try {
    if (value == null) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, String(value));
    }
  } catch (error) {
    warn(`Unable to persist key "${key}"`, error);
  }
};

export const readJson = async (key, fallback) => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch (error) {
    warn(`Unable to parse JSON for "${key}"`, error);
    return fallback;
  }
};

export const writeJson = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    warn(`Unable to persist JSON for "${key}"`, error);
  }
};

