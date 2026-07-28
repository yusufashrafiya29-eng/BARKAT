import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface CustomizationModalProps {
  item: any;
  onClose: () => void;
  onAddToCart: (item: any, selectedModifiers: any[], quantity: number, notes: string) => void;
}

export default function CustomizationModal({ item, onClose, onAddToCart }: CustomizationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  
  // Track selected modifiers. Key: group_id, Value: array of modifier objects
  const [selectedMods, setSelectedMods] = useState<Record<string, any[]>>({});

  const handleToggleModifier = (group: any, mod: any) => {
    const currentSelected = selectedMods[group.id] || [];
    const isSelected = currentSelected.some(m => m.id === mod.id);

    if (isSelected) {
      // Deselect
      setSelectedMods({
        ...selectedMods,
        [group.id]: currentSelected.filter(m => m.id !== mod.id)
      });
    } else {
      // Select
      // If max_selections is 1, act like a radio button
      if (group.max_selections === 1) {
        setSelectedMods({
          ...selectedMods,
          [group.id]: [mod]
        });
      } else {
        if (currentSelected.length >= group.max_selections) {
          toast.error(`You can only select up to ${group.max_selections} options for ${group.name}`);
          return;
        }
        setSelectedMods({
          ...selectedMods,
          [group.id]: [...currentSelected, mod]
        });
      }
    }
  };

  const calculateTotal = () => {
    let modTotal = 0;
    let basePrice = item.price;
    Object.keys(selectedMods).forEach(groupId => {
      const group = item.modifier_groups?.find((g: any) => g.id === groupId);
      const mods = selectedMods[groupId];
      mods.forEach(m => {
        if (group?.price_replaces_base) {
          basePrice = m.price;
        } else {
          modTotal += m.price;
        }
      });
    });
    return (basePrice + modTotal) * quantity;
  };

  const handleAdd = () => {
    // Validate required groups and min selections
    for (const group of item.modifier_groups) {
      const selected = selectedMods[group.id] || [];
      if (group.is_required && selected.length === 0) {
        toast.error(`Please select an option for ${group.name}`);
        return;
      }
      if (selected.length < group.min_selections) {
        toast.error(`Please select at least ${group.min_selections} options for ${group.name}`);
        return;
      }
    }

    const flatModifiers = Object.values(selectedMods).flat();
    onAddToCart(item, flatModifiers, quantity, notes);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh] rounded-t-2xl sm:rounded-t-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-4">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{item.name}</h2>
            <p className="text-sm text-gray-500">Customize your item</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-6">
          {item.modifier_groups?.map((group: any) => (
            <div key={group.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 dark:text-white text-[15px]">{group.name}</h3>
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400">
                  {group.is_required ? 'Required' : 'Optional'}
                  {group.max_selections > 1 && ` (Max ${group.max_selections})`}
                </span>
              </div>
              
              <div className="space-y-2">
                {group.modifiers?.map((mod: any) => {
                  const isSelected = (selectedMods[group.id] || []).some(m => m.id === mod.id);
                  return (
                    <label 
                      key={mod.id}
                      onClick={(e) => {
                        e.preventDefault();
                        handleToggleModifier(group, mod);
                      }}
                      className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center ${group.max_selections === 1 ? 'w-5 h-5 rounded-full border' : 'w-5 h-5 rounded border'} ${
                          isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300'
                        }`}>
                          {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                        </div>
                        <span className="text-[14px] font-medium text-gray-700 dark:text-gray-300">{mod.name}</span>
                      </div>
                      {mod.price > 0 && (
                        <span className="text-[14px] text-gray-500">+₹{mod.price}</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-[15px]">Special Instructions</h3>
            <textarea
              placeholder="e.g. less spicy, extra ketchup..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              rows={2}
            />
          </div>
          
          <div className="flex items-center justify-center gap-6 pt-2">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >-</button>
            <span className="text-xl font-bold w-4 text-center">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >+</button>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={handleAdd}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-between px-6 transition-colors shadow-lg shadow-indigo-500/20"
          >
            <span>Add Item</span>
            <span>₹{calculateTotal().toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
