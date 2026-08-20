import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, RefreshCw, CheckCircle2 } from 'lucide-react';
import { notificationsApi, NotificationLog } from '../../modules/notifications/api/notificationsApi';

export function GlobalDispatchBanner() {
  const [ongoingCount, setOngoingCount] = useState<number>(0);
  const [justCompleted, setJustCompleted] = useState<boolean>(false);

  useEffect(() => {
    let prevOngoing = 0;
    const checkOngoing = async () => {
      try {
        const logs = await notificationsApi.getLogs(undefined, 30);
        const queued = logs.filter((l) => l.delivery_status === 'QUEUED');
        const currCount = queued.length;

        if (prevOngoing > 0 && currCount === 0) {
          setJustCompleted(true);
          setTimeout(() => setJustCompleted(false), 6000);
        }
        prevOngoing = currCount;
        setOngoingCount(currCount);
      } catch {
        // silent fail
      }
    };

    checkOngoing();
    const interval = setInterval(checkOngoing, 8000);
    return () => clearInterval(interval);
  }, []);

  if (justCompleted && ongoingCount === 0) {
    return (
      <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md z-50 animate-fade-in">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>All WhatsApp Dispatches Delivered Successfully! ✅</span>
        </div>
        <Link
          to="/notifications"
          className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition"
        >
          View Audit Log
        </Link>
      </div>
    );
  }

  if (ongoingCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md z-50">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-200"></span>
        </span>
        <MessageSquare className="w-4 h-4 text-amber-200" />
        <span>
          WhatsApp Dispatches Ongoing: <strong className="underline">{ongoingCount}</strong> message(s) sending in background...
        </span>
      </div>
      <Link
        to="/notifications"
        className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
      >
        <RefreshCw className="w-3 h-3 animate-spin" /> View Live Audit Log
      </Link>
    </div>
  );
}
