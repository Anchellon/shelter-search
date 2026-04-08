import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface UIState {
  sidebarOpen: boolean;
  activeGroupId: number | null;
  activeReferralId: string | null;
  resultsPanelOpen: boolean;
  resultsPanelExpanded: boolean;
  authModalOpen: boolean;
}

const initialState: UIState = {
  sidebarOpen: false, // desktop opens via SidebarInit layout effect; default closed for mobile
  activeGroupId: null,
  activeReferralId: null,
  resultsPanelOpen: false,
  resultsPanelExpanded: false,
  authModalOpen: false,
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
    setActiveReferralId(state, action: PayloadAction<string | null>) {
      state.activeReferralId = action.payload;
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
    openAuthModal(state) {
      state.authModalOpen = true;
    },
    closeAuthModal(state) {
      state.authModalOpen = false;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setActiveGroupId,
  setActiveReferralId,
  openResultsPanel,
  closeResultsPanel,
  toggleResultsPanelExpanded,
  openAuthModal,
  closeAuthModal,
} = uiSlice.actions;

export default uiSlice.reducer;
