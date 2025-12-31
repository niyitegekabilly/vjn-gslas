
import React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface SyncStatusProps {
  isOnline: boolean;
  isSyncing?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ isOnline, isSyncing }) => {
  if (isSyncing) {
    return (
      <div className="flex items-center space-x-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium border border-yellow-200 shadow-sm animate-pulse">
        <RefreshCw size={12} className="animate-spin" />
        <span className="hidden sm:inline">Syncing...</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium border border-red-200 shadow-sm">
        <WifiOff size={12} />
        <span className="hidden sm:inline">Offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium border border-green-200 shadow-sm">
      <Wifi size={12} />
      <span className="hidden sm:inline">Online</span>
    </div>
  );
};
