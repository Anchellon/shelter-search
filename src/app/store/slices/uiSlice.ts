import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UIState {
  sidebarOpen: boolean;
  activeGroupId: number | null;
  resultsPanelOpen: boolean;
  resultsPanelExpanded: boolean;
}

const initialState: UIState = {
  sidebarOpen: false, // desktop opens via SidebarInit layout effect; default closed for mobile
  activeGroupId: null,
  resultsPanelOpen: false,
  resultsPanelExpanded: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.sidebarOpen = action.payload;
    },
    setActiveGroupId(state, action: PayloadAction<number | null>) {
      state.activeGroupId = action.payload;
    },
    openResultsPanel(state) {
      state.resultsPanelOpen = true;
    },
    closeResultsPanel(state) {
      state.resultsPanelOpen = false;
      state.resultsPanelExpanded = false;
    },
    toggleResultsPanelExpanded(state) {
      state.resultsPanelExpanded = !state.resultsPanelExpanded;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setActiveGroupId,
  openResultsPanel,
  closeResultsPanel,
  toggleResultsPanelExpanded,
} = uiSlice.actions;

export default uiSlice.reducer;
