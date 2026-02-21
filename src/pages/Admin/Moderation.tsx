import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { AlertCircle, Trash2, ShieldBan, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Report {
  id: string;
  target_id: string;
  target_type: 'post' | 'user' | 'comment';
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
}

const AdminModeration = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      // Don't show toast on 404/missing table to avoid spamming if migration hasn't run
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (reportId: string, action: 'dismiss' | 'resolve', targetId?: string, targetType?: string) => {
    try {
      if (action === 'resolve' && targetType === 'post') {
          // logic to delete post could go here
          // For now just marking report as resolved
      }

      const { error } = await supabase
        .from("reports")
        .update({ status: action === 'dismiss' ? 'dismissed' : 'resolved' })
        .eq("id", reportId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Report ${action === 'dismiss' ? 'dismissed' : 'resolved'}.`,
      });
      
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update report.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Moderation Center</h1>
        <Button onClick={fetchReports} variant="outline" size="sm">Refresh</Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Pending</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          <ReportsTable reports={reports} loading={loading} onAction={handleAction} />
        </TabsContent>
        <TabsContent value="posts" className="mt-4">
          <ReportsTable reports={reports.filter(r => r.target_type === 'post')} loading={loading} onAction={handleAction} />
        </TabsContent>
        <TabsContent value="users" className="mt-4">
           <ReportsTable reports={reports.filter(r => r.target_type === 'user')} loading={loading} onAction={handleAction} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const ReportsTable = ({ reports, loading, onAction }: { reports: Report[], loading: boolean, onAction: any }) => {
    if (loading) return <div className="p-8 text-center">Loading reports...</div>;
    
    if (reports.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center p-12 border rounded-md border-dashed bg-slate-50 dark:bg-slate-900/50 text-slate-500">
                <CheckCircle className="h-10 w-10 mb-3 opacity-20" />
                <p>No pending reports. All clear!</p>
            </div>
        )
    }

    return (
        <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Type</TableHead>
              <TableHead className="text-muted-foreground">Reason</TableHead>
              <TableHead className="text-muted-foreground">Target ID</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
             {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Badge variant="outline" className={report.target_type === 'user' ? 'border-blue-200 text-blue-700' : 'border-orange-200 text-orange-700'}>
                        {report.target_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{report.reason}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{report.target_id.substring(0, 8)}...</TableCell>
                  <TableCell className="text-sm text-slate-500">
                    {format(new Date(report.created_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onAction(report.id, 'dismiss')}
                      >
                        Dismiss
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onAction(report.id, 'resolve', report.target_id, report.target_type)}
                      >
                        {report.target_type === 'user' ? <ShieldBan className="h-4 w-4 mr-1"/> : <Trash2 className="h-4 w-4 mr-1"/>}
                        {report.target_type === 'user' ? 'Ban' : 'Delete'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        </div>
    )
}

export default AdminModeration;
