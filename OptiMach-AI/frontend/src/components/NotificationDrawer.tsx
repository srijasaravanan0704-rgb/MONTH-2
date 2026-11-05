import React from 'react';
import { X, CheckCheck, AlertTriangle, AlertOctagon, Info, Wrench, Bell } from 'lucide-react';
import { Alert } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
  onMarkRead: (id: number) => void;
  onClearAll: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onMarkRead,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const unreadCount = alerts.filter((a) => a.read === 0).length;

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'Critical':
        return <AlertOctagon className="w-5 h-5 text-[#EF4444] flex-shrink-0" />;
      case 'Warning':
        return <AlertTriangle className="w-5 h-5 text-[#FFD700] flex-shrink-0" />;
      case 'Maintenance':
        return <Wrench className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#080808]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#121212] border-l border-[#66521A] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#66521A] flex items-center justify-between bg-[#080808]">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#241C0A] border border-[#66521A] text-[#FFD700]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#F5F5F5] text-base">Industrial Alerts & Events</h3>
                <p className="text-xs text-[#A0A0A0]">
                  {unreadCount} unread telemetry notifications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onClearAll}
                  title="Mark all as read"
                  className="text-xs text-[#FFD700] hover:text-[#FFF0B3] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1A1A1A] border border-[#66521A] hover:border-[#D4AF37] transition-colors font-semibold"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark Read
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-16 text-[#A0A0A0] text-sm">
                <Bell className="w-10 h-10 mx-auto mb-2 text-[#4D3D10] opacity-40" />
                No active notifications
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => alert.read === 0 && onMarkRead(alert.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    alert.read === 0
                      ? 'bg-[#1A1A1A] border-[#D4AF37]/60 shadow-lg shadow-[#D4AF37]/5'
                      : 'bg-[#0E0E0E] border-[#2A2A2A] opacity-75 hover:opacity-100 hover:border-[#66521A]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#F5F5F5] truncate">
                          {alert.title}
                        </span>
                        <span className="text-[10px] text-[#D4AF37] font-mono font-bold">
                          {alert.machine_id}
                        </span>
                      </div>
                      <p className="text-xs text-[#A0A0A0] line-clamp-2 leading-relaxed">
                        {alert.message}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-[#A0A0A0]">
                        <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                        {alert.read === 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[#241C0A] text-[#FFD700] border border-[#66521A] font-bold">
                            New
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[#66521A] bg-[#080808] text-center text-xs text-[#A0A0A0]">
            Connected to Factory Telemetry Bus • Real-time Anomaly Polling Active
          </div>
        </div>
      </div>
    </div>
  );
};
