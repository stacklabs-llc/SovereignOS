import { ShieldAlert, CheckCircle, BellRing } from 'lucide-react';

interface Alert {
  id: number;
  alert_type: string;
  status: string;
  sys_ticket_id: string;
  avatar_url: string;
}

interface CaregiverAlertProps {
  alerts: Alert[];
  cometConnected: boolean;
  onTriggerAlert: () => void;
  onResolveAlert: (id: number) => void;
}

export default function CaregiverAlert({
  alerts,
  cometConnected,
  onTriggerAlert,
  onResolveAlert
}: CaregiverAlertProps) {
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE');
  const hasActiveAlert = activeAlerts.length > 0;

  return (
    <div className="cardboard-panel p-6 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-5">
        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5 text-[#c25134]" /> Caregiver Alert Desk
        </h2>
        <span className={`text-[9px] px-2.5 py-0.5 rounded-full font-sans font-bold border ${cometConnected ? 'bg-[#436850]/8 text-[#436850] border-[#436850]/20' : 'bg-[#9c3120]/8 text-[#9c3120] border-[#9c3120]/20'}`}>
          {cometConnected ? 'MONITORING ACTIVE' : 'RECONNECTING'}
        </span>
      </div>

      {/* Alert Status Card */}
      <div className={`p-4 rounded-xl border mb-5 transition-all duration-300 ${hasActiveAlert ? 'bg-[#9c3120]/8 border-[#9c3120]/30 animate-pulse' : 'bg-[#436850]/8 border-[#436850]/20'}`}>
        <div className="flex items-start space-x-3.5">
          <div className="mt-0.5">
            {hasActiveAlert ? (
              <span className="text-xl">🚨</span>
            ) : (
              <CheckCircle className="w-5.5 h-5.5 text-[#436850]" />
            )}
          </div>
          <div>
            <h4 className={`font-bold text-xs uppercase ${hasActiveAlert ? 'text-[#9c3120]' : 'text-[#436850]'}`}>
              {hasActiveAlert ? 'Emergency Alert Raised' : 'Care Team Status: Stable'}
            </h4>
            <p className="text-xs text-gray-600 mt-1 font-sans">
              {hasActiveAlert 
                ? 'P1 Incident logged. Assistance requested immediately.' 
                : 'All outbound nodes running nominal check-ins.'}
            </p>
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <div className="space-y-4">
        {!hasActiveAlert ? (
          <button
            onClick={onTriggerAlert}
            disabled={!cometConnected}
            className="w-full py-3.5 px-6 bg-[#c25134] hover:bg-[#b84a2b] disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer uppercase tracking-widest flex items-center justify-center gap-2 text-xs"
          >
            <BellRing className="w-4.5 h-4.5" />
            <span>Notify James (HQ)</span>
          </button>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map(alert => {
              const displayTicketId = alert.sys_ticket_id ? alert.sys_ticket_id.split('|')[0] : 'INC-COMET-PENDING';
              return (
                <div key={alert.id} className="p-3 bg-[#faf8f5] border border-gray-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-[9px] font-mono font-bold bg-gray-100 border border-gray-200 text-gray-700 px-2 py-0.5 rounded mr-2.5">
                      {displayTicketId}
                    </span>
                    <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">P1 Assistance</span>
                  </div>
                  <button
                    onClick={() => onResolveAlert(alert.id)}
                    className="py-1.5 px-3 bg-[#436850] hover:bg-[#385542] text-white text-[9px] font-bold rounded-lg cursor-pointer uppercase tracking-widest shadow-sm"
                  >
                    Resolve
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
