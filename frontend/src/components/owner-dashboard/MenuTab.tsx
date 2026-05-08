import { useState } from 'react';
import { ImagePlus, Loader2, FileText, Trash2, Box } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';
import { useOwnerStore } from '../../store/ownerStore';

export default function MenuTab({ handleOpenRecipeEditor }: { handleOpenRecipeEditor: (item: any) => void }) {
  const { menuCategories, fetchData } = useOwnerStore();
  const [isUploadingImage, setIsUploadingImage] = useState<Record<string, boolean>>({});
  const [isGenerating3D, setIsGenerating3D] = useState<Record<string, boolean>>({});

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
                        onClick={() => handleGenerate3D(item)}
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
  );
}
