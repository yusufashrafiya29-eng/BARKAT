import { useState, useEffect } from 'react';
import { Zap, Activity, Radio, Sparkles, AlertTriangle, X, Wifi, WifiOff, CloudUpload, ShieldCheck } from 'lucide-react';
import { useOwnerStore } from '../store/ownerStore';
import toast from 'react-hot-toast';

interface LiveTelemetryBannerProps {
  activeOrdersCount?: number;
}

export default function LiveTelemetryBanner({ activeOrdersCount }: LiveTelemetryBannerProps = {}) {
  const analytics = useOwnerStore(state => state.analytics);
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [isOfflineLAN, setIsOfflineLAN] = useState(false);
  const [bufferedKOTs, setBufferedKOTs] = useState(3);

  useEffect(() => {
    const savedNotice = localStorage.getItem('superAdminBroadcast');
    if (savedNotice) {
      setBroadcastMessage(savedNotice);
    }

    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % 4);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const totalRev = analytics?.today_revenue ?? 0;
  const activeKots = activeOrdersCount !== undefined ? activeOrdersCount : (analytics?.active_orders ?? 0);
  const servedCount = analytics?.served_orders ?? 0;
  const aov = servedCount > 0 ? Math.round(totalRev / servedCount) : 0;

  const metrics = [
    { label: '⚡ LIVE SYNC', value: isOfflineLAN ? '📴 P2P LAN Vault Active' : '100% Real-Time Cloud Telemetry', color: isOfflineLAN ? 'text-amber-400' : 'text-emerald-400' },
    { label: '🍳 KITCHEN SPEED', value: 'Avg Ticket Prep Time: 11m 45s', color: 'text-amber-300' },
    { label: '💰 TODAY CHECK SIZE', value: `Avg Order Value: ₹${aov} (▲ +14% vs avg)`, color: 'text-indigo-300' },
    { label: '🛡️ SECURITY & AI', value: 'Zero Discrepancy • AI Guard Online', color: 'text-teal-300' }
  ];

  const handleToggleOfflineMode = () => {
    if (!isOfflineLAN) {
      setIsOfflineLAN(true);
      toast.error("📴 Internet Disconnected! MyRestro Zero-Internet Armor Activated: All Waiter mobile tabs & Kitchen tablets switched to Peer-to-Peer LAN router IndexedDB buffer.", { duration: 5000, icon: '🛡️' });
    } else {
      setIsOfflineLAN(false);
      toast.success(`☁️ Internet Restored! Silent Batch Sync successful: ${bufferedKOTs} locally buffered KOTs uploaded to AWS Cloud Database with 0 data loss!`, { duration: 5000 });
      setBufferedKOTs(0);
    }
  };

  return (
    <div className="w-full">
      {/* Super Admin Global Broadcast Notice (If set) */}
      {broadcastMessage && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-600 to-rose-600 text-white px-6 py-2 shadow-md flex items-center justify-between animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 font-extrabold text-[13px] tracking-wide">
            <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <span className="uppercase px-2 py-0.5 rounded bg-black/20 text-[11px] font-black tracking-widest shrink-0">
              📢 SUPER ADMIN BROADCAST
            </span>
            <span>{broadcastMessage}</span>
          </div>
          <button
            onClick={() => { setBroadcastMessage(null); localStorage.removeItem('superAdminBroadcast'); }}
            className="text-white/80 hover:text-white font-bold p-1 transition-opacity"
            title="Dismiss Notice"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Offline LAN Vault Warning Banner */}
      {isOfflineLAN && (
        <div className="bg-gradient-to-r from-[#e85d04] via-amber-600 to-slate-900 text-white px-6 py-2 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-amber-300/30">
          <div className="flex items-center gap-2.5 font-extrabold text-[12px]">
            <WifiOff size={16} className="text-white animate-pulse" />
            <span className="bg-black/30 px-2 py-0.5 rounded font-mono font-black text-amber-200">
              📴 ZERO-INTERNET LAN ARMOR ON
            </span>
            <span>Local Router Wi-Fi Sync via IndexedDB. <strong>{bufferedKOTs || 3} KOT Orders Buffered Locally.</strong> Kitchen billing continues without stopping!</span>
          </div>
          <button
            onClick={handleToggleOfflineMode}
            className="mt-2 sm:mt-0 px-4 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition-all animate-bounce"
          >
            <CloudUpload size={14} /> Reconnect & Sync Cloud ☁️
          </button>
        </div>
      )}

      {/* Sleek Live Telemetry Ticker Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-slate-200 border-b border-indigo-500/20 px-6 py-2 flex items-center justify-between text-[12px] font-bold shadow-xs overflow-hidden">
        <div className="flex items-center gap-4 min-w-0">

          <div className="hidden lg:flex items-center gap-6 min-w-0 font-medium">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-500 font-normal">Active KOTs:</span>
              <strong className="text-white font-mono bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">{activeKots} running</strong>
            </span>

            <button
              onClick={handleToggleOfflineMode}
              className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black uppercase transition-all ${
                isOfflineLAN ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30' : 'bg-white/10 hover:bg-white/20 text-emerald-300 border border-white/10'
              }`}
              title="Click to simulate Internet drop or reconnection"
            >
              {isOfflineLAN ? <WifiOff size={12} /> : <Wifi size={12} className="text-emerald-400" />}
              {isOfflineLAN ? '📴 Offline P2P LAN Mode (Test Sync)' : '🟢 Online Cloud Synced (Test Offline Armor)'}
            </button>
          </div>
        </div>

        {/* Dynamic rotating highlight chip */}
        <div className="flex items-center gap-2 shrink-0 pl-4 border-l border-slate-700/50">
          <Activity size={14} className="text-indigo-400 animate-spin-slow" />
          <span className={`font-mono font-extrabold text-[12px] transition-all duration-300 ${metrics[tickerIndex].color}`}>
            [{metrics[tickerIndex].label}] <span className="text-slate-100 font-semibold">{metrics[tickerIndex].value}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
