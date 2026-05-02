import { useOwnerStore } from '../../store/ownerStore';

export default function InventoryTab() {
  const { inventory } = useOwnerStore();

  return (
    <div className="surface overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-subtle bg-subtle/50">
            <th className="px-5 py-3 text-[12px] font-medium text-muted">Asset Name</th>
            <th className="px-5 py-3 text-[12px] font-medium text-muted">Current Stock</th>
            <th className="px-5 py-3 text-[12px] font-medium text-muted">Threshold Min</th>
            <th className="px-5 py-3 text-[12px] font-medium text-muted text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {inventory.map((item: any) => (
            <tr key={item.id} className="hover:bg-subtle/30 transition-colors">
              <td className="px-5 py-3 text-[14px] font-medium">{item.name}</td>
              <td className="px-5 py-3 text-[13px] text-muted">
                {item.quantity} <span className="text-[11px] uppercase ml-1">{item.unit}</span>
              </td>
              <td className="px-5 py-3 text-[13px] text-muted">
                {item.minimum_threshold} {item.unit}
              </td>
              <td className="px-5 py-3 text-right">
                {item.quantity <= item.minimum_threshold ? (
                  <span className="text-[11px] font-medium px-2 py-1 rounded bg-rose-500/10 text-rose-500">Low Stock</span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-1 rounded bg-emerald-500/10 text-emerald-500">Optimal</span>
                )}
              </td>
            </tr>
          ))}
          {inventory.length === 0 && (
            <tr><td colSpan={4} className="p-8 text-center text-[13px] text-muted">No inventory tracked.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
