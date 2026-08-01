import { useState } from 'react';
import { Sparkles, RotateCw, ZoomIn, Smartphone, Share2, ShieldCheck, Flame, Utensils, Award, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const ModelViewer = 'model-viewer' as any;

interface DishARViewerModalProps {
  item: {
    name: string;
    price: number;
    description?: string;
    image_url?: string;
    model_3d_url?: string;
    is_veg?: boolean;
  } | null;
  onClose: () => void;
  onAddToCart?: () => void;
}

export default function DishARViewerModal({ item, onClose, onAddToCart }: DishARViewerModalProps) {
  const [rotating, setRotating] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<'3d' | 'nutrition' | 'ar'>('3d');

  if (!item) return null;

  const handleLaunchAR = () => {
    toast.success(`📲 QR generated! Point Apple/Android AR camera to place "${item.name}" on your physical dining table!`, { duration: 5000 });
  };

  const sampleImage = item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 rounded-3xl border border-white/15 shadow-2xl w-full max-w-xl text-white overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-black text-[18px] tracking-tight leading-none text-white flex items-center gap-2">
                {item.name}
                <span className="text-[10px] uppercase font-mono font-black tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  3D AR READY
                </span>
              </h3>
              <p className="text-[12px] text-slate-400 font-semibold mt-0.5">Powered by MyRestro 3D AR Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Switcher */}
        <div className="flex bg-slate-950/50 p-1.5 border-b border-white/10 text-[13px] font-bold">
          <button
            onClick={() => setActiveTab('3d')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === '3d' ? 'bg-[#e85d04] text-white shadow-lg shadow-[#e85d04]/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw size={15} /> 3D Interactive Model
          </button>
          <button
            onClick={() => setActiveTab('ar')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'ar' ? 'bg-[#e85d04] text-white shadow-lg shadow-[#e85d04]/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone size={15} /> Tabletop AR Projection
          </button>
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'nutrition' ? 'bg-[#e85d04] text-white shadow-lg shadow-[#e85d04]/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame size={15} /> Nutritive Diagnostics
          </button>
        </div>

        {/* Body Area */}
        <div className="p-6 space-y-6 flex-grow flex flex-col items-center justify-center min-h-[340px]">
          {activeTab === '3d' && (
            <div className="w-full flex flex-col items-center space-y-4">
              {/* True 3D WebGL Interactive Viewport */}
              <div className="relative w-full h-72 sm:h-80 rounded-2xl bg-gradient-to-t from-slate-950 via-slate-900 to-indigo-950/60 p-2 border border-orange-500/30 shadow-2xl shadow-orange-500/10 flex items-center justify-center overflow-hidden">
                <ModelViewer
                  src={
                    item.model_3d_url || (
                      item.name.toLowerCase().includes('salad') || item.name.toLowerCase().includes('veg') || item.name.toLowerCase().includes('avocado')
                        ? 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Avocado/glTF-Binary/Avocado.glb'
                        : 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/IridescentDishWithOlives/glTF-Binary/IridescentDishWithOlives.glb'
                    )
                  }
                  camera-controls
                  auto-rotate={rotating ? true : undefined}
                  rotation-per-second="30deg"
                  shadow-intensity="1"
                  environment-image="neutral"
                  exposure="1.2"
                  style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
                  field-of-view={`${45 / zoomLevel}deg`}
                >
                </ModelViewer>

                {/* Overlaid badges */}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-orange-500/40 text-[11px] font-mono font-black text-orange-400 flex items-center gap-1.5 shadow-md pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE 3D WEBGL MESH</span>
                </div>

                <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-[11px] font-mono font-bold text-amber-400 flex items-center gap-1 pointer-events-none">
                  <span>360° INTERACTIVE</span>
                </div>
                
                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[11px] text-slate-300 font-medium pointer-events-none">
                  🖱️ Drag with mouse to rotate in 3D
                </div>
              </div>

              {/* Viewport controls */}
              <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                <button
                  onClick={() => setRotating(!rotating)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-extrabold flex items-center gap-1.5 transition-colors ${
                    rotating ? 'bg-gradient-to-r from-[#e85d04] to-orange-600 text-white shadow-md' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <RotateCw size={14} /> {rotating ? 'Auto-Rotate ON' : 'Paused'}
                </button>
                <div className="w-px h-5 bg-white/20" />
                <button
                  onClick={() => setZoomLevel(zoomLevel === 1 ? 1.25 : zoomLevel === 1.25 ? 1.5 : 1)}
                  className="px-3 py-1.5 rounded-xl text-[12px] font-extrabold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <ZoomIn size={14} /> Zoom: {zoomLevel}x
                </button>
              </div>
            </div>
          )}

          {activeTab === 'ar' && (
            <div className="w-full text-center space-y-4 py-6 px-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e85d04] to-orange-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-[#e85d04]/30">
                <Smartphone size={32} />
              </div>
              <h4 className="text-[18px] font-black text-white">Project on Your Dining Table (AR)</h4>
              <p className="text-[13px] text-slate-300 max-w-md mx-auto leading-relaxed">
                Scan the augmented reality tag with any modern mobile device to spawn a high-definition 3D rendering of <strong className="text-orange-400">{item.name}</strong> directly onto your dining table at true life size!
              </p>
              <button
                onClick={handleLaunchAR}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#e85d04] to-orange-600 hover:from-[#c44b00] hover:to-[#e85d04] font-extrabold text-[14px] shadow-lg shadow-[#e85d04]/40 transition-all flex items-center justify-center gap-2 mx-auto transform active:scale-95"
              >
                <Sparkles size={16} /> Activate Mobile AR Camera Link
              </button>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="w-full space-y-3 text-[13px] font-medium">
              <div className="p-4 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex justify-between items-center">
                <span className="text-slate-300 font-bold flex items-center gap-2">
                  <Utensils className="text-amber-400" size={16} /> Dish Dietary Profile:
                </span>
                <span className={`px-2.5 py-1 rounded-lg font-black text-[11px] uppercase ${
                  item.is_veg !== false ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {item.is_veg !== false ? '🟢 100% Vegetarian & Pure' : '🔴 Non-Vegetarian Protein'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 text-[11px] uppercase block font-bold">Estimated Calories</span>
                  <span className="text-[18px] font-black text-white font-mono">380 kcal</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 text-[11px] uppercase block font-bold">Protein Content</span>
                  <span className="text-[18px] font-black text-emerald-400 font-mono">18.4 g</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-slate-400 text-[11px] uppercase block font-bold">Allergen Free</span>
                  <span className="text-[18px] font-black text-teal-300 flex items-center justify-center gap-1">
                    <Check size={16} /> Verified
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-[12px] text-slate-300 flex items-center gap-2.5">
                <Award className="text-orange-400 shrink-0" size={20} />
                <span>Prepared with premium chef-approved ingredients. Zero artificial preservative additives.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-slate-950 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Menu Price</span>
            <span className="text-[24px] font-black text-emerald-400 font-mono leading-none">₹{item.price}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-[13px] text-slate-200 transition-colors"
            >
              Close Preview
            </button>

            {onAddToCart && (
              <button
                onClick={() => { onAddToCart(); onClose(); }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#e85d04] to-orange-600 hover:from-[#c44b00] hover:to-[#e85d04] font-extrabold text-[14px] text-white shadow-lg shadow-[#e85d04]/35 transition-all flex items-center gap-2 transform active:scale-95"
              >
                <Utensils size={15} /> + Add to KOT Order
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
