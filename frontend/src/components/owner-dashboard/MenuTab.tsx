import { useState, useEffect } from 'react';
import { ImagePlus, Loader2, FileText, Trash2, Box, Edit3, X, Sparkles, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';
import { useOwnerStore } from '../../store/ownerStore';
import DishARViewerModal from '../DishARViewerModal';


export default function MenuTab({ handleOpenRecipeEditor, handleOpenEditMenu }: { handleOpenRecipeEditor: (item: any) => void, handleOpenEditMenu: (item: any) => void }) {
  const { menuCategories, fetchData, model3dCredits } = useOwnerStore();
  const [isUploadingImage, setIsUploadingImage] = useState<Record<string, boolean>>({});
  const [isGenerating3D, setIsGenerating3D] = useState<Record<string, boolean>>({});
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedItemFor3D, setSelectedItemFor3D] = useState<any>(null);
  const [selectedItemForARPreview, setSelectedItemForARPreview] = useState<any>(null);
  const [targetHeight, setTargetHeight] = useState<number>(12);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New advanced generation configurations
  const [aiModel, setAiModel] = useState<string>("meshy-6");
  const [removeLighting, setRemoveLighting] = useState<boolean>(true);
  const [enablePbr, setEnablePbr] = useState<boolean>(true);
  const [textureResolution, setTextureResolution] = useState<string>("2k");

  // Global polling for items that have a task_id but no url
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;
    
    const pendingItems = menuCategories.flatMap(cat => cat.menu_items || []).filter(item => item.model_3d_task_id && !item.model_3d_url);
    
    if (pendingItems.length > 0) {
      intervalId = setInterval(async () => {
        let needsRefresh = false;
        for (const item of pendingItems) {
          try {
            const res = await ownerApi.check3DModelStatus(item.id);
            if (res.status === 'success') {
              toast.success(`3D Model for ${item.name} is ready!`);
              needsRefresh = true;
            } else if (res.status === 'failed') {
              toast.error(`Failed to generate 3D model for ${item.name}`);
              needsRefresh = true;
            }
          } catch (e) {
            console.error("Polling error", e);
          }
        }
        if (needsRefresh) {
          fetchData();
        }
      }, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    }
  }, [menuCategories, fetchData]);

  const handleOpenConfirmModal = (item: any) => {
    setSelectedItemFor3D(item);
    setTargetHeight(item.model_3d_height || 12.0);
    setAiModel("meshy-6");
    setRemoveLighting(true);
    setEnablePbr(true);
    setTextureResolution("2k");
    setShowConfirmModal(true);
  };

  const handleConfirmGenerate = async () => {
    if (!selectedItemFor3D) return;
    setIsSubmitting(true);
    try {
      // Update default height on the item first
      await ownerApi.updateMenuItem(selectedItemFor3D.id, { model_3d_height: targetHeight });
      setShowConfirmModal(false);
      // Trigger AI generation with advanced options
      await handleGenerate3D(selectedItemFor3D, {
        ai_model: aiModel,
        enable_pbr: enablePbr,
        texture_resolution: textureResolution
      });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to start generation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!selectedItemFor3D) return;
    setIsSubmitting(true);
    try {
      const nextActive = !selectedItemFor3D.model_3d_active;
      await ownerApi.updateMenuItem(selectedItemFor3D.id, { model_3d_active: nextActive });
      toast.success(`3D Model ${nextActive ? 'activated' : 'deactivated'}`);
      setSelectedItemFor3D((prev: any) => ({ ...prev, model_3d_active: nextActive }));
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Action failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteModel = async () => {
    if (!selectedItemFor3D) return;
    if (!window.confirm("Are you sure you want to delete this 3D model?")) return;
    setIsSubmitting(true);
    try {
      await ownerApi.delete3DModel(selectedItemFor3D.id);
      toast.success("3D Model deleted successfully");
      setShowConfirmModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Delete failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerate3D = async (item: any, payload: any) => {
    if (!item.image_url) {
      toast.error("Please upload an image first");
      return;
    }
    
    setIsGenerating3D(prev => ({ ...prev, [item.id]: true }));
    try {
      await ownerApi.generate3DModel(item.id, payload);
      toast.success("AI 3D Generation started! This takes about 30-40 seconds.");
      
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
            fetchData();
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

  const handleImageUpload = async (itemId: string, file: File, slot: string = "main") => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }
    
    setIsUploadingImage(prev => ({ ...prev, [`${itemId}_${slot}`]: true }));
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      await ownerApi.uploadMenuItemImage(itemId, formData, slot);
      toast.success(`${slot === 'main' ? 'Main' : slot === 'extra1' ? 'Angle 1' : 'Angle 2'} image uploaded successfully`);
      fetchData(); // refresh menu to get new image URL
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to upload image");
    } finally {
      setIsUploadingImage(prev => ({ ...prev, [`${itemId}_${slot}`]: false }));
    }
  };

  const handleImageDelete = async (itemId: string, slot: string) => {
    if (!window.confirm("Are you sure you want to remove this image?")) return;
    try {
      await ownerApi.deleteMenuItemImage(itemId, slot);
      toast.success("Image removed successfully");
      fetchData();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to remove image");
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
                <div className="w-full h-32 rounded-xl bg-subtle/30 overflow-hidden mb-2 relative group/image">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted">
                      <ImagePlus size={24} className="mb-2 opacity-50" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">No Photo</span>
                    </div>
                  )}
                </div>

                {/* Multiple Angle Image Slots */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {/* Main Photo Slot */}
                  <div className="relative group/thumb border border-subtle rounded-lg overflow-hidden h-14 bg-subtle/25 flex flex-col items-center justify-center text-center">
                    {item.image_url ? (
                      <img src={item.image_url} alt="Main" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted">
                        <ImagePlus size={14} className="opacity-60" />
                        <span className="text-[8px] font-medium uppercase tracking-wider mt-0.5">Main</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                      {isUploadingImage[`${item.id}_main`] ? (
                        <Loader2 size={12} className="animate-spin text-white" />
                      ) : (
                        <>
                          <ImagePlus size={10} className="text-white mb-0.5" />
                          <span className="text-[8px] text-white font-bold uppercase">Main</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/jpeg, image/png, image/webp" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(item.id, e.target.files[0], "main");
                          }
                        }}
                      />
                    </label>
                    {item.image_url && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleImageDelete(item.id, "main"); }}
                        className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10 hover:bg-rose-600"
                        title="Remove image"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>

                  {/* Extra Photo 1 Slot */}
                  <div className="relative group/thumb border border-subtle rounded-lg overflow-hidden h-14 bg-subtle/25 flex flex-col items-center justify-center text-center">
                    {item.image_url_extra1 ? (
                      <img src={item.image_url_extra1} alt="Extra 1" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted">
                        <ImagePlus size={14} className="opacity-60" />
                        <span className="text-[8px] font-medium uppercase tracking-wider mt-0.5">Angle 1</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                      {isUploadingImage[`${item.id}_extra1`] ? (
                        <Loader2 size={12} className="animate-spin text-white" />
                      ) : (
                        <>
                          <ImagePlus size={10} className="text-white mb-0.5" />
                          <span className="text-[8px] text-white font-bold uppercase">Angle 1</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/jpeg, image/png, image/webp" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(item.id, e.target.files[0], "extra1");
                          }
                        }}
                      />
                    </label>
                    {item.image_url_extra1 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleImageDelete(item.id, "extra1"); }}
                        className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10 hover:bg-rose-600"
                        title="Remove image"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>

                  {/* Extra Photo 2 Slot */}
                  <div className="relative group/thumb border border-subtle rounded-lg overflow-hidden h-14 bg-subtle/25 flex flex-col items-center justify-center text-center">
                    {item.image_url_extra2 ? (
                      <img src={item.image_url_extra2} alt="Extra 2" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted">
                        <ImagePlus size={14} className="opacity-60" />
                        <span className="text-[8px] font-medium uppercase tracking-wider mt-0.5">Angle 2</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity">
                      {isUploadingImage[`${item.id}_extra2`] ? (
                        <Loader2 size={12} className="animate-spin text-white" />
                      ) : (
                        <>
                          <ImagePlus size={10} className="text-white mb-0.5" />
                          <span className="text-[8px] text-white font-bold uppercase">Angle 2</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/jpeg, image/png, image/webp" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageUpload(item.id, e.target.files[0], "extra2");
                          }
                        }}
                      />
                    </label>
                    {item.image_url_extra2 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleImageDelete(item.id, "extra2"); }}
                        className="absolute top-1 right-1 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10 hover:bg-rose-600"
                        title="Remove image"
                      >
                        <X size={10} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <h4 className="text-[14px] font-bold pr-4 text-main flex items-center gap-1.5 flex-wrap">
                      {item.name}
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedItemForARPreview(item); }}
                        className="px-2 py-0.5 rounded-full bg-gradient-to-r from-[#e85d04] to-orange-600 text-white font-extrabold text-[10px] uppercase tracking-wider shadow-xs hover:brightness-110 transition-all transform active:scale-95 flex items-center gap-1"
                        title="Open 3D AR Interactive Preview"
                      >
                        🧊 3D AR View
                      </button>
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-muted">₹{item.price}</span>
                    <button 
                      onClick={() => handleOpenRecipeEditor(item)}
                      className="text-muted hover:text-indigo-500 transition-colors p-1 rounded hover:bg-indigo-50"
                      title="Edit Recipe / BOM"
                    >
                      <FileText size={14} />
                    </button>
                    {item.image_url && (
                      <button 
                        onClick={() => handleOpenConfirmModal(item)}
                        disabled={isGenerating3D[item.id] || (item.model_3d_task_id && !item.model_3d_url)}
                        className={`transition-colors p-1 rounded ${
                          item.model_3d_url 
                            ? item.model_3d_active 
                              ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' 
                              : 'text-amber-500 bg-amber-50 hover:bg-amber-100'
                            : isGenerating3D[item.id] || item.model_3d_task_id 
                              ? 'text-indigo-500 animate-pulse bg-indigo-50' 
                              : 'text-muted hover:text-indigo-500 hover:bg-indigo-50'
                        }`}
                        title={item.model_3d_url ? item.model_3d_active ? "3D Model Active (Click to manage)" : "3D Model Inactive (Click to manage)" : "Generate 3D AR Model"}
                      >
                        <Box size={14} />
                      </button>
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

      {/* 3D GENERATION CONFIRMATION MODAL */}
      {showConfirmModal && selectedItemFor3D && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => !isSubmitting && setShowConfirmModal(false)}></div>
          <div className="relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col">
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse animate-duration-1000 animate-ease-in-out" />
                <h3 className="text-[18px] font-bold text-slate-900">
                  {selectedItemFor3D.model_3d_url ? "Manage 3D AR Model" : "Generate 3D AR Model"}
                </h3>
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

              {selectedItemFor3D.model_3d_url ? (
                /* MANAGEMENT PANEL */
                <div className="space-y-4 pt-2">
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-[12px] font-bold">3D AR Model Ready</p>
                      <p className="text-[11px] opacity-90 mt-0.5">Scale size: {selectedItemFor3D.model_3d_height || 12.0} cm</p>
                    </div>
                  </div>

                  {/* Active Toggle Option */}
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <h5 className="text-[13px] font-bold text-slate-800">Display Model to Customers</h5>
                      <p className="text-[11px] text-slate-500 leading-normal mt-0.5">Show or hide the "View in AR" button on customer menu card.</p>
                    </div>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleToggleActive}
                      className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                        selectedItemFor3D.model_3d_active ? 'bg-indigo-600' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        selectedItemFor3D.model_3d_active ? 'left-6' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Delete Button Option */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleDeleteModel}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors text-[13px] font-semibold"
                    >
                      <Trash2 size={16} /> Delete 3D Model
                    </button>
                  </div>
                </div>
              ) : (
                /* GENERATION CONFIGURATION FORM */
                <>
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
                        { label: 'Beverage', size: 8.0 },
                        { label: 'Standard', size: 12.0 },
                        { label: 'Large/Pizza', size: 18.0 }
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

                  {/* AI Model Parameter */}
                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">AI Model</label>
                      <select 
                        value={aiModel} 
                        onChange={(e) => setAiModel(e.target.value)} 
                        className="w-full form-input py-1.5 px-2.5 text-[12px]"
                      >
                        <option value="meshy-6">Meshy 6 (Latest)</option>
                        <option value="meshy-5">Meshy 5</option>
                        <option value="latest">Auto Select</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Resolution</label>
                      <select 
                        value={textureResolution} 
                        onChange={(e) => setTextureResolution(e.target.value)} 
                        className="w-full form-input py-1.5 px-2.5 text-[12px]"
                      >
                        <option value="2k">2K Quality</option>
                        <option value="4k">4K Ultra Quality</option>
                      </select>
                    </div>
                  </div>

                  {/* Texturing Toggles */}
                  <div className="grid grid-cols-2 gap-4 pt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={removeLighting} 
                        onChange={(e) => setRemoveLighting(e.target.checked)} 
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] font-medium text-slate-700">Remove Lighting</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={enablePbr} 
                        onChange={(e) => setEnablePbr(e.target.checked)} 
                        className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[11px] font-medium text-slate-700">Generate PBR Maps</span>
                    </label>
                  </div>

                  {/* Credit Status Box */}
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
                          <p className="text-[11px] opacity-85 mt-0.5">You have 0 credits. Please purchase more credits to generate 3D models.</p>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Buttons Row */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="py-2.5 px-4 rounded-xl text-[13px] font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex-1"
              >
                {selectedItemFor3D.model_3d_url ? "Close" : "Cancel"}
              </button>
              
              {!selectedItemFor3D.model_3d_url && (
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
              )}
            </div>

          </div>
        </div>
      )}

      {/* DISH AR VIEWER MODAL */}
      <DishARViewerModal
        item={selectedItemForARPreview}
        onClose={() => setSelectedItemForARPreview(null)}
      />
    </div>
  );
}

