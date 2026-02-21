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
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  duration_days: number;
  is_active: boolean;
}

const AdminPremium = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<Plan>>({});
  const { toast } = useToast();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Error",
        description: "Failed to load plans.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSavePlan = async () => {
    try {
      if (currentPlan.id) {
        // Update
        const { error } = await supabase
          .from("subscription_plans")
          .update(currentPlan)
          .eq("id", currentPlan.id);
        if (error) throw error;
        toast({ title: "Plan updated" });
      } else {
        // Create
        const { error } = await supabase
          .from("subscription_plans")
          .insert([currentPlan]);
        if (error) throw error;
        toast({ title: "Plan created" });
      }
      setIsDialogOpen(false);
      fetchPlans();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save plan.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    try {
      const { error } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Plan deleted" });
      fetchPlans();
    } catch (error) {
      toast({ title: "Error", description: "Could not delete plan.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Premium Plans</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setCurrentPlan({})}>
              <Plus className="mr-2 h-4 w-4" /> Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{currentPlan.id ? "Edit Plan" : "Create Plan"}</DialogTitle>
              <DialogDescription>
                Configure pricing and duration for premium subscriptions.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input 
                  id="name" 
                  value={currentPlan.name || ""} 
                  onChange={(e) => setCurrentPlan({...currentPlan, name: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Price</Label>
                <Input 
                  id="price" 
                  type="number"
                  value={currentPlan.price_monthly || ""} 
                  onChange={(e) => setCurrentPlan({...currentPlan, price_monthly: parseFloat(e.target.value)})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">Days</Label>
                <Input 
                  id="duration" 
                  type="number"
                  value={currentPlan.duration_days || ""} 
                  onChange={(e) => setCurrentPlan({...currentPlan, duration_days: parseInt(e.target.value)})}
                  className="col-span-3" 
                />
              </div>
               <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Desc</Label>
                <Textarea 
                  id="description" 
                  value={currentPlan.description || ""} 
                  onChange={(e) => setCurrentPlan({...currentPlan, description: e.target.value})}
                  className="col-span-3" 
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">Active</Label>
                <Switch 
                  id="active" 
                  checked={currentPlan.is_active ?? true}
                  onCheckedChange={(checked) => setCurrentPlan({...currentPlan, is_active: checked})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSavePlan}>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Name</TableHead>
              <TableHead className="text-muted-foreground">Price</TableHead>
              <TableHead className="text-muted-foreground">Duration</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-right text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Loading...</TableCell></TableRow>
            ) : plans.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">No plans functionality configured.</TableCell></TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-medium">
                    {plan.name}
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </TableCell>
                  <TableCell>${plan.price_monthly}</TableCell>
                  <TableCell>{plan.duration_days} days</TableCell>
                  <TableCell>
                    {plan.is_active ? (
                      <span className="text-green-400 text-xs font-bold border border-green-800 bg-green-900/20 px-2 py-0.5 rounded-full">Active</span>
                    ) : (
                      <span className="text-muted-foreground text-xs border border-white/10 px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setCurrentPlan(plan); setIsDialogOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-300 hover:bg-red-900/20" onClick={() => handleDelete(plan.id)}>
                        <Trash2 className="h-4 w-4" />
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

export default AdminPremium;
