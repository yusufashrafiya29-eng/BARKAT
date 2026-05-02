import { ClipboardList, QrCode, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';
import { useOwnerStore } from '../../store/ownerStore';

export default function TablesTab({ setShowQRModal }: { setShowQRModal: (val: boolean) => void }) {
  const { tables, reservations, fetchData } = useOwnerStore();

  const handleDeleteTable = async (id: string, num: number) => {
    if (!window.confirm(`Delete Table ${num}?`)) return;
    try {
      await ownerApi.deleteTable(id);
      toast.success("Table deleted");
      fetchData();
    } catch { toast.error("Delete failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            const rId = localStorage.getItem('restaurantId');
            if (rId) {
              navigator.clipboard.writeText(`${window.location.origin}/book/${rId}`);
              toast.success("Booking link copied to clipboard!");
            } else {
              toast.error("Restaurant ID not found");
            }
          }}
          className="btn-secondary text-[12px] bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100"
        >
          <ClipboardList size={14} className="mr-2" /> Copy Booking Link
        </button>
        <button
          onClick={() => setShowQRModal(true)}
          className="btn-secondary text-[12px]"
        >
          <QrCode size={14} className="mr-2" /> Generate QR Assets
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map((table: any) => {
          const today = new Date().toISOString().split('T')[0];
          const tableReservations = reservations.filter((r: any) => 
            r.table_id === table.id && 
            (r.status === 'CONFIRMED' || r.payment_status === 'PAID') && 
            r.reservation_date.startsWith(today)
          );
          const isReserved = tableReservations.length > 0;
          
          return (
            <div key={table.id} className={`surface p-5 flex flex-col relative group transition-all ${isReserved ? 'ring-2 ring-amber-400 bg-amber-50' : ''}`}>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[18px] font-semibold">T{table.table_number}</span>
                <button 
                  onClick={() => handleDeleteTable(table.id, table.table_number)} 
                  className="text-muted hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="mt-auto">
                <p className="text-[12px] text-muted mb-1">{table.capacity} Seats</p>
                <span className="text-[10px] font-medium text-muted bg-subtle px-1.5 py-0.5 rounded border border-subtle">
                  {table.category}
                </span>
                {isReserved && (
                  <div className="mt-3 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded w-fit uppercase tracking-wider">
                    Reserved for {tableReservations[0].reservation_time.substring(0, 5)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
