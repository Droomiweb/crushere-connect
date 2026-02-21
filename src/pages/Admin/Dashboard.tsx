import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, DollarSign, Activity, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubs: 0,
    totalPosts: 0,
    reportsPending: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // 1. Total Users
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // 2. Active Premium (approximate based on plans presence? or a user field?)
        // Assuming 'is_premium' or checking 'subscriptions' table if it existed.
        // For now, let's check profiles with 'is_verified' as a proxy or just 0 if no field.
        // Let's count 'verified' users for now as a "Verified Users" stat instead of Subs if Subs table isn't populated
        const { count: verifiedCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_verified", true);

        // 3. Reports Pending (if table exists)
        // We'll wrap this in try/catch in case migration hasn't run yet
        let reportsCount = 0;
        try {
            const { count } = await supabase
            .from("reports")
            .select("*", { count: "exact", head: true })
            .eq("status", "pending");
            reportsCount = count || 0;
        } catch (e) {
            console.log("Reports table might not exist yet");
        }

        // 4. Total Posts
        const { count: postsCount } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true });

        setStats({
          totalUsers: userCount || 0,
          activeSubs: verifiedCount || 0, // Using Verified as a proxy for "Quality" users
          totalPosts: postsCount || 0,
          reportsPending: reportsCount
        });

        // 5. Recent Signups
        const { data: recentData } = await supabase
          .from("profiles")
          .select("id, full_name, email, created_at, avatar_url")
          .order("created_at", { ascending: false })
          .limit(5);
        
        setRecentUsers(recentData || []);

      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
      return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40 border-white/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered accounts</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-white/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubs}</div>
             <p className="text-xs text-muted-foreground mt-1">Identity verified</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-white/10 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Posts</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
             <p className="text-xs text-muted-foreground mt-1">Community engagement</p>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-white/10 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reports</CardTitle>
            <DollarSign className="h-4 w-4 text-red-500" /> 
            {/* Keeping DollarIcon as placeholder/alert icon or swapping to Flag if imported */}
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">{stats.reportsPending}</div>
             <p className="text-xs text-muted-foreground mt-1">Requires attention</p>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card/40 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground border border-dashed border-white/10 rounded-2xl bg-black/20">
              Activity Chart Placeholder
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-card/40 border-white/10 backdrop-blur">
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-4">
                  <div className="h-9 w-9 rounded-full bg-black/40 border border-white/5 overflow-hidden">
                      {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
                      ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {user.full_name?.[0] || "?"}
                          </div>
                      )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none text-foreground">{user.full_name || "Unknown User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">
                    {format(new Date(user.created_at), "MMM d")}
                  </div>
                </div>
              ))}
              {recentUsers.length === 0 && <div className="text-sm text-muted-foreground">No recent signups.</div>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
