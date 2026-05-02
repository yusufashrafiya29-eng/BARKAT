import { useOwnerStore } from '../../store/ownerStore';

export default function OrdersTab() {
  const { historicalOrders } = useOwnerStore();

  return (
    <div className="surface overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-subtle bg-subtle/50">
            <th className="px-5 py-3 text-[12px] font-bold text-muted uppercase tracking-wider">Date & Time</th>
            <th className="px-5 py-3 text-[12px] font-bold text-muted uppercase tracking-wider">Customer</th>
            <th className="px-5 py-3 text-[12px] font-bold text-muted uppercase tracking-wider">Order Details</th>
            <th className="px-5 py-3 text-[12px] font-bold text-muted uppercase tracking-wider text-right">Bill Expected</th>
            <th className="px-5 py-3 text-[12px] font-bold text-muted uppercase tracking-wider text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {historicalOrders.map((order: any) => (
            <tr key={order.id} className="hover:bg-subtle/30 transition-colors">
              <td className="px-5 py-4 align-top">
                <div className="text-[13px] font-medium text-main">{order.date}</div>
                <div className="text-[11px] text-muted">{order.day} at {order.time}</div>
              </td>
              <td className="px-5 py-4 align-top">
                <div className="text-[13px] font-bold text-slate-700 capitalize">{order.customer_name || 'No Name'}</div>
                <div className="text-[12px] font-medium text-slate-500 mt-0.5">{order.customer_phone}</div>
                {order.customer_phone === "Walk-in" && <span className="text-[10px] uppercase font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 mt-1.5 inline-block">POS SYSTEM</span>}
              </td>
              <td className="px-5 py-4 align-top max-w-[280px]">
                <div className="flex flex-wrap gap-1.5">
                  {order.items.map((item: any, idx: number) => (
                    <span key={idx} className="inline-flex items-center text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                      <span className="font-bold text-indigo-500 mr-1">{item.quantity}x</span> {item.name}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-5 py-4 align-top text-right">
                <div className="text-[15px] font-extrabold text-indigo-600">₹{order.total_amount}</div>
              </td>
              <td className="px-5 py-4 align-top text-right">
                {order.status === 'SERVED' && <span className="text-[11px] font-bold px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Completed</span>}
                {order.status === 'CANCELLED' && <span className="text-[11px] font-bold px-2 py-1 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">Cancelled</span>}
                {['PENDING', 'ACCEPTED', 'PREPARING', 'READY'].includes(order.status) && <span className="text-[11px] font-bold px-2 py-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">Currently Active</span>}
              </td>
            </tr>
          ))}
          {historicalOrders.length === 0 && (
            <tr><td colSpan={5} className="p-8 text-center text-[13px] text-muted">No orders found in history.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
