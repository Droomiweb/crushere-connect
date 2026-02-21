import { useState } from "react";
import { Search as SearchIcon, MapPin, ChevronRight, Loader2 } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/lib/supabase";

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from("profiles")
        .select(`
          *,
          colleges:college_id (name)
        `)
        .or(`full_name.ilike.%${val}%,username.ilike.%${val}%,place.ilike.%${val}%`)
        .limit(10);
      
      setResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="px-4 pt-6">
        <h1 className="font-display font-bold text-2xl mb-5">Find People</h1>
        
        <div className="relative mb-6">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search username, name, or college..."
            className="crushere-input w-full pl-12 pr-4 py-4 rounded-2xl text-base shadow-glow focus:shadow-glow-lg transition-all"
            autoFocus
          />
        </div>

        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary" size={32} />
            </div>
          ) : results.length > 0 ? (
            results.map((u, idx) => (
              <button
                key={u.id}
                className="w-full feed-card p-4 flex items-center gap-4 text-left animate-in slide-in-from-bottom-2 fade-in"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-brand flex items-center justify-center text-xl shrink-0">
                  {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover rounded-2xl" /> : "👤"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm truncate">{u.full_name}</p>
                  <p className="text-muted-foreground text-xs flex items-center gap-1">
                    @{u.username} • <MapPin size={10} /> {u.place || "Nearby"}
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground" size={16} />
              </button>
            ))
          ) : query.length >= 2 ? (
            <div className="text-center py-20 px-10">
               <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
                  <SearchIcon size={24} className="text-muted-foreground opacity-50" />
               </div>
               <p className="font-bold">No results for "{query}"</p>
               <p className="text-xs text-muted-foreground">Try spelling a bit differently or search for a college.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-4 opacity-50 grayscale pointer-events-none">
                <div className="p-4 bg-muted/20 rounded-2xl border border-border border-dashed h-40" />
                <div className="p-4 bg-muted/20 rounded-2xl border border-border border-dashed h-40" />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
