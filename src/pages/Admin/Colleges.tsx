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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ExternalLink, 
  Trash2, 
  Ban, 
  CheckCircle,
  Plus,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface College {
  id: string;
  name: string;
  google_map_url: string;
  state: string;
  district: string;
  is_active: boolean;
  created_at: string;
}

interface CollegeRequest {
  id: string;
  name: string;
  google_map_url: string;
  status: string;
  state: string;
  district: string;
  created_at: string;
}

const AdminColleges = () => {
  const [colleges, setColleges] = useState<College[]>([]);
  const [requests, setRequests] = useState<CollegeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: collegeData, error: collegeError } = await supabase
        .from("colleges")
        .select("*")
        .order("created_at", { ascending: false });

      if (collegeError) throw collegeError;
      setColleges(collegeData || []);

      const { data: requestData, error: requestError } = await supabase
        .from("college_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (requestError) throw requestError;
      setRequests(requestData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load colleges data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (college: College) => {
    try {
      const { error } = await supabase
        .from("colleges")
        .update({ is_active: !college.is_active })
        .eq("id", college.id);

      if (error) throw error;
      toast({ title: `College ${college.is_active ? "Deactivated" : "Activated"}` });
      fetchData();
    } catch (error) {
      toast({ title: "Error updating status", variant: "destructive" });
    }
  };

  const handleDeleteCollege = async (id: string) => {
    if (!confirm("Are you sure you want to delete this college?")) return;
    try {
      const { error } = await supabase.from("colleges").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "College deleted" });
      fetchData();
    } catch (error) {
      toast({ title: "Error deleting college", variant: "destructive" });
    }
  };

  const handleApproveRequest = async (request: CollegeRequest) => {
    try {
      // 1. Add to colleges
      const { data: college, error: collegeError } = await supabase
        .from("colleges")
        .insert({
          name: request.name,
          google_map_url: request.google_map_url,
          country: "India", // Default
          state: request.state,
          district: request.district,
          is_active: true
        })
        .select()
        .single();

      if (collegeError) throw collegeError;

      // 2. Update request status
      const { error: requestError } = await supabase
        .from("college_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      if (requestError) throw requestError;

      toast({ title: "College Approved and Added!" });
      fetchData();
    } catch (error) {
      toast({ title: "Error approving request", variant: "destructive" });
    }
  };

  const handleRejectRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from("college_requests")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Request rejected" });
      fetchData();
    } catch (error) {
      toast({ title: "Error rejecting request", variant: "destructive" });
    }
  };

  const filteredColleges = colleges.filter((c) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.district.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">College Management</h1>
        <Button onClick={fetchData} variant="outline" className="gap-2">
          <Loader2 className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Pending Requests Section */}
      {requests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
             Pending Requests <Badge variant="destructive">{requests.length}</Badge>
          </h2>
          <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur overflow-hidden">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5">
                  <TableHead className="text-muted-foreground">College Name</TableHead>
                  <TableHead className="text-muted-foreground">Location</TableHead>
                  <TableHead className="text-muted-foreground">Maps Link</TableHead>
                  <TableHead className="text-right text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id} className="border-white/5">
                    <TableCell className="font-medium">{req.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{req.district}, {req.state}</TableCell>
                    <TableCell>
                      {req.google_map_url && (
                        <a 
                          href={req.google_map_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-xs"
                        >
                          View Map <ExternalLink size={12} />
                        </a>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => handleRejectRequest(req.id)}
                        >
                          Reject
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 gap-1"
                          onClick={() => handleApproveRequest(req)}
                        >
                          <CheckCircle size={14} /> Approve
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Approved Colleges Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Active Colleges</h2>
          <div className="flex items-center gap-2 max-w-sm">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search colleges..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-card/50 border-white/10"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur overflow-hidden">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="border-white/5">
                <TableHead className="text-muted-foreground">College Name</TableHead>
                <TableHead className="text-muted-foreground">Location</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && colleges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filteredColleges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No colleges found.</TableCell>
                </TableRow>
              ) : 
                filteredColleges.map((college) => (
                  <TableRow key={college.id} className="border-white/5">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{college.name}</span>
                        {college.google_map_url && (
                          <a 
                            href={college.google_map_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 text-[10px]"
                          >
                             Map Link <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{college.district}, {college.state}</TableCell>
                    <TableCell>
                      <Badge variant={college.is_active ? "default" : "secondary"} className={college.is_active ? "bg-green-500" : ""}>
                        {college.is_active ? "Active" : "Banned"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          title={college.is_active ? "Ban College" : "Restore College"}
                          className={college.is_active ? "text-orange-400 hover:text-orange-300" : "text-green-400 hover:text-green-300"}
                          onClick={() => handleToggleStatus(college)}
                        >
                          {college.is_active ? <Ban size={16} /> : <CheckCircle size={16} />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => handleDeleteCollege(college.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              }
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminColleges;
