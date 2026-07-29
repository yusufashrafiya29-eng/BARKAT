import { useState } from 'react';
import { ImagePlus, Loader2, FileText, Trash2, Box, Edit3, X, Sparkles, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';
import { useOwnerStore } from '../../store/ownerStore';


export default function MenuTab({ handleOpenRecipeEditor, handleOpenEditMenu }: { handleOpenRecipeEditor: (item: any) => void, handleOpenEditMenu: (item: any) => void }) {
  const { menuCategories, fetchData, model3dCredits } = useOwnerStore();
  const [isUploadingImage, setIsUploadingImage] = useState<Record<string, boolean>>({});
  const [isGenerating3D, setIsGenerating3D] = useState<Record<string, boolean>>({});
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItemFor3D, setSelectedItemFor3D] = useState<any>(null);
  const [targetHeight, setTargetHeight] = useState<number>(12);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenConfirmModal = (item: any) => {
    setSelectedItemFor3D(item);
    setTargetHeight(item.model_3d_height || 12.0);
    setShowConfirmModal(true);
  };

  const handleConfirmGenerate = async () => {
    if (!selectedItemFor3D) return;
    setIsSubmitting(true);
    try {
      // Update default height on the item first
      await ownerApi.updateMenuItem(selectedItemFor3D.id, { model_3d_height: targetHeight });
      setShowConfirmModal(false);
      // Trigger AI generation
      await handleGenerate3D(selectedItemFor3D);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update item size settings");
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleGenerate3D = async (item: any) => {
    if (!item.image_url) {
      toast.error("Please upload an image first");
      return;
    }
    
    setIsGenerating3D(prev => ({ ...prev, [item.id]: true }));
    try {
      if (!item.model_3d_task_id) {
        await ownerApi.generate3DModel(item.id);
        toast.success("AI 3D Generation started! This takes about 30 seconds.");
      } else {
        toast.success("Resuming 3D generation check...");
      }
      
      const interval = setInterval(async () => {
        try {
          const res = await ownerApi.check3DModelStatus(item.id);
          if (res.status === 'success') {
            clearInterval(interval);
            setIsGenerating3D(prev => ({ ...prev, [item.id]: false }));
            toast.success(`3D Model for ${item.name} is ready!`);
            fetchData();
          } else if (res.status === 'failed') {
            clearInterval(interval);
            setIsGenerating3D(prev => ({ ...prev, [item.id]: false }));
            toast.error(`Failed to generate 3D model for ${item.name}`);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 5000);
      
    } catch (e: any) {
      setIsGenerating3D(prev => ({ ...prev, [item.id]: false }));
      toast.error(e.response?.data?.detail || "Failed to start generation");
    }
  };

  const handleImageUpload = async (itemId: string, file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }
    
    setIsUploadingImage(prev => ({ ...prev, [itemId]: true }));
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      await ownerApi.uploadMenuItemImage(itemId, formData);
      toast.success("Image uploaded successfully");
      fetchData(); // refresh menu to get new image URL
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to upload image");
    } finally {
      setIsUploadingImage(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleToggleMenu = async (itemId: string, currentAvail: boolean, name: string) => {
    try {
      await ownerApi.toggleMenuItemAvailability(itemId, !currentAvail);
      toast.success(`${name} updated`);
      fetchData();
    } catch { toast.error("Update failed"); }
  };

  const handleDeleteMenuItem = async (itemId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name} from the menu?`)) return;
    try {
      await ownerApi.deleteMenuItem(itemId);
      toast.success(`${name} deleted`);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div className="space-y-12">
      {/* Credit Balance Header */}
      <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-6">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse animate-duration-1000 animate-ease-in-out shrink-0" />
          <div>
            <h4 className="text-[13px] font-bold text-indigo-950 uppercase tracking-wider">AI 3D AR Model Credits</h4>
            <p className="text-[11px] text-indigo-700/80 leading-normal">Generate realistic 3D AR models from food images using AI</p>
          </div>
        </div>
        <div className="bg-indigo-600 text-white font-bold py-1.5 px-4 rounded-full text-[13px] shadow-[0_4px_10px_rgba(79,70,229,0.2)] shrink-0">
          {model3dCredits} Credits Remaining
        </div>
      </div>

      {menuCategories.length === 0 ? (
          <div className="surface p-12 text-center border-dashed border-subtle">
            <p className="text-[13px] text-muted">No items found in catalog.</p>
          </div>
      ) : menuCategories.map((cat: any) => (
        <div key={cat.id}>
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-[14px] font-medium">{cat.name}</h3>
            <div className="flex-1 h-px bg-subtle"></div>
            <span className="text-[12px] text-muted">{cat.menu_items?.length} items</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cat.menu_items?.map((item: any) => (
              <div key={item.id} className="surface p-4 flex flex-col relative group">
                
                {/* Image Section */}
                <div className="w-full h-32 rounded-xl bg-subtle/30 overflow-hidden mb-4 relative group/image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted">
                      <ImagePlus size={24} className="mb-2 opacity-50" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">No Photo</span>
                    </div>
                  )}
                  
                  {/* Hover Upload Overlay */}
                  <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                    {isUploadingImage[item.id] ? (
                      <Loader2 size={24} className="animate-spin text-white" />
                    ) : (
                      <>
                        <ImagePlus size={20} className="text-white mb-1" />
                        <span className="text-white text-[10px] font-bold uppercase tracking-wider">{item.image_url ? 'Change Photo' : 'Upload Photo'}</span>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/jpeg, image/png, image/webp" 
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(item.id, e.target.files[0]);
                            }
                          }}
                        />
                      </>
                    )}
                  </label>
                </div>

                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-[14px] font-medium pr-4 text-main">{item.name}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-muted">₹{item.price}</span>
                    <button 
                      onClick={() => handleOpenRecipeEditor(item)}
                      className="text-muted hover:text-indigo-500 transition-colors p-1 rounded hover:bg-indigo-50"
                      title="Edit Recipe / BOM"
                    >
                      <FileText size={14} />
                    </button>
                    {item.image_url && !item.model_3d_url && (
                      <button 
                        onClick={() => handleOpenConfirmModal(item)}
                        disabled={isGenerating3D[item.id] || !!item.model_3d_task_id}
                        className={`text-muted transition-colors p-1 rounded ${isGenerating3D[item.id] || item.model_3d_task_id ? 'text-indigo-500 animate-pulse bg-indigo-50' : 'hover:text-indigo-500 hover:bg-indigo-50'}`}
                        title="Generate 3D AR Model"
                      >
                        <Box size={14} />
                      </button>
                    )}
                    {item.model_3d_url && (
                      <div className="text-emerald-500 p-1 bg-emerald-50 rounded" title="3D AR Active">
                        <Box size={14} />
                      </div>
                    )}
                    <button 
                      onClick={() => handleOpenEditMenu(item)}
                      className="text-muted hover:text-indigo-500 transition-colors p-1 rounded hover:bg-indigo-50"
                      title="Edit Menu Item"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteMenuItem(item.id, item.name)}
                      className="text-muted hover:text-rose-500 transition-colors p-1 rounded hover:bg-rose-50"
                      title="Delete Item"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-[13px] text-muted line-clamp-2 mb-4 leading-normal h-[40px]">{item.description}</p>
                
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-subtle border-dashed">
                    <div className={`w-3 h-3 flex items-center justify-center border rounded-sm ${item.is_veg ? 'border-emerald-500/50' : 'border-rose-500/50'}`}>
                      <div className={`w-1.5 h-1.5 rounded-sm ${item.is_veg ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    </div>
                    <button
                      onClick={() => handleToggleMenu(item.id, item.is_available, item.name)}
                      className={`text-[11px] font-medium px-2 py-1 rounded transition-colors ${item.is_available 
                        ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                        : 'bg-surface border border-subtle text-muted hover:text-main'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Out of Stock'}
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>

      {/* 3D GENERATION CONFIRMATION MODAL */}
      {showConfirmModal && selectedItemFor3D && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowConfirmModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col">
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse animate-duration-1000 animate-ease-in-out" />
                <h3 className="text-[18px] font-bold text-slate-900">Generate 3D AR Model</h3>
              </div>
              <button 
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Item Info Card */}
              <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedItemFor3D.image_url ? (
                  <img 
                    src={selectedItemFor3D.image_url} 
                    alt={selectedItemFor3D.name} 
                    className="w-16 h-16 rounded-lg object-cover border border-slate-200" 
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                    <Box size={24} />
                  </div>
                )}
                <div>
                  <h4 className="text-[14px] font-bold text-slate-900">{selectedItemFor3D.name}</h4>
                  <p className="text-[12px] text-slate-500 leading-normal line-clamp-2 mt-0.5">{selectedItemFor3D.description || 'No description provided.'}</p>
                </div>
              </div>

              {/* Height Settings Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Target Model Height</label>
                  <span className="bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full text-[12px] border border-indigo-100">
                    {targetHeight} cm
                  </span>
                </div>
                
                <input 
                  type="range"
                  min="5"
                  max="40"
                  step="0.5"
                  value={targetHeight}
                  onChange={(e) => setTargetHeight(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />

                {/* Presets Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: 'Beverage', size: 8.0, desc: '8cm (Glass/Cup)' },
                    { label: 'Standard', size: 12.0, desc: '12cm (Burger/Plate)' },
                    { label: 'Large/Pizza', size: 18.0, desc: '18cm (Pan/Platter)' }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setTargetHeight(preset.size)}
                      className={`py-1.5 px-2 rounded-lg text-center border transition-colors ${
                        targetHeight === preset.size 
                          ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700' 
                          : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                      }`}
                    >
                      <p className="text-[11px] font-bold">{preset.label}</p>
                      <p className="text-[9px] opacity-85 mt-0.5">{preset.size}cm</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Credit Status / Warn Box */}
              <div className={`p-3.5 rounded-xl border flex gap-3 ${
                model3dCredits > 0 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}>
                {model3dCredits > 0 ? (
                  <>
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[12px] font-bold">1 Credit will be deducted</p>
                      <p className="text-[11px] opacity-85 mt-0.5">Remaining Balance: {model3dCredits} Credits</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <p className="text-[12px] font-bold">Insufficient Credit Balance</p>
                      <p className="text-[11px] opacity-85 mt-0.5">You have 0 credits. Please contact support or purchase more credits to generate models.</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 rounded-xl text-[13px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex-1"
              >
                Cancel
              </button>
              <button 
                type="button" 
                disabled={isSubmitting || model3dCredits <= 0}
                onClick={handleConfirmGenerate}
                className="py-2.5 px-4 rounded-xl text-[13px] font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none transition-colors flex-1 flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin animate-duration-1000" />
                ) : (
                  <>
                    <Sparkles size={14} /> Confirm & Generate
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

