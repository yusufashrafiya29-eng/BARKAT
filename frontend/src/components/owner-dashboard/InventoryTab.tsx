import { useState } from 'react';
import { useOwnerStore } from '../../store/ownerStore';
import { ownerApi } from '../../api/owner';
import { Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function InventoryTab() {
  const { inventory, fetchData } = useOwnerStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    quantity: 0,
    unit: 'kg',
    minimum_threshold: 0,
    cost_price: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        minimum_threshold: item.minimum_threshold,
        cost_price: item.cost_price
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        quantity: 0,
        unit: 'kg',
        minimum_threshold: 0,
        cost_price: 0
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await ownerApi.updateInventoryItem(editingItem.id, formData);
        toast.success('Item updated');
      } else {
        await ownerApi.addInventoryItem(formData);
        toast.success('Item added');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await ownerApi.deleteInventoryItem(id);
      toast.success('Item deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Delete failed');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-end mb-2">
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-[13px] font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="surface overflow-hidden border border-slate-200/60 shadow-sm rounded-2xl bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/80">
              <th className="px-5 py-3.5 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Asset Name</th>
              <th className="px-5 py-3.5 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Current Stock</th>
              <th className="px-5 py-3.5 text-[12px] font-bold text-slate-500 uppercase tracking-wider">Threshold Min</th>
              <th className="px-5 py-3.5 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-right">Status</th>
              <th className="px-5 py-3.5 text-[12px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map((item: any) => (
              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-5 py-3 text-[14px] font-semibold text-slate-800">{item.name}</td>
                <td className="px-5 py-3 text-[13px] text-slate-600">
                  {item.quantity} <span className="text-[11px] uppercase ml-0.5 font-bold tracking-wide">{item.unit}</span>
                </td>
                <td className="px-5 py-3 text-[13px] text-slate-600">
                  {item.minimum_threshold} {item.unit}
                </td>
                <td className="px-5 py-3 text-right">
                  {item.quantity <= item.minimum_threshold ? (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-rose-50 text-rose-600 border border-rose-100">Low Stock</span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">Optimal</span>
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {inventory.length === 0 && (
              <tr><td colSpan={5} className="p-10 text-center text-[13px] font-medium text-slate-400">No inventory tracked yet. Add items to get started!</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,.6)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-[16px] text-slate-800">{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-white shadow-sm p-1.5 rounded-full border border-slate-200 transition-colors"><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Item Name</label>
                <input type="text" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Basmati Rice, Chicken" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Initial Quantity</label>
                  <input type="number" step="0.01" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Unit</label>
                  <input type="text" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="kg, L, pcs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Min Threshold</label>
                  <input type="number" step="0.01" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" value={formData.minimum_threshold} onChange={e => setFormData({...formData, minimum_threshold: parseFloat(e.target.value) || 0})} />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-tight">Alerts when stock drops below this.</p>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Cost Price</label>
                  <input type="number" step="0.01" required className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[14px] font-medium text-slate-800 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all outline-none" value={formData.cost_price} onChange={e => setFormData({...formData, cost_price: parseFloat(e.target.value) || 0})} />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium leading-tight">Cost per {formData.unit || 'unit'}.</p>
                </div>
              </div>
              
              <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl text-[14px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50">
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (editingItem ? 'Save Changes' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
