import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface ConversationSummary {
  id: string;
  title: string;
}

interface ConversationsState {
  conversations: ConversationSummary[];
  loading: boolean;
}

const initialState: ConversationsState = {
  conversations: [],
  loading: false,
};

const conversationsSlice = createSlice({
  name: "conversations",
  initialState,
  reducers: {
    setConversations(state, action: PayloadAction<ConversationSummary[]>) {
      state.conversations = action.payload;
    },
    setConversationsLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

export const { setConversations, setConversationsLoading } = conversationsSlice.actions;
export default conversationsSlice.reducer;
