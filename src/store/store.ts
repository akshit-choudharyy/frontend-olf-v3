import { configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage'; // Defaults to localStorage for web
import { persistReducer, persistStore } from 'redux-persist';
import { combineReducers } from 'redux';
import authReducer from './auth/authSlice';
import modalReducer from './modals/modalSlice';

// Combine reducers
const rootReducer = combineReducers({
  auth: authReducer,
  modals: modalReducer,
});

// Configure persist
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // Persist only auth (optional, remove for all reducers)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store with persisted reducer
export const store = configureStore({
  reducer: persistedReducer,
});

// Create persistor
export const persistor = persistStore(store);

// Types for the state and dispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
