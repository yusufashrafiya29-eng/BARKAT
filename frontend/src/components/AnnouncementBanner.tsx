import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { authApi } from '../api/auth';
import { useLocation } from 'react-router-dom';

interface Announcement {
  id: string;
  title: string;
  message: string;
}

const AnnouncementBanner: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const location = useLocation();

  useEffect(() => {
    // Only fetch if on a dashboard/internal route (not public pages like login or public menu)
    if (location.pathname.startsWith('/dashboard') || 
        location.pathname.startsWith('/owner') || 
        location.pathname.startsWith('/waiter') || 
        location.pathname.startsWith('/kitchen')) {
      
      const fetchAnnouncements = async () => {
        const data = await authApi.getActiveAnnouncements();
        setAnnouncements(data);
      };
      
      fetchAnnouncements();
      // Optional: poll every 5 minutes
      const interval = setInterval(fetchAnnouncements, 300000);
      return () => clearInterval(interval);
    }
  }, [location.pathname]);

  if (announcements.length === 0) return null;

  return (
    <div className="flex flex-col z-[90] relative shadow-md">
      {announcements.map((ann) => (
        <div key={ann.id} className="bg-blue-600 text-white px-4 py-2.5 flex items-center justify-center gap-4 text-center border-b border-blue-700/50">
          <Megaphone size={18} className="shrink-0 text-blue-200" />
          <div>
            <span className="font-extrabold uppercase tracking-widest text-[11px] text-blue-200 mr-2 border border-blue-400/30 px-1.5 py-0.5 rounded">
              {ann.title}
            </span>
            <span className="text-sm font-semibold tracking-wide">
              {ann.message}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnnouncementBanner;
