import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  CreditCard, 
  Settings, 
  LogOut,
  Menu,
  X,
  Activity,
  Flag,
  GraduationCap,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    { label: "Users", icon: Users, path: "/admin/users" },
    { label: "Posts", icon: Activity, path: "/admin/posts" },
    { label: "Moderation", icon: Flag, path: "/admin/moderation" },
    { label: "Colleges", icon: GraduationCap, path: "/admin/colleges" },
    { label: "Premium Plans", icon: CreditCard, path: "/admin/premium" },
    { label: "Invite", icon: Link2, path: "/admin/invite" },
    { label: "Analytics", icon: Activity, path: "/admin/analytics" },
    { label: "Settings", icon: Settings, path: "/admin/settings" },
  ];

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-card/50 backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex flex-col z-50`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <span className="font-display font-bold text-xl text-gradient-brand">Crushere</span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="ml-auto text-muted-foreground hover:text-white hover:bg-white/5"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-300 ${
                      isActive 
                        ? "bg-primary/20 text-primary font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
                        : "text-muted-foreground hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon size={22} className={isActive ? "text-primary" : ""} />
                    {isSidebarOpen && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-6 border-t border-white/10">
          <Button 
            variant="ghost" 
            className={`w-full flex items-center ${isSidebarOpen ? "justify-start gap-3" : "justify-center"} text-red-400 hover:text-red-300 hover:bg-red-500/10`}
            onClick={handleLogout}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {/* Background Gradients */}
        <div className="fixed inset-0 pointer-events-none z-0">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-crush/5 blur-[120px]" />
        </div>

        <div className="relative z-10 p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
