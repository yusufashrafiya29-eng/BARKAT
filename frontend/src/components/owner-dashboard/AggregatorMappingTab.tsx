import React, { useState, useEffect } from 'react';
import { getItemMappings, createItemMapping, deleteItemMapping } from '../../api/aggregator';
import type { AggregatorItemMapping } from '../../api/aggregator';
import { customerApi } from '../../api/customer';
import { Link, ShoppingBag, Trash2, Plus, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface MenuItem {
  id: string;
  name: string;
  category: { id: string; name: string };
}

export const AggregatorMappingTab = () => {
  const [mappings, setMappings] = useState<AggregatorItemMapping[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [newPlatform, setNewPlatform] = useState('Swiggy');
  const [newPlatformItemId, setNewPlatformItemId] = useState('');
  const [newPlatformItemName, setNewPlatformItemName] = useState('');
  const [newMenuItemId, setNewMenuItemId] = useState('');

  const restaurantId = localStorage.getItem('restaurantId') || '';

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [maps, menuRes] = await Promise.all([
        getItemMappings(),
        customerApi.getMenu(restaurantId)
      ]);
      setMappings(maps);
      
      // Extract menu items from categories
      const items: MenuItem[] = [];
      menuRes.forEach((category: any) => {
        category.items.forEach((item: any) => {
          items.push({
            id: item.id,
            name: item.name,
            category: { id: category.id, name: category.name }
          });
        });
      });
      setMenuItems(items);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load mappings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);

  const handleSaveMapping = async () => {
    if (!newPlatformItemId || !newMenuItemId) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      await createItemMapping({
        platform: newPlatform,
        platform_item_id: newPlatformItemId,
        platform_item_name: newPlatformItemName,
        menu_item_id: newMenuItemId
      });
      toast.success('Mapping saved!');
      setIsAdding(false);
      setNewPlatformItemId('');
      setNewPlatformItemName('');
      setNewMenuItemId('');
      fetchData();
    } catch (error) {
      toast.error('Failed to save mapping');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItemMapping(id);
      toast.success('Mapping deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete mapping');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading mappings...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary-500" />
            Aggregator Item Mapping
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Link your Swiggy/Zomato item IDs to your internal MyRestro menu items.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Mapping
        </button>
      </div>

      <div className="p-6">
        {isAdding && (
          <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
            <h3 className="text-sm font-semibold mb-4 text-gray-700 dark:text-gray-300">Create New Mapping</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Platform</label>
                <select
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="Swiggy">Swiggy</option>
                  <option value="Zomato">Zomato</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Platform Item ID *</label>
                <input
                  type="text"
                  placeholder="e.g. 12345678"
                  value={newPlatformItemId}
                  onChange={(e) => setNewPlatformItemId(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Platform Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Butter Chicken"
                  value={newPlatformItemName}
                  onChange={(e) => setNewPlatformItemName(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">MyRestro Menu Item *</label>
                <select
                  value={newMenuItemId}
                  onChange={(e) => setNewMenuItemId(e.target.value)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                >
                  <option value="">Select an item...</option>
                  {menuItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category.name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-3">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveMapping}
                className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 dark:hover:bg-white transition-colors"
              >
                <Save className="w-4 h-4" /> Save
              </button>
            </div>
          </div>
        )}

        {mappings.length === 0 && !isAdding ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No mappings found</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              You haven't mapped any aggregator items to your menu yet. Add a mapping to accept orders from Swiggy/Zomato.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Platform</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Aggregator Item (ID / Name)</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Mapped Internal Item</th>
                  <th className="pb-3 text-sm font-semibold text-gray-600 dark:text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {mappings.map(map => {
                  const internalItem = menuItems.find(m => m.id === map.menu_item_id);
                  return (
                    <tr key={map.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          map.platform.toLowerCase() === 'swiggy' 
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400' 
                            : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                        }`}>
                          {map.platform}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {map.platform_item_name || 'Unnamed Item'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          ID: {map.platform_item_id}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Link className="w-3 h-3 text-gray-400" />
                          {internalItem ? (
                            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                              {internalItem.name} <span className="text-xs text-gray-500">({internalItem.category.name})</span>
                            </span>
                          ) : (
                            <span className="text-sm text-red-500">Item deleted or missing</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <button 
                          onClick={() => handleDelete(map.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
