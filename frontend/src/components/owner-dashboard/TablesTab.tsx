import React, { useState, useEffect, useRef } from 'react';
import { ClipboardList, QrCode, Trash2, LayoutDashboard, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { ownerApi } from '../../api/owner';
import { useOwnerStore } from '../../store/ownerStore';

export default function TablesTab({ setShowQRModal }: { setShowQRModal: (val: boolean) => void }) {
  const { tables, reservations, fetchData } = useOwnerStore();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [localTables, setLocalTables] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    // If not dragging, keep local tables in sync with remote tables
    if (!draggingId && !isEditMode) {
      setLocalTables(tables);
    }
  }, [tables, isEditMode]);

  const handleDeleteTable = async (id: string, num: number) => {
    if (!window.confirm(`Delete Table ${num}?`)) return;
    try {
      await ownerApi.deleteTable(id);
      toast.success("Table deleted");
      fetchData();
    } catch (error: any) { 
      toast.error(error.response?.data?.detail || "Delete failed"); 
    }
  };

  const handleSaveLayout = async () => {
    setIsSaving(true);
    try {
      const payload = localTables.map(t => ({
        id: t.id,
        position_x: t.position_x || 0,
        position_y: t.position_y || 0
      }));
      await ownerApi.updateTablePositions(payload);
      toast.success("Layout saved successfully!");
      setIsEditMode(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to save layout");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (!isEditMode) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate new percentages (centered)
    let newX = ((e.clientX - rect.left) / rect.width) * 100;
    let newY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Clamp between 0 and 100
    newX = Math.max(0, Math.min(100, newX));
    newY = Math.max(0, Math.min(100, newY));

    setLocalTables(prev => prev.map(t => 
      t.id === draggingId ? { ...t, position_x: newX, position_y: newY } : t
    ));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingId) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDraggingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           {isEditMode && (
             <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
               <LayoutDashboard size={18} className="text-indigo-600" />
               Design Floor Plan
             </h3>
           )}
        </div>
        <div className="flex items-center gap-3">
          {!isEditMode ? (
            <>
              <button
                onClick={() => setIsEditMode(true)}
                className="btn-primary text-[12px] bg-slate-900 hover:bg-slate-800 text-white"
              >
                <LayoutDashboard size={14} className="mr-2" /> Edit Layout
              </button>
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
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setLocalTables(tables);
                  setIsEditMode(false);
                }}
                className="btn-secondary text-[12px]"
                disabled={isSaving}
              >
                <X size={14} className="mr-2" /> Cancel
              </button>
              <button
                onClick={handleSaveLayout}
                className="btn-primary text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={isSaving}
              >
                <Save size={14} className="mr-2" /> {isSaving ? "Saving..." : "Save Layout"}
              </button>
            </>
          )}
        </div>
      </div>

      {isEditMode ? (
        <div 
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-slate-100/80 rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden shadow-inner"
          style={{ touchAction: 'none' }} // Prevent scrolling while dragging
        >
          <div className="absolute top-4 left-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none">
            Drag tables to arrange
          </div>
          {localTables.map(table => {
            // If position is 0,0, initialize in a grid-like fashion for editing
            const x = table.position_x || Math.random() * 80 + 10;
            const y = table.position_y || Math.random() * 80 + 10;
            
            return (
              <div
                key={table.id}
                onPointerDown={(e) => handlePointerDown(e, table.id)}
                className={`absolute w-14 h-14 rounded-xl flex items-center justify-center font-extrabold text-[16px] cursor-grab select-none shadow-md border-2 transition-transform ${draggingId === table.id ? 'scale-110 z-50 cursor-grabbing border-indigo-500 bg-indigo-50 text-indigo-700 shadow-xl' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'}`}
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                T{table.table_number}
              </div>
            );
          })}
        </div>
      ) : (
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
      )}
    </div>
  );
}
