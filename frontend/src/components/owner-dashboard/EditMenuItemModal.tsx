import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { ownerApi } from '../../api/owner';
import toast from 'react-hot-toast';

interface EditMenuItemModalProps {
  item: any;
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditMenuItemModal({ item, categories, onClose, onSuccess }: EditMenuItemModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item.name || '',
    description: item.description || '',
    price: item.price || 0,
    tax_rate: item.tax_rate ?? 5.0,
    category_id: item.category_id || '',
    is_veg: item.is_veg || false,
    model_3d_height: item.model_3d_height ?? 12.0,
    modifier_groups: item.modifier_groups ? JSON.parse(JSON.stringify(item.modifier_groups)) : []
  });

  const handleAddGroup = () => {
    setFormData({
      ...formData,
      modifier_groups: [
        ...formData.modifier_groups,
        { name: '', is_required: false, min_selections: 0, max_selections: 1, price_replaces_base: false, modifiers: [] }
      ]
    });
  };

  const handleRemoveGroup = (index: number) => {
    const newGroups = [...formData.modifier_groups];
    newGroups.splice(index, 1);
    setFormData({ ...formData, modifier_groups: newGroups });
  };

  const handleUpdateGroup = (index: number, key: string, value: any) => {
    const newGroups = [...formData.modifier_groups];
    newGroups[index][key] = value;
    setFormData({ ...formData, modifier_groups: newGroups });
  };

  const handleAddModifier = (groupIndex: number) => {
    const newGroups = [...formData.modifier_groups];
    newGroups[groupIndex].modifiers.push({ name: '', price: 0, is_available: true });
    setFormData({ ...formData, modifier_groups: newGroups });
  };

  const handleRemoveModifier = (groupIndex: number, modIndex: number) => {
    const newGroups = [...formData.modifier_groups];
    newGroups[groupIndex].modifiers.splice(modIndex, 1);
    setFormData({ ...formData, modifier_groups: newGroups });
  };

  const handleUpdateModifier = (groupIndex: number, modIndex: number, key: string, value: any) => {
    const newGroups = [...formData.modifier_groups];
    newGroups[groupIndex].modifiers[modIndex][key] = value;
    setFormData({ ...formData, modifier_groups: newGroups });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ownerApi.updateMenuItem(item.id, formData);
      toast.success("Menu item updated successfully!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to update menu item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="surface w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-subtle">
          <h2 className="text-xl font-bold">Edit Menu Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-subtle rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Item Name</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select
                required
                value={formData.category_id}
                onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                className="form-input"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Base Price (₹)</label>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="form-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Tax Rate (%)</label>
              <select
                required
                value={formData.tax_rate}
                onChange={e => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                className="form-input"
              >
                <option value={5.0}>5% GST (Standard Food)</option>
                <option value={0.0}>0% GST (Exempt)</option>
                <option value={12.0}>12% GST</option>
                <option value={18.0}>18% GST (Liquor/Special)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="form-input"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Default 3D Model Height (cm)</label>
              <input
                required
                type="number"
                min="1"
                max="100"
                step="0.5"
                value={formData.model_3d_height}
                onChange={e => setFormData({ ...formData, model_3d_height: parseFloat(e.target.value) || 12.0 })}
                className="form-input"
              />
            </div>
          </div>


          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_veg}
              onChange={e => setFormData({ ...formData, is_veg: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm">Vegetarian</span>
          </label>

          <hr className="border-subtle" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Modifiers & Add-ons</h3>
              <button
                type="button"
                onClick={handleAddGroup}
                className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={16} /> Add Group
              </button>
            </div>

            <div className="space-y-6">
              {formData.modifier_groups.map((group: any, gIndex: number) => (
                <div key={gIndex} className="p-4 border border-subtle rounded-xl bg-subtle/20 space-y-4">
                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <input
                        placeholder="Group Name (e.g., Size, Crust)"
                        required
                        type="text"
                        value={group.name}
                        onChange={e => handleUpdateGroup(gIndex, 'name', e.target.value)}
                        className="form-input font-medium"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={group.is_required}
                        onChange={e => handleUpdateGroup(gIndex, 'is_required', e.target.checked)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm">Required</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={group.price_replaces_base || false}
                        onChange={e => handleUpdateGroup(gIndex, 'price_replaces_base', e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-[12px] leading-tight text-gray-600 dark:text-gray-400">Price replaces base<br/>(e.g., for Sizes)</span>
                    </label>
                    <button type="button" onClick={() => handleRemoveGroup(gIndex)} className="text-rose-500 hover:bg-rose-50 p-2 rounded mt-0.5">
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Min Selections</label>
                      <input
                        type="number"
                        min="0"
                        value={group.min_selections}
                        onChange={e => handleUpdateGroup(gIndex, 'min_selections', parseInt(e.target.value) || 0)}
                        className="form-input py-1.5 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">Max Selections</label>
                      <input
                        type="number"
                        min="1"
                        value={group.max_selections}
                        onChange={e => handleUpdateGroup(gIndex, 'max_selections', parseInt(e.target.value) || 1)}
                        className="form-input py-1.5 text-sm"
                      />
                    </div>
                  </div>

                  <div className="pl-4 border-l-2 border-indigo-100 space-y-3">
                    {group.modifiers.map((mod: any, mIndex: number) => (
                      <div key={mIndex} className="flex gap-3 items-center">
                        <input
                          placeholder="Option Name (e.g., Small, Cheese Burst)"
                          required
                          type="text"
                          value={mod.name}
                          onChange={e => handleUpdateModifier(gIndex, mIndex, 'name', e.target.value)}
                          className="form-input py-1.5 text-sm flex-1"
                        />
                        <div className="relative w-28">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={mod.price}
                            onChange={e => handleUpdateModifier(gIndex, mIndex, 'price', parseFloat(e.target.value) || 0)}
                            className="form-input py-1.5 pl-7 text-sm"
                          />
                        </div>
                        <button type="button" onClick={() => handleRemoveModifier(gIndex, mIndex)} className="text-muted hover:text-rose-500">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleAddModifier(gIndex)}
                      className="text-xs font-medium text-indigo-600 hover:underline"
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              ))}
              
              {formData.modifier_groups.length === 0 && (
                <div className="text-center py-6 border border-dashed border-subtle rounded-xl text-muted text-sm">
                  No modifiers added. Click "Add Group" to add sizes, crusts, or extra toppings.
                </div>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-subtle flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
