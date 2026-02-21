import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Search, Trash2, ShieldCheck, History, UserMinus, Loader2, CreditCard, User, Mail, Phone, MapPin, GraduationCap, Calendar, Award, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  mobile_no?: string | null;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  created_at: string;
  subscription_plan?: string | null;
  is_admin?: boolean;
  age?: number | null;
  gender?: string | null;
  state?: string | null;
  district?: string | null;
  place?: string | null;
  bio?: string | null;
  mode?: string | null;
  college_id?: string | null;
  college?: { name: string } | null;
  points?: number | null;
  referrer_id?: string | null;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*, college:colleges(name)")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: admins, error: adminsError } = await supabase
        .from("admins")
        .select("id");

      if (adminsError) throw adminsError;

      const adminIds = new Set(admins.map(a => a.id));
      
      const combinedData = profiles.map(profile => ({
        ...profile,
        is_admin: adminIds.has(profile.id)
      }));

      setUsers(combinedData);
    } catch (error: any) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This will remove all their data and cannot be undone.")) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({ title: "Success", description: "User deleted successfully." });
      setUsers(prev => prev.filter(u => u.id !== userId));
      setSelectedUser(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePromoteAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("admins")
        .insert({ id: userId, role: 'admin' });

      if (error) throw error;

      toast({ title: "Success", description: "User promoted to Admin." });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleGrantPremium = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ subscription_plan: 'premium' })
        .eq("id", userId);

      if (error) throw error;

      toast({ title: "Success", description: "Premium membership granted." });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDemoteAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("admins")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      toast({ title: "Success", description: "User removed from Admins." });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRevokePremium = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ subscription_plan: 'free' })
        .eq("id", userId);

      if (error) throw error;

      toast({ title: "Success", description: "Premium membership revoked." });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const filteredUsers = users.filter((user) => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage accounts, permissions, and history.</p>
        </div>
        <Button onClick={fetchUsers} variant="outline">Refresh</Button>
      </div>

      <div className="flex items-center gap-2 max-w-sm mb-6">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search users..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card/40 border-white/10 text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Joined</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading users...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="border-white/5">
                  <TableCell>
                    <div
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Avatar className="h-10 w-10 border border-white/10">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">{user.full_name?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm group-hover:text-primary transition-colors underline-offset-2 group-hover:underline">{user.full_name || "Unknown"}</span>
                        <span className="text-[10px] text-muted-foreground">@{user.username || "anonymous"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.is_admin && (
                        <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30">Admin</Badge>
                      )}
                      {user.subscription_plan === 'premium' && (
                        <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/30">Premium</Badge>
                      )}
                      {!user.is_admin && user.subscription_plan !== 'premium' && (
                        <Badge variant="outline" className="text-muted-foreground border-white/10">User</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 bg-card/95 backdrop-blur-xl border-white/10">
                        <DropdownMenuLabel>User Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/5" />
                        
                        <DropdownMenuItem onClick={() => navigate(`/admin/crush-history/${user.id}`)}>
                          <History className="mr-2 h-4 w-4" /> Crush History
                        </DropdownMenuItem>
                        
                        {!user.is_admin ? (
                          <DropdownMenuItem onClick={() => handlePromoteAdmin(user.id)}>
                            <ShieldCheck className="mr-2 h-4 w-4" /> Promote to Admin
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-orange-500 focus:text-orange-500" onClick={() => handleDemoteAdmin(user.id)}>
                            <ShieldCheck className="mr-2 h-4 w-4" /> Demote Admin
                          </DropdownMenuItem>
                        )}

                        {user.subscription_plan !== 'premium' ? (
                          <DropdownMenuItem onClick={() => handleGrantPremium(user.id)}>
                            <CreditCard className="mr-2 h-4 w-4" /> Grant Premium
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-orange-500 focus:text-orange-500" onClick={() => handleRevokePremium(user.id)}>
                            <CreditCard className="mr-2 h-4 w-4" /> Revoke Premium
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuSeparator className="bg-white/5" />
                        
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive focus:bg-destructive/10"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <UserMinus className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-2xl border-white/10 rounded-3xl p-0 overflow-hidden">
          {selectedUser && (
            <>
              {/* Header with avatar */}
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 px-6 pt-8 pb-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary/30">
                    <AvatarImage src={selectedUser.avatar_url || ""} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {selectedUser.full_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl font-bold">{selectedUser.full_name || "Unknown User"}</DialogTitle>
                    <p className="text-sm text-muted-foreground">@{selectedUser.username || "anonymous"}</p>
                    <div className="flex gap-1.5 mt-1.5">
                      {selectedUser.is_admin && <Badge className="bg-primary/20 text-primary text-[10px]">Admin</Badge>}
                      {selectedUser.subscription_plan === 'premium'
                        ? <Badge className="bg-yellow-500/20 text-yellow-500 text-[10px]">Premium</Badge>
                        : <Badge variant="outline" className="text-muted-foreground text-[10px] border-white/10">Standard</Badge>
                      }
                    </div>
                  </div>
                </div>
              </div>

              {/* Details grid */}
              <div className="px-6 py-4 space-y-1 max-h-[60vh] overflow-y-auto">
                {[
                  { icon: <Mail size={14} />, label: "Email", val: selectedUser.email },
                  { icon: <Phone size={14} />, label: "Phone", val: selectedUser.mobile_no || selectedUser.phone },
                  { icon: <User size={14} />, label: "Age / Gender", val: [selectedUser.age, selectedUser.gender].filter(Boolean).join(" · ") || null },
                  { icon: <GraduationCap size={14} />, label: "College", val: (selectedUser as any).college?.name || null },
                  { icon: <GraduationCap size={14} />, label: "Mode", val: selectedUser.mode || "Global" },
                  { icon: <Star size={14} />, label: "Points", val: selectedUser.points?.toString() ?? "0" },
                  { icon: <Calendar size={14} />, label: "Joined", val: format(new Date(selectedUser.created_at), "d MMM yyyy, HH:mm") },
                  { icon: <Award size={14} />, label: "User ID", val: selectedUser.id },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground flex-shrink-0 mt-0.5">{icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">{label}</p>
                      <p className="text-sm text-foreground break-all">{val || <span className="text-muted-foreground/40 italic">Not set</span>}</p>
                    </div>
                  </div>
                ))}

                {/* Location row with Google Maps link */}
                {(() => {
                  const locParts = [selectedUser.place, selectedUser.district, selectedUser.state].filter(Boolean);
                  const locStr = locParts.join(", ");
                  const mapsUrl = locStr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locStr)}` : null;
                  return (
                    <div className="flex items-start gap-3 py-2.5 border-b border-white/5">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground flex-shrink-0 mt-0.5"><MapPin size={14} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Location</p>
                        {locStr ? (
                          <a
                            href={mapsUrl!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            {locStr}
                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                        ) : (
                          <span className="text-muted-foreground/40 italic text-sm">Not set</span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Bio */}
                {selectedUser.bio && (
                  <div className="flex items-start gap-3 py-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground flex-shrink-0 mt-0.5">
                      <User size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Bio</p>
                      <p className="text-sm text-foreground leading-relaxed">{selectedUser.bio}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action footer */}
              <div className="px-6 py-4 border-t border-white/5 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-white/10"
                  onClick={() => navigate(`/admin/crush-history/${selectedUser.id}`)}
                >
                  <History size={14} className="mr-1.5" /> Crush History
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="border-0 bg-destructive/20 text-destructive hover:bg-destructive hover:text-white"
                  onClick={() => handleDeleteUser(selectedUser.id)}
                >
                  <UserMinus size={14} className="mr-1.5" /> Delete
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
