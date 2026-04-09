import { useLayoutEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ROUTES } from "./routes";
import { useAppDispatch } from "@/app/store/hooks";
import { setSidebarOpen } from "@/app/store/slices/uiSlice";
import LandingPage from "@/features/landing/LandingPage";
import ChatPage from "@/features/chat/ChatPage";
import CollectionsPage from "@/features/collections/CollectionsPage";
import RecentsPage from "@/features/recents/RecentsPage";
import AuthModal from "@/shared/components/AuthModal";

function SidebarInit() {
  const dispatch = useAppDispatch();
  useLayoutEffect(() => {
    // Open on desktop, closed on mobile/tablet
    dispatch(setSidebarOpen(window.innerWidth >= 1024));
  }, [dispatch]);
  return null;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <SidebarInit />
      <AuthModal />
      <Routes>
        <Route path={ROUTES.HOME} element={<LandingPage />} />
        <Route path={ROUTES.CHAT} element={<ChatPage />} />
        <Route path={ROUTES.COLLECTIONS} element={<CollectionsPage />} />
        <Route path={ROUTES.RECENTS} element={<RecentsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
