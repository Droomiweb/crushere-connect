import React, { useState, useEffect } from "react";
import { 
  Type, Image as ImageIcon, Layout, Box, PaintBucket,
  Save, X, PlusCircle, Move, Trash2, ArrowLeft, Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export interface ProfileLayoutData {
  background: {
    type: "color" | "gradient" | "image";
    value: string;
  };
  elements: ProfileElement[];
}

export interface ProfileElement {
  id: string;
  type: "text" | "image" | "link";
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  fontSize?: string;
  fontFamily?: string;
  linkUrl?: string;
  borderRadius?: string;
}

interface ProfileBuilderProps {
  userId: string;
  initialLayout?: any;
  subscriptionPlan: string;
  onClose: () => void;
}

const DEFAULT_LAYOUT: ProfileLayoutData = {
  background: { type: "color", value: "#1a1b26" },
  elements: []
};

// Available fonts for premium
const PREMIUM_FONTS = ["Inter", "Comic Sans MS", "Impact", "Courier New", "Georgia"];

export default function ProfileBuilder({ userId, initialLayout, subscriptionPlan, onClose }: ProfileBuilderProps) {
  const { toast } = useToast();
  const [layout, setLayout] = useState<ProfileLayoutData>(() => {
    if (initialLayout && initialLayout.background) {
      return {
        ...initialLayout,
        elements: initialLayout.elements || []
      };
    }
    return DEFAULT_LAYOUT;
  });
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const isPremium = subscriptionPlan === 'premium';
  
  // Limits based on plan
  const maxImages = isPremium ? 7 : 2;
  const currentImageCount = layout.elements.filter(e => e.type === 'image').length;

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ profile_layout: layout })
        .eq('id', userId);
      
      if (error) throw error;
      toast({ title: "Profile design saved! 🎨" });
      onClose();
    } catch (err: any) {
      toast({ title: "Failed to save design", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addElement = (type: ProfileElement["type"]) => {
    if (type === 'image' && currentImageCount >= maxImages) {
      toast({ title: "Image Limit Reached", description: `You can only add ${maxImages} images on your current plan.`, variant: "destructive" });
      return;
    }

    const newElement: ProfileElement = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content: type === 'text' ? 'New Text' : type === 'link' ? 'Button' : 'https://placehold.co/150',
      x: 50,
      y: 100,
      color: '#ffffff',
      fontSize: '16px',
      fontFamily: 'Inter',
      borderRadius: '8px'
    };
    setLayout(prev => ({ ...prev, elements: [...(prev.elements || []), newElement] }));
    setSelectedId(newElement.id);
  };

  const updateSelected = (updates: Partial<ProfileElement>) => {
    if (!selectedId) return;
    setLayout(prev => ({
      ...prev,
      elements: prev.elements.map(e => e.id === selectedId ? { ...e, ...updates } : e)
    }));
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setLayout(prev => ({
      ...prev,
      elements: prev.elements.filter(e => e.id !== selectedId)
    }));
    setSelectedId(null);
  };

  const updateBackground = (type: "color" | "gradient" | "image", value: string) => {
    if ((type === 'gradient' || type === 'image') && !isPremium) {
      toast({ title: "Premium Feature", description: "Background images and gradients are for premium users only.", variant: "destructive" });
      return;
    }
    setLayout(prev => ({ ...prev, background: { type, value } }));
  };

  // Drag logic
  const handlePointerDown = (e: React.PointerEvent, el: ProfileElement) => {
    // Only drag if targeting the element itself, not its inputs
    if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
    
    setSelectedId(el.id);
    setIsDragging(true);
    // Calc offset relative to the element's top-left
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    // capture pointer to track outside bounds
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !selectedId) return;
    
    // Find canvas container to get relative bounds
    const canvas = document.getElementById('profile-canvas');
    if (!canvas) return;
    const canvasRect = canvas.getBoundingClientRect();

    let newX = e.clientX - canvasRect.left - dragOffset.x;
    let newY = e.clientY - canvasRect.top - dragOffset.y;

    // Bounds check
    newX = Math.max(0, Math.min(newX, canvasRect.width - 50));
    newY = Math.max(0, Math.min(newY, canvasRect.height - 50));

    updateSelected({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const selectedElement = layout.elements.find(e => e.id === selectedId);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col sm:flex-row overflow-hidden animate-in fade-in">
      
      {/* --- CANVAS AREA --- */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <div className="h-16 px-4 border-b border-border/40 flex items-center justify-between bg-card z-10 shrink-0">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-xl bg-muted/50 hover:bg-muted transition-colors">
            <ArrowLeft size={18} />
          </button>
          <p className="font-display font-bold text-sm">Profile Builder <span className="text-muted-foreground font-normal ml-1">({isPremium ? 'PRO' : 'Free'})</span></p>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-glow active:scale-95 transition-all flex items-center gap-2"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-hidden bg-black/40 p-4 flex items-center justify-center relative">
          
          {/* Mobile phone frame / Canvas bounds */}
          <div 
            id="profile-canvas"
            className="w-full h-[95%] sm:h-[812px] sm:max-w-[375px] max-h-full rounded-[2rem] overflow-hidden relative shadow-[0_0_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10"
            style={{
              background: layout.background.type === 'color' ? layout.background.value :
                          layout.background.type === 'gradient' ? layout.background.value :
                          `url(${layout.background.value}) center/cover no-repeat`
            }}
          >
            {/* Elements Layer */}
            {layout.elements.map(el => (
              <div 
                key={el.id}
                onPointerDown={(e) => handlePointerDown(e, el)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className={`absolute cursor-move overflow-hidden transition-shadow ${selectedId === el.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-transparent shadow-glow z-20' : 'z-10 hover:ring-1 hover:ring-white/30'}`}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  borderRadius: el.borderRadius,
                  touchAction: 'none'
                }}
              >
                {el.type === 'text' && (
                  <div style={{ color: el.color, fontSize: el.fontSize, fontFamily: el.fontFamily, whiteSpace: 'pre-wrap', padding: '4px 8px' }}>
                    {el.content}
                  </div>
                )}
                
                {el.type === 'image' && (
                  <img src={el.content} alt="Element" className="w-full h-full object-cover pointer-events-none" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400?text=Invalid+Image' }} />
                )}

                {el.type === 'link' && (
                  <div className="font-bold px-4 py-3 flex items-center justify-center text-sm w-full h-full pointer-events-none border border-white/10"
                    style={{
                      backgroundColor: el.color ? el.color : '#ec4899', 
                      color: el.fontSize === 'black' ? '#000' : '#fff', // hack to pass text color
                      borderRadius: el.borderRadius
                    }}
                  >
                    {el.content}
                  </div>
                )}
              </div>
            ))}

            {layout.elements.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 p-8 text-center pointer-events-none">
                <Layout size={48} className="mb-4 opacity-50" />
                <p className="font-bold">Blank Canvas</p>
                <p className="text-xs mt-2">Use the tools panel to add your first element.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- TOOLS PANEL --- */}
      <div className="w-full h-[45%] shrink-0 sm:shrink sm:h-full sm:w-80 bg-card border-t sm:border-t-0 sm:border-l border-border/40 flex flex-col z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] sm:shadow-none overflow-hidden">
        <div className="p-4 border-b border-white/5 shrink-0 flex gap-2 overflow-x-auto scroll-hidden">
          <button onClick={() => addElement('text')} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10 whitespace-nowrap"><Type size={14}/> Add Text</button>
          <button onClick={() => addElement('image')} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10 whitespace-nowrap"><ImageIcon size={14}/> Add Image</button>
          <button onClick={() => addElement('link')} className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl text-xs font-bold hover:bg-white/10 whitespace-nowrap"><Layout size={14}/> Add Link</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Background Settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-2"><PaintBucket size={14}/> Background</h3>
            <div className="grid grid-cols-5 gap-2">
              {['#1a1b26', '#0f172a', '#3f1d38', '#111827', '#000000'].map(color => (
                <button 
                  key={color} 
                  onClick={() => {
                    if (isPremium) updateBackground('color', color);
                    else toast({ title: "Premium feature", description: "Customizing background is for PRO users." });
                  }}
                  className={`aspect-square rounded-lg border-2 transition-all ${layout.background.value === color ? 'border-primary scale-110' : 'border-transparent'} ${!isPremium && 'opacity-30'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            
            <div className="mt-3">
              <p className={`text-xs mb-2 flex justify-between items-center ${isPremium ? 'text-foreground' : 'text-muted-foreground'}`}>
                Premium Backgrounds {!isPremium && <span className="bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded text-[10px] font-bold">PRO</span>}
              </p>
              <div className="grid grid-cols-2 gap-2 opacity-100">
                <button 
                  onClick={() => {
                    if (isPremium) updateBackground('gradient', 'radial-gradient(circle at 50% 10%, #2f2b3b, #000000)');
                    else toast({ title: "Premium feature", description: "Gradient backgrounds are for PRO users." });
                  }}
                  className={`h-12 rounded-lg ${!isPremium && 'opacity-30'}`} style={{ background: 'radial-gradient(circle at 50% 10%, #2f2b3b, #000000)' }}
                />
                <button 
                  onClick={() => {
                    if (isPremium) updateBackground('gradient', 'linear-gradient(to right bottom, #111827, #4338ca, #0f172a)');
                    else toast({ title: "Premium feature", description: "Gradient backgrounds are for PRO users." });
                  }}
                  className={`h-12 rounded-lg ${!isPremium && 'opacity-30'}`} style={{ background: 'linear-gradient(to right bottom, #111827, #4338ca, #0f172a)' }}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-2 opacity-100">
                {/* Dark geometric grid */}
                <button 
                  onClick={() => { if (isPremium) updateBackground('image', 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop'); else toast({ title: "Premium feature", description: "Image backgrounds are for PRO users." }); }}
                  className={`h-12 rounded-lg bg-cover bg-center border border-white/5 ${!isPremium && 'opacity-30'}`} style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&auto=format&fit=crop)' }}
                />
                {/* Dark wavy grain */}
                <button 
                  onClick={() => { if (isPremium) updateBackground('image', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop'); else toast({ title: "Premium feature", description: "Image backgrounds are for PRO users." }); }}
                  className={`h-12 rounded-lg bg-cover bg-center border border-white/5 ${!isPremium && 'opacity-30'}`} style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop)' }}
                />
                {/* Dark silk/liquid */}
                <button 
                  onClick={() => { if (isPremium) updateBackground('image', 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&auto=format&fit=crop'); else toast({ title: "Premium feature", description: "Image backgrounds are for PRO users." }); }}
                  className={`h-12 rounded-lg bg-cover bg-center border border-white/5 ${!isPremium && 'opacity-30'}`} style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=800&auto=format&fit=crop)' }}
                />
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-white/5" />

          {/* Selected Element Settings */}
          <div>
             <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-center">
               Selected Element
               {selectedElement && (
                 <button onClick={deleteSelected} className="text-destructive hover:bg-destructive/10 p-1 rounded-md transition-colors"><Trash2 size={14}/></button>
               )}
             </h3>
             
             {!selectedElement ? (
               <div className="text-center p-6 border border-dashed border-white/10 rounded-2xl bg-white/5">
                 <p className="text-xs text-muted-foreground">Select an element on the canvas to edit its properties.</p>
               </div>
             ) : (
               <div className="space-y-4 animate-in slide-in-from-right-4">
                 
                 {/* Common Props */}
                 {selectedElement.type !== 'image' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Content text</label>
                    <textarea 
                      value={selectedElement.content}
                      onChange={(e) => updateSelected({ content: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-1 ring-primary outline-none resize-none h-20"
                    />
                  </div>
                 )}

                 {selectedElement.type === 'image' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Image URL</label>
                    <input 
                      type="text"
                      value={selectedElement.content}
                      onChange={(e) => updateSelected({ content: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-1 ring-primary outline-none"
                    />
                  </div>
                 )}

                 {selectedElement.type === 'link' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">URL Destination</label>
                    <input 
                      type="url"
                      value={selectedElement.linkUrl || ''}
                      onChange={(e) => updateSelected({ linkUrl: e.target.value })}
                      placeholder="https://"
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-1 ring-primary outline-none"
                    />
                  </div>
                 )}

                 {/* Typography settings for Text */}
                 {selectedElement.type === 'text' && (
                   <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1">
                       <label className="text-[10px] uppercase font-bold text-muted-foreground">Color</label>
                       <div className="flex gap-2">
                         <input 
                           type="color" 
                           value={selectedElement.color || '#ffffff'}
                           onChange={(e) => updateSelected({ color: e.target.value })}
                           className="w-8 h-8 rounded shrink-0 cursor-pointer"
                         />
                         <input 
                           type="text" 
                           value={selectedElement.color || '#ffffff'}
                           onChange={(e) => updateSelected({ color: e.target.value })}
                           className="flex-1 min-w-0 bg-background border border-border rounded-lg px-2 text-xs"
                         />
                       </div>
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] uppercase font-bold text-muted-foreground">Size</label>
                       <select 
                         value={selectedElement.fontSize || '16px'}
                         onChange={(e) => updateSelected({ fontSize: e.target.value })}
                         className="w-full bg-background border border-border rounded-lg p-1.5 text-xs"
                       >
                         {['12px', '14px', '16px', '20px', '24px', '32px', '48px', '64px'].map(sz => (
                           <option key={sz} value={sz}>{sz}</option>
                         ))}
                       </select>
                     </div>
                     <div className="space-y-1 col-span-2">
                       <label className="text-[10px] uppercase font-bold flex justify-between">
                         <span className="text-muted-foreground">Font Family</span>
                         {!isPremium && <span className="text-yellow-500">PRO</span>}
                       </label>
                       <select 
                         disabled={!isPremium}
                         value={selectedElement.fontFamily || 'Inter'}
                         onChange={(e) => updateSelected({ fontFamily: e.target.value })}
                         className="w-full bg-background border border-border rounded-lg p-1.5 text-xs disabled:opacity-50"
                       >
                         {PREMIUM_FONTS.map(font => (
                           <option key={font} value={font}>{font}</option>
                         ))}
                       </select>
                     </div>
                   </div>
                 )}

                 {/* Dimensions and roundness for Image and Link */}
                 {(selectedElement.type === 'image' || selectedElement.type === 'link') && (
                   <div className="space-y-3">
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Width (px)</label>
                          <input 
                            type="number"
                            value={selectedElement.width || (selectedElement.type==='image'?150:120)}
                            onChange={(e) => updateSelected({ width: parseInt(e.target.value) || undefined })}
                            className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Height (px)</label>
                          <input 
                            type="number"
                            value={selectedElement.height || (selectedElement.type==='image'?150:40)}
                            onChange={(e) => updateSelected({ height: parseInt(e.target.value) || undefined })}
                            className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                          />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Roundness</label>
                        <select 
                          value={selectedElement.borderRadius || '8px'}
                          onChange={(e) => updateSelected({ borderRadius: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                        >
                          <option value="0px">Square</option>
                          <option value="8px">Slight Curve</option>
                          <option value="16px">Rounded Box</option>
                          <option value="999px">Pill / Circle</option>
                        </select>
                     </div>
                   </div>
                 )}
                 
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
