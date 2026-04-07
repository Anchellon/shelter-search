import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slices/userSlice";
import chatReducer from "./slices/chatSlice";
import uiReducer from "./slices/uiSlice";
import conversationsReducer from "./slices/conversationsSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    chat: chatReducer,
    ui: uiReducer,
    conversations: conversationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
