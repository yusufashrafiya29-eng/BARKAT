import { useState, useEffect } from 'react';
import { ownerApi } from '../../api/owner';
import toast from 'react-hot-toast';
import { Plus, MessageSquare, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';

export default function SupportTab() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ subject: '', description: '' });

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await ownerApi.getTickets();
      setTickets(data);
    } catch (e: any) {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await ownerApi.createTicket(formData);
      toast.success('Ticket created successfully!');
      setShowCreateModal(false);
      setFormData({ subject: '', description: '' });
      fetchTickets();
    } catch (e: any) {
      toast.error('Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Support Center</h2>
          <p className="text-sm text-slate-500">Need help? Open a ticket and our support team will get back to you.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors flex items-center gap-2"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <p className="text-slate-400 font-medium">Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <MessageSquare size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No Support Tickets</h3>
          <p className="text-slate-500 max-w-sm mb-6">You haven't opened any support tickets yet. If you have an issue or a question, feel free to reach out!</p>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
          >
            Contact Support
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {ticket.status === 'OPEN' && <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200"><AlertCircle size={12}/> OPEN</span>}
                  {ticket.status === 'IN_PROGRESS' && <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200"><Clock size={12}/> IN PROGRESS</span>}
                  {ticket.status === 'RESOLVED' && <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200"><CheckCircle2 size={12}/> RESOLVED</span>}
                  <span className="text-xs font-mono text-slate-400">#{ticket.id.split('-')[0]}</span>
                </div>
                <span className="text-xs text-slate-400">{new Date(ticket.created_at).toLocaleDateString()}</span>
              </div>
              <h4 className="font-bold text-slate-800 text-[15px] mb-2">{ticket.subject}</h4>
              <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">{ticket.description}</p>
              
              {ticket.resolution_notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-500"/> Support Response
                  </p>
                  <p className="text-sm text-slate-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50">
                    {ticket.resolution_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !submitting && setShowCreateModal(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare className="text-indigo-500" size={18}/> Open Support Ticket</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                <input 
                  required
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
                  placeholder="E.g., Printer connection issue"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description</label>
                <textarea 
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all min-h-[120px]"
                  placeholder="Please describe the issue in detail..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)} 
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
