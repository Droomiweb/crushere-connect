import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

const AdminAnalytics = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
      </div>

      <Card className="glass-card border-white/10 bg-card/40 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <BarChart3 className="text-primary" />
            Platform Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="h-96 flex flex-col items-center justify-center text-muted-foreground border-t border-white/5">
           <BarChart3 className="h-16 w-16 mb-4 opacity-20" />
           <p className="text-lg font-medium">Analytics Dashboard Coming Soon</p>
           <p className="text-sm opacity-60 max-w-md text-center mt-2">
             Detailed metrics about user growth, engagement, and revenue will be available here in future updates.
           </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
