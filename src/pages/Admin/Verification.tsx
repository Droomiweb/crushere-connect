import { useEffect, useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, ShieldAlert, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  avatar_url: string | null;
  verification_status: string;
  created_at: string;
  verification_document_url?: string; // Hypothetical field
}

const AdminVerification = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("verification_status", "pending")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching pending verifications:", error);
      toast({
        title: "Error",
        description: "Failed to load verification queue.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleVerification = async (userId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          verification_status: status, 
          is_verified: status === 'verified' 
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: status === 'verified' ? "User Verified" : "Verification Rejected",
        description: `User has been ${status}.`,
        variant: status === 'verified' ? "default" : "destructive",
      });
      
      // Remove from local list
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Verification Queue</h1>
        <Button onClick={fetchPendingUsers} variant="outline" size="sm">Refresh</Button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Submitted</TableHead>
              <TableHead className="text-muted-foreground">Proof</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <ShieldAlert className="h-8 w-8 mb-2 opacity-30" />
                    <p>No pending verifications.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || ""} />
                      <AvatarFallback>{user.full_name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.full_name || "Unknown"}</span>
                      <span className="text-xs text-slate-500">{user.email || user.phone}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {/* Placeholder for Document viewing */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <FileText className="h-4 w-4" /> View ID
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Verification Document</DialogTitle>
                                <DialogDescription>
                                    Reviewing ID for {user.full_name}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="h-64 bg-slate-100 flex items-center justify-center rounded-md border border-dashed">
                                <p className="text-muted-foreground">Document Preview Placeholder</p> 
                                {/* In real app, img tag with user.verification_document_url */}
                            </div>
                        </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleVerification(user.id, 'rejected')}
                      >
                        <X className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleVerification(user.id, 'verified')}
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminVerification;
