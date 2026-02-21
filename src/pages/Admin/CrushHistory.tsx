import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Loader2, ChevronLeft, Heart, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CrushRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  is_mutual: boolean;
  sender: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
  receiver: {
    full_name: string;
    username: string;
    avatar_url: string;
  };
}

const AdminCrushHistory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<CrushRequest[]>([]);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Fetch user name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", id)
          .single();
        
        if (profile) setUserName(profile.full_name || "Unknown");

        // Fetch all crush requests involving this user
        const { data, error } = await supabase
          .from("crushes")
          .select(`
            *,
            sender:profiles!sender_id (full_name, username, avatar_url),
            receiver:profiles!receiver_id (full_name, username, avatar_url)
          `)
          .or(`sender_id.eq.${id},receiver_id.eq.${id}`)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setRequests(data as any || []);
      } catch (error: any) {
        console.error("Error fetching crush history:", error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/admin/users")}
          className="h-10 w-10 border border-white/5 bg-white/5 rounded-2xl"
        >
          <ChevronLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crush History</h1>
          <p className="text-muted-foreground">Showing history for <span className="text-primary font-bold">{userName}</span></p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">From</TableHead>
              <TableHead className="text-muted-foreground">To</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Fetching history...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No crush history found for this user.
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => {
                const isSent = request.sender_id === id;
                return (
                  <TableRow key={request.id} className="border-white/5">
                    <TableCell>
                      <Badge variant="outline" className={isSent ? "border-primary/20 text-primary bg-primary/5" : "border-crush/20 text-crush bg-crush/5"}>
                        {isSent ? "Sent" : "Received"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={request.sender?.avatar_url} />
                            <AvatarFallback className="text-[10px]">{request.sender?.full_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{isSent ? "Self" : request.sender?.full_name}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={request.receiver?.avatar_url} />
                            <AvatarFallback className="text-[10px]">{request.receiver?.full_name?.[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{!isSent ? "Self" : request.receiver?.full_name}</span>
                       </div>
                    </TableCell>
                    <TableCell>
                      {request.is_mutual ? (
                        <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                          <Zap size={12} fill="currentColor" /> Match!
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                          <Heart size={12} /> Pending
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-[10px] text-muted-foreground">
                      {format(new Date(request.created_at), "MMM d, HH:mm")}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminCrushHistory;
