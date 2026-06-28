import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Sliders, 
  Plus, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface WebslingerEvent {
  id: number;
  event_name: string;
  default_duration_ms: number;
  active_status: number;
}

interface TelemetryRule {
  id: number;
  trigger_rule_name: string;
  statcast_event_type: string;
  telemetry_field: string;
  operator_comparison: string;
  comparison_value: string;
  batting_team_filter: string;
  target_webslinger_event_id: number;
  is_automated_ingress: number;
  active_status: number;
}

interface TelemetryMapperProps {
  isDeskInteractive: boolean;
}

export default function TelemetryMapper({ isDeskInteractive }: TelemetryMapperProps) {
  const [rules, setRules] = useState<TelemetryRule[]>([]);
  const [events, setEvents] = useState<WebslingerEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [ruleName, setRuleName] = useState('');
  const [eventType, setEventType] = useState('hit');
  const [telemetryField, setTelemetryField] = useState('hit_data.launch_speed');
  const [operator, setOperator] = useState('>=');
  const [comparisonValue, setComparisonValue] = useState('105.0');
  const [teamFilter, setTeamFilter] = useState('NYM'); // STRICT DEFAULT
  const [targetEventId, setTargetEventId] = useState<number>(0);

  // Master switch status (inferred from first rule or global state)
  const [autopilot, setAutopilot] = useState(true);

  useEffect(() => {
    fetchRules();
    fetchWebslingerEvents();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tmi_telemetry_map');
      if (res.data && res.data.status === 'success') {
        setRules(res.data.rules || []);
        // Determine autopilot status based on rules
        const anyAutomated = res.data.rules.some((r: TelemetryRule) => r.is_automated_ingress === 1);
        setAutopilot(anyAutomated);
      }
    } catch (err: any) {
      setError('Failed to fetch telemetry rules.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWebslingerEvents = async () => {
    try {
      const res = await axios.get('/api/webslinger_events');
      if (res.data && res.data.status === 'success') {
        const activeEvents = res.data.events || [];
        setEvents(activeEvents);
        if (activeEvents.length > 0) {
          setTargetEventId(activeEvents[0].id);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch webslinger events:', err);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDeskInteractive) return;
    if (!ruleName.trim()) {
      setError('Please provide a unique rule name.');
      return;
    }

    try {
      setError(null);
      const payload = {
        trigger_rule_name: ruleName.trim(),
        statcast_event_type: eventType,
        telemetry_field: telemetryField,
        operator_comparison: operator,
        comparison_value: comparisonValue,
        batting_team_filter: teamFilter,
        target_webslinger_event_id: Number(targetEventId),
        is_automated_ingress: autopilot ? 1 : 0,
        active_status: 1
      };

      const res = await axios.post('/api/tmi_telemetry_map', payload);
      if (res.data && res.data.status === 'success') {
        setSuccessMsg(`Rule "${ruleName}" successfully registered.`);
        setRuleName('');
        fetchRules();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setError(res.data.message || 'Error inserting rule schema.');
      }
    } catch (err: any) {
      setError('Failed to submit rule configuration.');
    }
  };

  const handleToggleRuleActive = async (id: number, currentVal: number) => {
    if (!isDeskInteractive) return;
    try {
      const newVal = currentVal === 1 ? 0 : 1;
      const res = await axios.put(`/api/tmi_telemetry_map/${id}`, { active_status: newVal });
      if (res.data && res.data.status === 'success') {
        fetchRules();
      }
    } catch (err) {
      setError('Failed to update rule status.');
    }
  };

  const handleDeleteRule = async (id: number) => {
    if (!isDeskInteractive) return;
    if (!confirm('Are you sure you want to delete this telemetry mapping rule?')) return;
    try {
      const res = await axios.delete(`/api/tmi_telemetry_map/${id}`);
      if (res.data && res.data.status === 'success') {
        fetchRules();
      }
    } catch (err) {
      setError('Failed to delete rule.');
    }
  };

  const handleToggleAutopilot = async () => {
    if (!isDeskInteractive) return;
    try {
      const nextVal = !autopilot;
      const res = await axios.post(`/api/tmi_telemetry_map/toggle_all?enabled=${nextVal}`);
      if (res.data && res.data.status === 'success') {
        setAutopilot(nextVal);
        fetchRules();
      }
    } catch (err) {
      setError('Failed to toggle master autopilot.');
    }
  };

  // Resolve template name for display
  const getEventName = (eventId: number) => {
    const found = events.find(e => e.id === eventId);
    return found ? found.event_name.replace(/_/g, ' ') : `ID: ${eventId}`;
  };

  return (
    <div style={{
      background: 'rgba(10, 15, 30, 0.45)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '20px',
      padding: '1.75rem',
      backdropFilter: 'blur(20px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      marginTop: '1.5rem'
    }}>
      {/* Header with Master Switch */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '10px',
        marginBottom: '1.25rem'
      }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}>
          <Sliders size={18} color="#FC5C1D" /> TMI Telemetry Trigger Mapper
        </h3>

        {/* Master Autopilot Switch */}
        <button
          onClick={handleToggleAutopilot}
          disabled={!isDeskInteractive}
          style={{
            background: 'none',
            border: 'none',
            cursor: isDeskInteractive ? 'pointer' : 'not-allowed',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: autopilot ? '#00FFCC' : 'rgba(255,255,255,0.3)',
            transition: 'color 0.2s ease',
            opacity: isDeskInteractive ? 1 : 0.5
          }}
        >
          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>TMI AUTOPILOT</span>
          {autopilot ? <ToggleRight size={36} color="#00FFCC" /> : <ToggleLeft size={36} color="rgba(255,255,255,0.3)" />}
        </button>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', lineHeight: '1.4', marginBottom: '1.5rem' }}>
        Bind live Statcast variables (exit velocity, launch angle, distance, pitch speed) to active overlays. 
        <strong style={{ color: '#FC5C1D', marginLeft: '4px' }}>Mets-only batting filter NYM enforced by default.</strong>
      </p>

      {/* Notifications */}
      {error && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#EF4444',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '1rem'
        }}>
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          background: 'rgba(0, 255, 204, 0.1)',
          border: '1px solid rgba(0, 255, 204, 0.25)',
          color: '#00FFCC',
          fontSize: '0.8rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '1rem'
        }}>
          <CheckCircle size={14} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleAddRule} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Rule Description / Name</label>
          <input 
            type="text" 
            placeholder="e.g. Benge 105+ Rocket"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            disabled={!isDeskInteractive}
            style={{
              height: '44px',
              padding: '0 12px',
              borderRadius: '8px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              outline: 'none',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {/* Row 1: Event Type & Target Param */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Statcast Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              disabled={!isDeskInteractive}
              style={{
                height: '44px',
                padding: '0 10px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            >
              <option value="hit">hit</option>
              <option value="pitch">pitch</option>
              <option value="home_run">home run</option>
              <option value="strikeout">strikeout</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Telemetry Property</label>
            <select
              value={telemetryField}
              onChange={(e) => setTelemetryField(e.target.value)}
              disabled={!isDeskInteractive}
              style={{
                height: '44px',
                padding: '0 10px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            >
              <option value="hit_data.launch_speed">hit_data.launch_speed (mph)</option>
              <option value="hit_data.launch_angle">hit_data.launch_angle (deg)</option>
              <option value="hit_data.hit_distance">hit_data.hit_distance (ft)</option>
              <option value="pitch_data.velocity">pitch_data.velocity (mph)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Operator & Threshold */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Operator</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              disabled={!isDeskInteractive}
              style={{
                height: '44px',
                padding: '0 10px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            >
              <option value=">=">&gt;= (Greater or Equal)</option>
              <option value="<=">&lt;= (Less or Equal)</option>
              <option value="=">= (Exactly Equal)</option>
              <option value=">">&gt; (Strictly Greater)</option>
              <option value="<">&lt; (Strictly Less)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Threshold Value</label>
            <input 
              type="text" 
              value={comparisonValue}
              onChange={(e) => setComparisonValue(e.target.value)}
              disabled={!isDeskInteractive}
              style={{
                height: '44px',
                padding: '0 12px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>
        </div>

        {/* Row 3: Team Filter & Target Template */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Batting Team Constraint</label>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              disabled={!isDeskInteractive}
              style={{
                height: '44px',
                padding: '0 10px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            >
              <option value="NYM">NYM (New York Mets Only)</option>
              <option value="CIN">CIN (Cincinnati Reds Only)</option>
              <option value="PHI">PHI (Philadelphia Phillies Only)</option>
              <option value="ATL">ATL (Atlanta Braves Only)</option>
              <option value="GLOBAL">GLOBAL (No Team Limit)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Trigger Overlay / Action</label>
            <select
              value={targetEventId}
              onChange={(e) => setTargetEventId(Number(e.target.value))}
              disabled={!isDeskInteractive || events.length === 0}
              style={{
                height: '44px',
                padding: '0 10px',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                outline: 'none',
                fontSize: '0.85rem'
              }}
            >
              {events.map(evt => (
                <option key={evt.id} value={evt.id}>{evt.event_name.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isDeskInteractive}
          style={{
            height: '44px',
            background: isDeskInteractive ? 'linear-gradient(135deg, #FC5C1D 0%, #002D62 100%)' : 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: isDeskInteractive ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '8px',
            transition: 'all 0.2s ease',
            opacity: isDeskInteractive ? 1 : 0.5
          }}
          onMouseEnter={(e) => {
            if (isDeskInteractive) e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            if (isDeskInteractive) e.currentTarget.style.transform = 'none';
          }}
        >
          <Plus size={16} /> Register Telemetry Mapping Rule
        </button>
      </form>

      {/* Rules Registry Title */}
      <h4 style={{ margin: '1.5rem 0 0.75rem 0', fontSize: '0.95rem', fontWeight: 700, color: '#FC5C1D', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
        Active Telemetry Mappings Registry
      </h4>

      {/* Rules List Grid */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', padding: '1rem 0' }}>
          <RefreshCw size={14} className="animate-spin" /> Fetching registry tables...
        </div>
      ) : rules.length === 0 ? (
        <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '10px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
          No active telemetry rules loaded. Use the form above to add a condition mapping.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                transition: 'all 0.2s ease',
                opacity: rule.active_status === 1 ? 1 : 0.6
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                  {rule.trigger_rule_name}
                </span>
                
                {/* Condition Spec */}
                <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', lineHeight: '1.3' }}>
                  IF <span style={{ color: '#00FFCC' }}>{rule.telemetry_field}</span> {rule.operator_comparison} <span style={{ color: '#00FFCC' }}>{rule.comparison_value}</span> 
                  {rule.batting_team_filter && (
                    <> FOR <span style={{ color: '#FC5C1D', fontWeight: 600 }}>{rule.batting_team_filter}</span></>
                  )}
                  <br />
                  THEN TRIGGER → <span style={{ color: '#0A84FF' }}>{getEventName(rule.target_webslinger_event_id)}</span>
                </span>
              </div>

              {/* Toggles & Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Rule status toggle */}
                <button
                  onClick={() => handleToggleRuleActive(rule.id, rule.active_status)}
                  disabled={!isDeskInteractive}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: isDeskInteractive ? 'pointer' : 'not-allowed',
                    opacity: isDeskInteractive ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={rule.active_status === 1 ? "Deactivate Rule" : "Activate Rule"}
                >
                  {rule.active_status === 1 ? <ToggleRight size={28} color="#00FFCC" /> : <ToggleLeft size={28} color="rgba(255,255,255,0.3)" />}
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  disabled={!isDeskInteractive}
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: isDeskInteractive ? 'pointer' : 'not-allowed',
                    color: '#EF4444',
                    transition: 'all 0.2s ease',
                    opacity: isDeskInteractive ? 1 : 0.5
                  }}
                  onMouseEnter={(e) => {
                    if (isDeskInteractive) {
                      e.currentTarget.style.background = '#EF4444';
                      e.currentTarget.style.color = '#fff';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isDeskInteractive) {
                      e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.currentTarget.style.color = '#EF4444';
                    }
                  }}
                  title="Delete Rule"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
