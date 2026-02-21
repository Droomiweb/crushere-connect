import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";

interface SystemSetting {
  key: string;
  value: any;
  description: string;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("key");

      if (error) throw error;
        
      // Normalize 'true'/'false' strings to booleans if needed, or handle in render
      // For this simplified version, we assume value is a JSONB boolean or string
      setSettings(data || []);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to load system settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = (key: string, currentValue: any) => {
     // Optimistic update
     setSettings(prev => prev.map(s => 
         s.key === key ? { ...s, value: !currentValue } : s
     ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all settings
      // available in 'settings' state
      const updates = settings.map(s => ({
          key: s.key,
          value: s.value
      }));

      const { error } = await supabase
        .from("system_settings")
        .upsert(updates);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "System configuration updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
        setSaving(false);
    }
  };

  // Default fallbacks if table is empty or specific keys missing
  const getSetting = (key: string) => {
      const s = settings.find(x => x.key === key);
      // Handle the fact that JSONB 'false' might be returned as false boolean or "false" string depending on how it was inserted
      // If s.value is boolean use it, if string parse it
      if (s) {
          if (typeof s.value === 'boolean') return s.value;
          if (typeof s.value === 'string') return s.value === 'true';
      }
      return false; 
  };

  if (loading) {
      return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
          <Card className="glass-card border-white/10 bg-card/40">
              <CardHeader>
                  <CardTitle>Global Access Control</CardTitle>
                  <CardDescription className="text-muted-foreground">Manage general access to the platform.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                  <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                           Temporarily disable access for non-admin users.
                        </p>
                    </div>
                    <Switch 
                        id="maintenance_mode" 
                        checked={getSetting('maintenance_mode')}
                        onCheckedChange={() => handleToggle('maintenance_mode', getSetting('maintenance_mode'))}
                    />
                  </div>
                  
                   <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-0.5">
                        <Label htmlFor="allow_signups">Allow New Registrations</Label>
                        <p className="text-sm text-muted-foreground">
                           Toggle to stop new users from signing up.
                        </p>
                    </div>
                    <Switch 
                        id="allow_signups" 
                        checked={getSetting('allow_signups')}
                        onCheckedChange={() => handleToggle('allow_signups', getSetting('allow_signups'))}
                    />
                  </div>
              </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
