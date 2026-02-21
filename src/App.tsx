import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Feed from "./pages/Feed";
import Chat from "./pages/Chat";
import Matchmaker from "./pages/Matchmaker";
import Rooms from "./pages/Rooms";
import Search from "./pages/Search";
import Events from "./pages/Events";
import RoomView from './pages/RoomView';
import Premium from "./pages/Premium";
import Privacy from "./pages/Privacy";
import Profile from "./pages/Profile";
import CreatePost from "./pages/CreatePost";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import AdminLayout from "./pages/Admin/layouts/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard";
import AdminUsers from "./pages/Admin/Users";
import AdminPremium from "./pages/Admin/Premium";
import AdminModeration from "./pages/Admin/Moderation";
import AdminPosts from "./pages/Admin/Posts";
import AdminCrushHistory from "./pages/Admin/CrushHistory";
import AdminSettings from "./pages/Admin/Settings";
import AdminProtectedRoute from "./pages/Admin/routes/AdminProtectedRoute";
import AdminAnalytics from "./pages/Admin/Analytics";
import AdminColleges from "./pages/Admin/Colleges";
import AdminInvite from "./pages/Admin/Invite";
import { NotificationProvider } from "./components/NotificationProvider";

const queryClient = new QueryClient();

const App = () => {
  // Check for configuration on mount
  React.useEffect(() => {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      setTimeout(() => {
        // Simple alert or toast since toaster might not be ready if context crashes
        // But here we are inside providers
        console.warn("Missing Supabase Configuration");
        // We can use Sonner here via the component below, but we don't have the hook here easily 
        // without extracting a child component. 
        // For now, allow the app to render.
      }, 1000);
    }
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <NotificationProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/matches" element={<Matchmaker />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/:id" element={<RoomView />} />
            <Route path="/search" element={<Search />} />
            <Route path="/events" element={<Events />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/profile/:id" element={<PublicProfile />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminProtectedRoute />}>
               <Route element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="posts" element={<AdminPosts />} />
                  <Route path="crush-history/:id" element={<AdminCrushHistory />} />
                  <Route path="moderation" element={<AdminModeration />} />
                  <Route path="premium" element={<AdminPremium />} />
                  <Route path="colleges" element={<AdminColleges />} />
                  <Route path="invite" element={<AdminInvite />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="settings" element={<AdminSettings />} />
               </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </NotificationProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
