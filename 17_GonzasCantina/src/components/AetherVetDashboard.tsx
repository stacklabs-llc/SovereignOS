import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Map, 
  Target, 
  AlertTriangle, 
  ChevronRight, 
  Video, 
  Home, 
  Battery, 
  Wifi, 
  Settings, 
  Bell, 
  Search,
  ActivitySquare,
  X,
  FileText,
  Download,
  XCircle,
  VideoOff,
  PhoneIncoming,
  PhoneMissed,
  Phone
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import VetTelemetryDashboard from './VetTelemetryDashboard';

interface AetherVetDashboardProps {
  onNavigate?: (domain: string, room: string) => void;
}

const petkitData = [
  { month: 'Jun', visits: 3.2, weight: 4.8 },
  { month: 'Jul', visits: 4.1, weight: 4.8 },
  { month: 'Aug', visits: 4.2, weight: 4.7 },
  { month: 'Sep', visits: 3.8, weight: 4.7 },
  { month: 'Oct', visits: 4.5, weight: 4.6 },
  { month: 'Nov', visits: 3.9, weight: 4.6 },
  { month: 'Dec', visits: 3.8, weight: 4.5 },
  { month: 'Jan', visits: 4.1, weight: 4.4 },
  { month: 'Feb', visits: 4.0, weight: 4.3 },
  { month: 'Mar', visits: 6.1, weight: 4.3 }, // Spike in visits
  { month: 'Apr', visits: 5.8, weight: 4.2 },
  { month: 'May', visits: 4.2, weight: 4.1 }, // Weight drop
];

const activityData = Array.from({ length: 30 }).map((_, i) => {
  const day = i + 1;
  const activeTime = day > 20 ? 20 + Math.random() * 10 : 35 + Math.random() * 20;
  const steps = day > 20 ? 300 + Math.random() * 100 : 600 + Math.random() * 300;
  return { day, activeTime, steps };
});

export const patientsList = [
  {
    name: 'Metsy',
    species: 'Feline',
    breed: 'DSH',
    age: '8 Years',
    sex: 'Spayed Female',
    weight: '10.5 lbs',
    avatar: '/aether_assets/Veterinary_digital_platform_202604190300.jpeg',
    alert: 'Subclinical Degenerative Joint Disease',
    microchip: '981023910238122',
    connectedDevices: [
      { name: 'GPS Collar', status: '82%', type: 'battery' },
      { name: 'PetKit Box', status: 'Online', type: 'wifi' }
    ],
    medications: [
      { name: 'Solensia (Frunevetmab)', description: '7mg Subcutaneous Injection (Monthly)', status: 'Current' }
    ],
    diagnostics: [
      { name: 'Senior Blood Panel.pdf', date: 'Jan 2026' },
      { name: 'Urinalysis_Report.pdf', date: 'Jan 2026' }
    ],
    history: [
      { name: 'Annual Wellness Check', date: 'Mar 15, 2026' },
      { name: 'Dental Cleaning', date: 'Nov 1, 2025' },
      { name: 'Rabies Vaccine (3-year)', date: 'Apr 2024' }
    ]
  },
  {
    name: 'Sam',
    species: 'Canine',
    breed: 'Beagle / Mix',
    age: '4 Years',
    sex: 'Neutered Male',
    weight: '14.0 lbs',
    avatar: '/aether_assets/sam_profile.png',
    alert: 'Post-Op Recovery: Left TPLO Surgery',
    microchip: '981023910238994',
    connectedDevices: [
      { name: 'GPS Collar', status: '94%', type: 'battery' },
      { name: 'FitBark Monitor', status: 'Online', type: 'wifi' }
    ],
    medications: [
      { name: 'Galliprant (Grapiprant)', description: '20mg Oral Tablet (Daily)', status: 'Current' },
      { name: 'Dasuquin Advanced', description: 'Joint Health Supplement Chew (Daily)', status: 'Current' }
    ],
    diagnostics: [
      { name: 'Stifle_Radiographs.pdf', date: 'Apr 2026' },
      { name: 'Pre-Op_Bloodwork.pdf', date: 'Apr 2026' }
    ],
    history: [
      { name: 'Left TPLO Surgery', date: 'Apr 18, 2026' },
      { name: 'Suture Removal & Exam', date: 'May 2, 2026' },
      { name: 'Post-Op Laser Therapy', date: 'May 16, 2026' }
    ]
  }
];

export default function AetherVetDashboard({ onNavigate }: AetherVetDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [consultSubmitState, setConsultSubmitState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [usePreviousInfo, setUsePreviousInfo] = useState(false);
  
  const [selectedPatientName, setSelectedPatientName] = useState('Metsy');
  const activePatient = patientsList.find(p => p.name === selectedPatientName) || patientsList[0];

  const [patientData, setPatientData] = useState({
    patient_name: 'Metsy',
    species_breed: 'Feline — DSH',
    age_sex: '8 yrs — Spayed Female',
    weight: '10.5 lbs',
    food_brand_flavor: '',
    meals_per_day: 'Two',
    amount_per_meal: '',
    medications_supplements: '',
    heartworm_preventative_name: '',
    missed_heartworm_doses: 'No',
    flea_preventative_name: '',
    missed_flea_doses: 'No',
    visited_another_vet_er: 'No'
  });

  // Keep consult form patient data synchronized when active patient changes
  useEffect(() => {
    setPatientData({
      patient_name: activePatient.name,
      species_breed: `${activePatient.species} — ${activePatient.breed}`,
      age_sex: `${activePatient.age} — ${activePatient.sex}`,
      weight: activePatient.weight,
      food_brand_flavor: '',
      meals_per_day: 'Two',
      amount_per_meal: '',
      medications_supplements: '',
      heartworm_preventative_name: '',
      missed_heartworm_doses: 'No',
      flea_preventative_name: '',
      missed_flea_doses: 'No',
      visited_another_vet_er: 'No'
    });
  }, [selectedPatientName]);

  useEffect(() => {
    if (isConsultModalOpen) {
      fetch(`/api/system/aethervet/patient/${selectedPatientName}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.patient_name) {
            setPatientData(data);
          }
        })
        .catch(err => console.error('Failed to fetch patient data:', err));
    }
  }, [isConsultModalOpen, selectedPatientName]);

  const handleSubmitConsult = async () => {
    setConsultSubmitState('submitting');
    try {
      const response = await fetch('/api/system/aethervet/patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });
      if (response.ok) {
        setConsultSubmitState('success');
      } else {
        throw new Error('Failed to save patient record');
      }
    } catch (err) {
      console.error('Failed to submit consult:', err);
      alert('Error saving patient records. Please try again.');
      setConsultSubmitState('idle');
    }
  };

  const [telepresenceState, setTelepresenceState] = useState<'standby' | 'dialing' | 'connected'>('standby');

  // Incoming call ring state
  const [ringing, setRinging] = useState(false);
  const [ringerCaller, setRingerCaller] = useState('PATIENT');
  const pendingOfferRef = useRef<any>(null);
  const pendingCallerRef = useRef<string>('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const wsUrl = 'wss://clio.taila01894.ts.net/ws-relay';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'WEBRTC_OFFER' && msg.target === 'aether_vet_hq') {
          // Store offer and show ring UI — do NOT auto-answer
          pendingOfferRef.current = msg.offer;
          pendingCallerRef.current = msg.from;
          const displayName = msg.from.replace('mobile_', '').replace(/_/g, ' ').toUpperCase();
          setRingerCaller(displayName || 'PATIENT');
          setRinging(true);
        }
        if (msg.type === 'WEBRTC_ICE_CANDIDATE' && msg.target === 'aether_vet_hq') {
          if (peerConnectionRef.current) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(msg.candidate));
          }
        }
        if (msg.type === 'HOLOLINK_END') {
          endCall();
        }
      } catch (e) {}
    };

    return () => {
      ws.close();
      endCall();
    };
  }, []);

  const answerCall = async () => {
    setRinging(false);
    setActiveTab('telepresence');
    setTelepresenceState('dialing');
    const offer = pendingOfferRef.current;
    const callerId = pendingCallerRef.current;
    pendingOfferRef.current = null;
    pendingCallerRef.current = '';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setTelepresenceState('connected');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'WEBRTC_ICE_CANDIDATE',
            candidate: event.candidate,
            from: 'aether_vet_hq',
            target: callerId
          }));
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'WEBRTC_ANSWER',
          answer: answer,
          from: 'aether_vet_hq',
          target: callerId
        }));
      }
    } catch (e) {
      setTelepresenceState('standby');
    }
  };

  const declineCall = () => {
    setRinging(false);
    pendingOfferRef.current = null;
    pendingCallerRef.current = '';
    if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'HOLOLINK_END' }));
  };

  const initiateCall = async () => {
    setActiveTab('telepresence');
    setTelepresenceState('dialing');
    
    // Request camera immediately on user interaction to prevent mobile browser blocks
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    } catch (e) {
      console.warn('Could not grab local camera on init:', e);
    }

    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'HOLOLINK_REQUEST',
        target: 'barb_tv',
        from: 'aether_vet_hq'
      }));
    }
  };

  const handleIncomingOffer = async (offer: any, callerId: string) => {
    try {
      const stream = localStreamRef.current || await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
      if (stream && localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerConnectionRef.current = pc;

      if (stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      } else {
         pc.addTransceiver('video', { direction: 'recvonly' });
         pc.addTransceiver('audio', { direction: 'recvonly' });
      }

      pc.ontrack = (event) => {
        if (event.streams[0]) {
          setRemoteStream(event.streams[0]);
          setTelepresenceState('connected');
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'WEBRTC_ICE_CANDIDATE',
            candidate: event.candidate,
            from: 'aether_vet_hq',
            target: callerId
          }));
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'WEBRTC_ANSWER',
          answer: answer,
          from: 'aether_vet_hq',
          target: callerId
        }));
      }
    } catch (e) {
      setTelepresenceState('standby');
    }
  };

  const endCall = () => {
    setTelepresenceState('standby');
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (telepresenceState === 'connected' && remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [telepresenceState, remoteStream]);

  // Dynamic charts maps to reflect specific patient trends
  const activePetkitData = selectedPatientName === 'Metsy' 
    ? petkitData 
    : petkitData.map(d => ({
        ...d,
        visits: d.month === 'Mar' ? 1.8 : Math.max(0.6, d.visits * 0.4 + (Math.random() * 0.4)),
        weight: 6.2 + (d.weight - 4.1) * 0.3
      }));

  const activeActivityData = selectedPatientName === 'Metsy'
    ? activityData
    : activityData.map(d => ({
        ...d,
        activeTime: d.day > 18 ? 12 + Math.random() * 4 : 48 + Math.random() * 15,
        steps: d.day > 18 ? 150 + Math.random() * 50 : 1350 + Math.random() * 300
      }));

  return (
    <div className="os-panel min-h-screen w-full flex flex-col overflow-y-auto pb-20 relative transition-colors duration-500 text-white font-sans">

      {/* ── INCOMING CALL RING OVERLAY ── */}
      {ringing && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-between py-16 px-8"
          style={{ background: 'radial-gradient(ellipse at center, rgba(5,13,24,0.97) 0%, #020810 100%)' }}>
          {/* Pulse rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 rounded-full border border-[#2a9d8f]/10 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute w-60 h-60 rounded-full border border-[#2a9d8f]/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
            <div className="absolute w-40 h-40 rounded-full border border-[#2a9d8f]/30 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
          </div>

          {/* Top info */}
          <div className="flex flex-col items-center z-10 text-center">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#2a9d8f]/30 bg-[#2a9d8f]/10 mb-6">
              <div className="w-2 h-2 rounded-full bg-[#2a9d8f] animate-pulse" />
              <span className="text-[11px] font-mono text-[#2a9d8f] uppercase tracking-widest">Aether Vet HoloLink</span>
            </div>
            <h2 className="text-white/40 text-sm font-medium uppercase tracking-widest mb-2">Incoming Patient Call</h2>
            <h1 className="text-white text-4xl font-bold tracking-wide mb-1">{ringerCaller}</h1>
            <p className="text-white/40 text-sm font-mono">via HoloLink Secure Channel</p>
          </div>

          {/* Center icon */}
          <div className="relative z-10 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-2 border-[#2a9d8f]/40 bg-[#2a9d8f]/10 flex items-center justify-center"
              style={{ boxShadow: '0 0 60px rgba(42,157,143,0.2), inset 0 0 30px rgba(42,157,143,0.05)' }}>
              <PhoneIncoming className="w-12 h-12 text-[#2a9d8f]" />
            </div>
          </div>

          {/* Answer / Decline */}
          <div className="flex items-end gap-16 z-10">
            <button
              onClick={declineCall}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all group-hover:scale-110">
                <PhoneMissed className="w-7 h-7" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">Decline</span>
            </button>

            <button
              onClick={answerCall}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-20 h-20 rounded-full bg-[#2a9d8f] flex items-center justify-center text-white group-hover:scale-110 transition-all"
                style={{ boxShadow: '0 0 30px rgba(42,157,143,0.5)' }}>
                <Phone className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#2a9d8f]">Answer</span>
            </button>
          </div>
        </div>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="os-card-header flex items-center justify-between px-8 py-4 backdrop-blur-md sticky top-0 z-40 transition-colors duration-500">
          <div className="flex items-center gap-4">
            <ActivitySquare className="w-8 h-8 text-[#38bdf8]" />
            <h1 className="text-2xl font-bold tracking-wider">
              Aether <span className="text-[#38bdf8]">Vet</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-8 text-sm font-medium text-white/60 overflow-x-auto pb-2 lg:pb-0 whitespace-nowrap">
            <button className={`hover:text-[#38bdf8] transition-colors ${activeTab === 'dashboard' ? 'text-[#38bdf8] border-b-2 border-[#38bdf8] pb-1' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
            <button className={`hover:text-[#38bdf8] transition-colors ${activeTab === 'telemetry' ? 'text-[#38bdf8] border-b-2 border-[#38bdf8] pb-1' : ''}`} onClick={() => setActiveTab('telemetry')}>Telemetry</button>
            <button className={`hover:text-[#38bdf8] transition-colors ${activeTab === 'patients' ? 'text-[#38bdf8] border-b-2 border-[#38bdf8] pb-1' : ''}`} onClick={() => setActiveTab('patients')}>Patients</button>
            <button className={`hover:text-[#38bdf8] transition-colors ${activeTab === 'telepresence' ? 'text-[#38bdf8] border-b-2 border-[#38bdf8] pb-1' : ''}`} onClick={() => setActiveTab('telepresence')}>Telepresence</button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-black/40 border border-white/10 rounded-full px-4 py-1.5 text-sm w-48 focus:outline-none focus:border-[#38bdf8]/50 transition-colors"
              />
              <Search className="w-4 h-4 text-white/40 absolute right-3 top-2" />
            </div>
            <button className="relative p-2 hover:bg-black/40 rounded-full transition-colors">
              <Bell className="w-5 h-5 text-white/60" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </button>
            <button className="p-2 hover:bg-black/40 rounded-full transition-colors">
              <Settings className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-8">
          {activeTab === 'telemetry' && (
            <VetTelemetryDashboard />
          )}

          {activeTab !== 'telemetry' && (
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
              
              {/* Left Sidebar */}
              <div className="lg:col-span-2 flex flex-col gap-4 order-2 lg:order-1">
                <div className="os-card p-4">
                  <div className="text-xs text-white/40 font-mono uppercase mb-2">Active Patient</div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-900 border border-[#38bdf8]/30 flex items-center justify-center overflow-hidden">
                      <img src={activePatient.avatar} alt={activePatient.name} className="w-full h-full object-cover opacity-80" />
                    </div>
                    <div>
                      <div className="font-bold">{activePatient.name}</div>
                      <div className="text-xs text-white/60">{activePatient.species}, {activePatient.age.split(' ')[0]}y, {activePatient.breed.split(' ')[0]}</div>
                    </div>
                  </div>
                </div>

                <div className="os-card p-4 flex flex-col gap-2">
                  <div className="text-xs text-white/40 font-mono uppercase mb-2">Connected Devices</div>
                  {activePatient.connectedDevices.map((dev) => (
                    <div key={dev.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-white/80">
                        {dev.type === 'battery' ? <Map className="w-4 h-4 text-[#38bdf8]" /> : <Home className="w-4 h-4 text-[#38bdf8]" />}
                        {dev.name}
                      </div>
                      <div className="flex items-center gap-2">
                        {dev.type === 'battery' && <Battery className="w-3 h-3 text-emerald-400" />}
                        {dev.type === 'wifi' && <Wifi className="w-3 h-3 text-emerald-400" />}
                        <span className="text-xs text-emerald-400">{dev.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="os-card p-4 flex flex-col gap-3 flex-1">
                  <div className="text-xs text-white/40 font-mono uppercase">Quick Actions</div>
                  <button className="bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30 rounded-lg py-2 text-sm font-medium transition-colors w-full text-left px-3 flex items-center justify-between">
                    Generate Report <ChevronRight className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setIsConsultModalOpen(true)}
                    className="bg-black/40 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-sm font-medium transition-colors w-full text-left px-3 flex items-center justify-between"
                  >
                    Schedule Consult <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Center Column */}
              <div className="lg:col-span-7 flex flex-col gap-6 order-1 lg:order-2">
                
                {activeTab === 'dashboard' && (
                  <>
                    {/* PetKit Telemetry */}
                    <div className="os-card p-6 flex flex-col h-80">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Activity className="w-4 h-4 text-[#38bdf8]" /> 
                          Telemetry: Feline Trends (12 Months)
                        </h3>
                      </div>
                      <div className="flex-1 w-full h-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={activePetkitData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                            <XAxis dataKey="month" stroke="currentColor" opacity={0.4} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" stroke="currentColor" opacity={0.4} fontSize={12} tickLine={false} axisLine={false} domain={selectedPatientName === 'Metsy' ? [2, 8] : [0, 4]} />
                            <YAxis yAxisId="right" orientation="right" stroke="currentColor" opacity={0.4} fontSize={12} tickLine={false} axisLine={false} domain={selectedPatientName === 'Metsy' ? [3.5, 5] : [5.8, 6.8]} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'var(--color-panel, #111827)', borderColor: 'var(--color-glow-blue, #38bdf830)', borderRadius: '8px' }}
                              itemStyle={{ color: 'inherit' }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', opacity: 0.8 }} />
                            <Line yAxisId="left" type="monotone" name={selectedPatientName === 'Metsy' ? "Litterbox Frequency (Daily avg)" : "Elimination Activity (Daily avg)"} dataKey="visits" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4, fill: 'currentColor', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            <Line yAxisId="right" type="monotone" name="Body Weight (kg)" dataKey="weight" stroke="#10b981" strokeWidth={2} dot={{ r: 4, fill: 'currentColor', strokeWidth: 2 }} />
                            {selectedPatientName === 'Metsy' && (
                              <ReferenceLine yAxisId="left" x="Mar" stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Anomaly Detected', position: 'insideTopLeft', fill: '#ef4444', fontSize: 10 }} />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Activity Saturation */}
                    <div className="os-card p-6 flex flex-col h-80 relative overflow-hidden group">
                      <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Target className="w-4 h-4 text-emerald-400" /> 
                          Activity Saturation: Micro-Regressions (30 Days)
                        </h3>
                      </div>
                      <div className="flex-1 w-full h-full min-h-0 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={activeActivityData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} vertical={false} />
                            <XAxis dataKey="day" stroke="currentColor" opacity={0.4} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Day ${val}`} />
                            <YAxis yAxisId="left" stroke="currentColor" opacity={0.4} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="currentColor" opacity={0.4} fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: 'var(--color-panel, #111827)', borderColor: 'var(--color-glow-blue, #10b98130)', borderRadius: '8px' }}
                              itemStyle={{ color: 'inherit' }}
                            />
                            <Line yAxisId="left" type="monotone" dataKey="activeTime" name="Active Time (mins)" stroke="#10b981" strokeWidth={2} dot={false} />
                            <Line yAxisId="right" type="monotone" dataKey="steps" name="Step Count" stroke="#38bdf8" strokeWidth={2} dot={false} />
                            <ReferenceLine yAxisId="left" x={selectedPatientName === 'Metsy' ? 20 : 18} stroke="#ef4444" strokeWidth={2} label={{ value: selectedPatientName === 'Metsy' ? 'Activity Decline' : 'Post-Op Rest', position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'patients' && (
                  <div className="os-card p-6 flex flex-col flex-1 min-h-[600px] border-[#38bdf8]/30 shadow-[0_0_30px_rgba(56,189,248,0.1)] relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 relative z-10">
                      <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                        <ActivitySquare className="w-6 h-6 text-[#38bdf8]" />
                        My Patient Registry & Pet Family
                      </h3>
                      <div className="text-xs text-white/40 font-mono uppercase">2 Registered Members</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                      {patientsList.map((p) => {
                        const isActive = p.name === selectedPatientName;
                        return (
                          <div 
                            key={p.name}
                            className={`os-card p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden border ${isActive ? 'border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.15)] bg-black/60' : 'border-white/10 bg-black/30 hover:border-[#38bdf8]/40 hover:bg-black/40'}`}
                          >
                            {isActive && (
                              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#38bdf8] to-purple-500" />
                            )}

                            <div>
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                  <div className={`w-16 h-16 rounded-full border-2 overflow-hidden flex items-center justify-center ${isActive ? 'border-[#38bdf8]' : 'border-white/20'}`}>
                                    <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xl font-bold text-white">{p.name}</span>
                                      {isActive && (
                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20 uppercase tracking-widest">Active</span>
                                      )}
                                    </div>
                                    <div className="text-xs text-white/60 mt-0.5">{p.species} • {p.breed} • {p.age}</div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs text-white/40 font-mono">Weight</span>
                                  <div className="font-semibold text-white">{p.weight}</div>
                                </div>
                              </div>

                              <div className="mb-4">
                                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Clinical Status</span>
                                <div className={`mt-1 p-2.5 rounded-lg border text-xs flex items-center gap-2 ${p.name === 'Metsy' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                  <span className="font-medium">{p.alert}</span>
                                </div>
                              </div>

                              <div className="mb-6">
                                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-2">Connected Devices & Telemetry</span>
                                <div className="grid grid-cols-2 gap-2">
                                  {p.connectedDevices.map((dev) => (
                                    <div key={dev.name} className="bg-black/40 border border-white/5 p-2 rounded-lg flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-1.5 text-white/80">
                                        {dev.type === 'battery' ? <Map className="w-3.5 h-3.5 text-[#38bdf8]" /> : <Home className="w-3.5 h-3.5 text-[#38bdf8]" />}
                                        <span className="font-medium">{dev.name}</span>
                                      </div>
                                      <span className="text-emerald-400 font-bold">{dev.status}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div>
                              {isActive ? (
                                <button 
                                  disabled
                                  className="w-full bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-default"
                                >
                                  <Activity className="w-4 h-4" /> Selected Patient Profile
                                </button>
                              ) : (
                                <button 
                                  onClick={() => setSelectedPatientName(p.name)}
                                  className="w-full bg-gradient-to-r from-[#38bdf8] to-cyan-500 hover:from-[#38bdf8]/80 hover:to-cyan-500/80 text-black font-bold py-2.5 rounded-lg text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
                                >
                                  <ActivitySquare className="w-4 h-4" /> Select Patient
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 border border-dashed border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center relative z-10 bg-black/10">
                      <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 mb-3">
                        <Home className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-semibold text-white/80">Add another family pet?</h4>
                      <p className="text-xs text-white/40 mt-1 max-w-sm">Connect a third telemetry node or sync collar configurations in the main Sovereign OS device CMDB.</p>
                    </div>
                  </div>
                )}

                {activeTab === 'telepresence' && (
                  <div className="os-card p-6 flex flex-col flex-1 min-h-[600px] border-[#38bdf8]/30 shadow-[0_0_30px_rgba(56,189,248,0.1)] relative overflow-hidden">
                    <h3 className="text-sm font-bold text-[#38bdf8] tracking-widest uppercase flex items-center gap-2 mb-4 relative z-10">
                      <Video className="w-5 h-5" /> Live Clinical Telepresence
                    </h3>

                    {telepresenceState === 'standby' && (
                      <div className="flex-1 bg-black/60 rounded-xl border border-white/10 flex flex-col items-center justify-center relative z-10 overflow-hidden">
                        <img src="/aether_assets/telepresence_vet_mockup_1774766349214.png" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm mix-blend-luminosity" alt="bg" />
                        <Video className="w-16 h-16 text-white/20 mb-4 relative z-10" />
                        <h4 className="text-xl font-bold text-white/50 mb-6 relative z-10 uppercase tracking-widest">System Standby</h4>
                        <button 
                          onClick={initiateCall}
                          className="relative z-10 bg-[#38bdf8]/20 hover:bg-[#38bdf8]/40 text-[#38bdf8] border border-[#38bdf8]/50 px-8 py-3 rounded-lg font-bold tracking-wider transition-all hover:scale-105 active:scale-95"
                        >
                          CALL THE VET
                        </button>
                      </div>
                    )}

                    {telepresenceState === 'dialing' && (
                      <div className="flex-1 bg-black/60 rounded-xl border border-[#38bdf8]/50 flex flex-col items-center justify-center relative z-10">
                        <div className="relative w-32 h-32 mb-8">
                          <div className="absolute inset-0 border-4 border-[#38bdf8]/20 rounded-full animate-ping"></div>
                          <div className="absolute inset-2 border-4 border-[#38bdf8]/40 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
                          <div className="absolute inset-4 border-4 border-[#38bdf8] rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1s' }}></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Activity className="w-8 h-8 text-[#38bdf8] animate-pulse" />
                          </div>
                        </div>
                        <h4 className="text-2xl font-mono font-bold text-[#38bdf8] tracking-widest uppercase animate-pulse shadow-black drop-shadow-md">
                          Dialing Clinic...
                        </h4>
                        <p className="text-[#38bdf8]/60 font-mono mt-2 text-sm uppercase tracking-wider">Establishing Secure WebRTC Mesh</p>
                      </div>
                    )}

                    {telepresenceState === 'connected' && (
                      <div className="flex-1 relative rounded-xl overflow-hidden border border-[#38bdf8]/50 bg-black shadow-[0_0_20px_rgba(56,189,248,0.2)] z-10">
                        <video 
                          ref={remoteVideoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-full object-cover" 
                        />
                        <div className="fallback hidden absolute inset-0 flex flex-col items-center justify-center text-[#38bdf8]/50 font-mono text-sm">
                          <Video className="w-12 h-12 mb-4 opacity-50 animate-pulse" />
                          STREAM UNAVAILABLE
                        </div>
                        
                        <div className="absolute bottom-6 right-6 w-48 h-64 bg-black rounded-lg overflow-hidden border-2 border-white/20 shadow-2xl z-10">
                          <video 
                            ref={localVideoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover transform scale-x-[-1]" 
                          />
                        </div>

                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 border border-white/10 z-10 shadow-lg">
                          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
                          <span className="text-xs font-mono font-bold text-white uppercase tracking-widest">HoloLink Active</span>
                        </div>
                        
                        <button 
                          onClick={() => {
                            endCall();
                            if (wsRef.current) wsRef.current.send(JSON.stringify({ type: 'HOLOLINK_END' }));
                          }}
                          className="absolute top-4 right-4 bg-red-500/20 hover:bg-red-500 text-white border border-red-500/50 px-4 py-2 rounded-full flex items-center gap-2 transition-colors z-10 text-xs font-bold uppercase tracking-wider shadow-lg"
                        >
                          <VideoOff className="w-4 h-4" /> Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="lg:col-span-3 flex flex-col gap-6 order-3 lg:order-3">
                
                {activeTab === 'dashboard' ? (
                  <>
                    {/* Clinical Alert */}
                    <div className={`os-card-primary p-5 relative overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.2)] border ${selectedPatientName === 'Metsy' ? 'border-[#ef4444]/50' : 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'}`}>
                      <div className="absolute top-0 right-0 p-4 opacity-20">
                        <AlertTriangle className={`w-24 h-24 ${selectedPatientName === 'Metsy' ? 'text-red-500' : 'text-amber-500'}`} />
                      </div>
                      <h3 className={`font-bold flex items-center gap-2 mb-4 ${selectedPatientName === 'Metsy' ? 'text-red-500' : 'text-amber-500'}`}>
                        <AlertTriangle className="w-5 h-5 animate-pulse" /> 
                        {selectedPatientName === 'Metsy' ? 'HIGH PRIORITY ALERT' : 'CLINICAL CARE SUMMARY'}
                      </h3>
                      <div className="text-sm font-semibold mb-2">
                        {selectedPatientName === 'Metsy' ? '[!] DEGENERATE JOINT DISEASE' : '[!] TPLO POST-OP RESTRICTIONS'}
                      </div>
                      <div className="text-xs space-y-3 relative z-10 text-white/80">
                        {selectedPatientName === 'Metsy' ? (
                          <>
                            <p>Subclinical Arthritis Detected (Feline, Metsy, 8y)</p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>Significant Micro-Regression in Gait/Mobility</li>
                              <li>Reduced PetKit Activity (<strong>81% ↓</strong> over 14 days)</li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-red-500/20 font-medium text-red-400">
                              Action Recommended: Comprehensive Orthopedic Exam, Joint Supplementation, Pain Management Protocol
                            </div>
                          </>
                        ) : (
                          <>
                            <p>Cruciate Ligament Post-Op Healing Stage (Canine, Sam, 4y)</p>
                            <ul className="list-disc pl-4 space-y-1">
                              <li>Activity restricted strictly to controlled leash walks</li>
                              <li>Monitor Left Stifle surgical incision site daily</li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-amber-500/20 font-medium text-amber-400">
                              Action Recommended: Strict crate rest, controlled range-of-motion therapy, ice stifle post-exercise
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Visual Gallery */}
                    <div className="os-card p-5 flex flex-col gap-4 flex-1">
                      <h3 className="text-xs font-semibold text-white/70 tracking-widest uppercase flex items-center gap-2">
                        <Video className="w-4 h-4 text-purple-400" /> Clinical Telepresence
                      </h3>
                      
                      <div 
                        className="relative rounded-lg overflow-hidden border border-purple-500/50 aspect-video bg-black shadow-[0_0_15px_rgba(168,85,247,0.2)] group cursor-pointer"
                        onClick={initiateCall}
                      >
                        <img 
                          src="/aether_assets/telepresence_vet_mockup_1774766349214.png" 
                          className="w-full h-full object-cover opacity-60 group-hover:opacity-30 transition-opacity" 
                          alt="Telepresence Standby" 
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-400">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Video className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-[10px] tracking-wide uppercase bg-black/60 px-2 py-1 rounded">Initiate Session</span>
                        </div>
                      </div>

                      <div className="relative rounded-lg overflow-hidden border border-white/10 group cursor-pointer aspect-video bg-black">
                        <img src="/aether_assets/cozy_vet_clinic_integration_1774766327135.png" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Clinic Integration" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                          <span className="bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full">View Visit</span>
                        </div>
                      </div>
                      
                      <button className="text-xs text-[#38bdf8] hover:text-[#38bdf8]/80 text-center w-full mt-2 font-medium">View Complete Media Archive →</button>
                    </div>
                  </>
                ) : (
                  <div className="os-card p-5 flex flex-col gap-4 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                    <h3 className="font-bold text-white/90 border-b border-white/10 pb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                      <FileText className="w-4 h-4 text-[#38bdf8]" /> PATIENT CHART: {activePatient.name}
                    </h3>
                    
                    {/* Patient Overview */}
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                      <div className="grid grid-cols-2 gap-y-2 text-xs">
                        <div><span className="text-white/40">Species:</span> {activePatient.species}</div>
                        <div><span className="text-white/40">Breed:</span> {activePatient.breed}</div>
                        <div><span className="text-white/40">Age:</span> {activePatient.age}</div>
                        <div><span className="text-white/40">Sex:</span> {activePatient.sex}</div>
                        <div><span className="text-white/40">Weight:</span> {activePatient.weight}</div>
                        <div><span className="text-white/40">Microchip:</span> {activePatient.microchip.substring(0, 7)}...</div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-white/5 text-xs">
                        <span className="text-red-400 font-semibold">Alert:</span> {activePatient.alert}
                      </div>
                    </div>

                    {/* Active Medications */}
                    <div className="mt-1">
                      <div className="font-mono text-[10px] text-white/50 uppercase mb-2 tracking-widest">Active Prescriptions</div>
                      <div className="flex flex-col gap-2">
                        {activePatient.medications.map((med) => (
                          <div key={med.name} className="bg-black/40 border border-white/5 p-2.5 rounded-lg flex justify-between items-center">
                            <div>
                              <div className="text-white/80 text-xs font-semibold">{med.name}</div>
                              <div className="text-white/40 text-[10px] mt-0.5">{med.description}</div>
                            </div>
                            <div className="text-emerald-400 text-[10px] bg-emerald-400/10 px-2 py-1 rounded font-bold uppercase">{med.status}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lab Results (PDFs) */}
                    <div className="mt-2">
                      <div className="font-mono text-[10px] text-white/50 uppercase mb-2 tracking-widest">Recent Diagnostics</div>
                      <div className="flex flex-col gap-2">
                        {activePatient.diagnostics.map((diag) => (
                          <button key={diag.name} className="bg-black/40 hover:bg-white/10 border border-white/5 p-2.5 rounded-lg text-left flex justify-between items-center transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="bg-red-500/20 p-1.5 rounded text-red-400 group-hover:bg-red-500/30 transition-colors">
                                <FileText className="w-4 h-4" />
                              </div>
                              <span className="text-white/80 text-xs font-semibold">{diag.name}</span>
                            </div>
                            <span className="text-white/40 font-mono text-[9px]">{diag.date}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Records Access & History */}
                    <div className="mt-2">
                      <div className="font-mono text-[10px] text-white/50 uppercase mb-2 tracking-widest">Records Access & History</div>
                      <div className="flex flex-col gap-2">
                        {activePatient.history.map((hist) => (
                          <button key={hist.name} className="bg-black/40 hover:bg-white/10 border border-white/5 p-2.5 rounded-lg text-left flex justify-between items-center transition-colors">
                            <span className="text-white/80 text-xs font-semibold">{hist.name}</span>
                            <span className="text-white/40 font-mono text-[9px]">{hist.date}</span>
                          </button>
                        ))}
                        <button className="mt-2 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/30 p-2.5 rounded-lg text-center transition-colors text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                          <Download className="w-4 h-4" /> Download All Records
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Consult Modal */}
      {isConsultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="os-card w-full max-w-lg p-0 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="os-card-header px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#38bdf8]" />
                Schedule Consult
              </h2>
              <button 
                onClick={() => {
                  setIsConsultModalOpen(false);
                  setConsultSubmitState('idle');
                }}
                className="p-1 hover:bg-black/40 rounded-full transition-colors"
              >
                <X className="w-5 h-5 opacity-70" />
              </button>
            </div>
            
            {consultSubmitState === 'success' ? (
              <div className="p-10 flex flex-col items-center justify-center text-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-2">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white">Consultation Requested</h3>
                <p className="text-sm text-white/60">Your request has been sent to the clinic. You will receive a confirmation shortly.</p>
                <button 
                  onClick={() => {
                    setIsConsultModalOpen(false);
                    setConsultSubmitState('idle');
                  }}
                  className="mt-4 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <>
                <div className="p-6 flex flex-col gap-5 max-h-[65vh] overflow-y-auto custom-scrollbar bg-[#00040a]/95 text-white/90">
                  <p className="text-xs text-white/60 leading-relaxed font-sans">
                    Request a specialist consultation. Review patient info below and fill in scheduling details.
                  </p>

                  {/* "Same as last visit" Configuration */}
                  <div className="flex items-center justify-between bg-black/40 border border-white/10 p-3 rounded-lg font-sans">
                    <span className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-widest">Consult Configuration</span>
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        id="usePrev"
                        className="accent-[#FF5910] w-4.5 h-4.5 cursor-pointer rounded border-white/20"
                        checked={usePreviousInfo}
                        onChange={(e) => setUsePreviousInfo(e.target.checked)}
                      />
                      <label htmlFor="usePrev" className="text-xs font-semibold text-white/80 cursor-pointer select-none uppercase tracking-wider">
                        Same as last visit
                      </label>
                    </div>
                  </div>

                  {/* SECTION 1: PATIENT INFO (Always visible, pre-populated) */}
                  <div className="border border-white/10 rounded-lg bg-black/30 overflow-hidden font-sans">
                    <div className="bg-black/50 px-4 py-2 border-b border-white/10 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-widest">Section 1 — Patient Info</span>
                      <span className="text-[9px] font-mono text-[#00FF88] px-2 py-0.5 rounded bg-[#00FF88]/10 border border-[#00FF88]/20 tracking-wider">AUTO-POPULATED</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3.5">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Patient Name</label>
                        <input
                          type="text"
                          value={patientData.patient_name}
                          onChange={(e) => setPatientData({...patientData, patient_name: e.target.value})}
                          className="bg-black/60 border border-white/15 rounded-md px-3 py-2 text-sm focus:border-[#FF5910] focus:outline-none transition-colors text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Species / Breed</label>
                        <input
                          type="text"
                          value={patientData.species_breed}
                          onChange={(e) => setPatientData({...patientData, species_breed: e.target.value})}
                          className="bg-black/60 border border-white/15 rounded-md px-3 py-2 text-sm focus:border-[#FF5910] focus:outline-none transition-colors text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Age / Sex</label>
                        <input
                          type="text"
                          value={patientData.age_sex}
                          onChange={(e) => setPatientData({...patientData, age_sex: e.target.value})}
                          className="bg-black/60 border border-white/15 rounded-md px-3 py-2 text-sm focus:border-[#FF5910] focus:outline-none transition-colors text-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Weight</label>
                        <input
                          type="text"
                          value={patientData.weight}
                          onChange={(e) => setPatientData({...patientData, weight: e.target.value})}
                          className="bg-black/60 border border-white/15 rounded-md px-3 py-2 text-sm focus:border-[#FF5910] focus:outline-none transition-colors text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Sections container */}
                  {!usePreviousInfo && (
                    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-top-4 duration-300 font-sans">
                      {/* SECTION 2: LIFESTYLE */}
                      <div className="border border-white/10 rounded-lg bg-black/30 overflow-hidden">
                        <div className="bg-black/50 px-4 py-2 border-b border-white/10">
                          <span className="text-[10px] font-bold text-[#FF5910] uppercase tracking-widest">Section 2 — Lifestyle</span>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-3.5">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Food Brand & Flavor</label>
                              <input
                                type="text"
                                placeholder="e.g. Fancy Feast Salmon"
                                value={patientData.food_brand_flavor || ''}
                                onChange={(e) => setPatientData({...patientData, food_brand_flavor: e.target.value})}
                                className="bg-black/60 border border-white/15 rounded-md px-3 py-2 text-sm focus:border-[#FF5910] focus:outline-none transition-colors text-white placeholder-white/20"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Amount Per Meal</label>
                              <input
                                type="text"
                                placeholder="e.g. 1/2 can, 1/3 cup"
                                value={patientData.amount_per_meal || ''}
                                onChange={(e) => setPatientData({...patientData, amount_per_meal: e.target.value})}
                                className="bg-black/60 border border-white/15 rounded-md px-3 py-2 text-sm focus:border-[#FF5910] focus:outline-none transition-colors text-white placeholder-white/20"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Meals Per Day</label>
                            <div className="grid grid-cols-2 gap-2">
                              {['One', 'Two', 'Three', 'Leave food out all day'].map((opt) => (
                                <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer select-none text-[10px] font-bold uppercase tracking-wider transition-all ${patientData.meals_per_day === opt ? 'bg-[#FF5910]/15 border-[#FF5910] text-[#FF5910]' : 'bg-black/40 border-white/10 text-white/60 hover:bg-black/60'}`}>
                                  <input
                                    type="radio"
                                    name="mealsPerDay"
                                    checked={patientData.meals_per_day === opt}
                                    onChange={() => setPatientData({...patientData, meals_per_day: opt})}
                                    className="sr-only"
                                  />
                                  {opt === 'Leave food out all day' ? 'Free feed' : opt}
                                </label>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Current Medications & Supplements</label>
                            <textarea
                              rows={2}
                              placeholder="List any medications, supplements, or monthly injections..."
                              value={patientData.medications_supplements || ''}
                              onChange={(e) => setPatientData({...patientData, medications_supplements: e.target.value})}
                              className="bg-black/60 border border-white/15 rounded-md px-3 py-2 text-xs focus:border-[#FF5910] focus:outline-none transition-colors text-white placeholder-white/20 resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION 3: PREVENTATIVES */}
                      <div className="border border-white/10 rounded-lg bg-black/30 overflow-hidden">
                        <div className="bg-black/50 px-4 py-2 border-b border-white/10">
                          <span className="text-[10px] font-bold text-[#FF5910] uppercase tracking-widest">Section 3 — Preventatives</span>
                        </div>
                        <div className="p-4 flex flex-col gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Heartworm Prevention Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Revolution Plus"
                                value={patientData.heartworm_preventative_name || ''}
                                onChange={(e) => setPatientData({...patientData, heartworm_preventative_name: e.target.value})}
                                className="bg-black/60 border border-white/15 rounded-md px-3 py-2 text-sm focus:border-[#FF5910] focus:outline-none transition-colors text-white placeholder-white/20"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Missed any doses?</label>
                              <div className="flex gap-3">
                                {['No', 'Yes'].map((opt) => (
                                  <label key={opt} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border cursor-pointer select-none text-[10px] font-bold uppercase tracking-wider transition-all ${patientData.missed_heartworm_doses === opt ? (opt === 'No' ? 'bg-[#00FF88]/15 border-[#00FF88] text-[#00FF88]' : 'bg-red-500/15 border-red-500 text-red-400') : 'bg-black/40 border-white/10 text-white/60'}`}>
                                    <input
                                      type="radio"
                                      name="missedHeartworm"
                                      checked={patientData.missed_heartworm_doses === opt}
                                      onChange={() => setPatientData({...patientData, missed_heartworm_doses: opt})}
                                      className="sr-only"
                                    />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3.5">
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Flea / Tick Prevention Name</label>
                              <input
                                type="text"
                                placeholder="e.g. Revolution Plus"
                                value={patientData.flea_preventative_name || ''}
                                onChange={(e) => setPatientData({...patientData, flea_preventative_name: e.target.value})}
                                className="bg-black/60 border border-white/15 rounded-md px-3 py-2 text-sm focus:border-[#FF5910] focus:outline-none transition-colors text-white placeholder-white/20"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Missed any doses?</label>
                              <div className="flex gap-3">
                                {['No', 'Yes'].map((opt) => (
                                  <label key={opt} className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border cursor-pointer select-none text-[10px] font-bold uppercase tracking-wider transition-all ${patientData.missed_flea_doses === opt ? (opt === 'No' ? 'bg-[#00FF88]/15 border-[#00FF88] text-[#00FF88]' : 'bg-red-500/15 border-red-500 text-red-400') : 'bg-black/40 border-white/10 text-white/60'}`}>
                                    <input
                                      type="radio"
                                      name="missedFlea"
                                      checked={patientData.missed_flea_doses === opt}
                                      onChange={() => setPatientData({...patientData, missed_flea_doses: opt})}
                                      className="sr-only"
                                    />
                                    {opt}
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SECTION 4: VISIT DETAILS (Always visible) */}
                  <div className="border border-white/10 rounded-lg bg-black/30 overflow-hidden font-sans">
                    <div className="bg-black/50 px-4 py-2 border-b border-white/10">
                      <span className="text-[10px] font-bold text-[#00d4ff] uppercase tracking-widest">Section 4 — Visit Details</span>
                    </div>
                    <div className="p-4 flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Has your pet been to another clinic or the ER since last visit?</label>
                        <div className="flex gap-3">
                          {['No', 'Yes'].map((opt) => (
                            <label key={opt} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border cursor-pointer select-none text-[10px] font-bold uppercase tracking-wider transition-all ${patientData.visited_another_vet_er === opt ? (opt === 'No' ? 'bg-[#00FF88]/15 border-[#00FF88] text-[#00FF88]' : 'bg-red-500/15 border-red-500 text-red-400') : 'bg-black/40 border-white/10 text-white/60'}`}>
                              <input
                                type="radio"
                                name="visitedVetEr"
                                checked={patientData.visited_another_vet_er === opt}
                                onChange={() => setPatientData({...patientData, visited_another_vet_er: opt})}
                                className="sr-only"
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 border-t border-white/5 pt-3.5">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Date</label>
                          <input type="date" className="bg-black/60 border border-white/15 rounded-md p-2.5 text-sm focus:border-[#FF5910] focus:outline-none transition-colors text-white" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Time Preference</label>
                          <select className="bg-black/60 border border-white/15 rounded-md p-2.5 text-sm focus:border-[#FF5910] focus:outline-none transition-colors text-white/90">
                            <option>10:00 AM - 12:00 PM</option>
                            <option>1:00 PM - 3:00 PM</option>
                            <option>3:00 PM - 5:00 PM</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Priority Level</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['Low', 'Medium', 'High'].map((prio) => (
                            <label key={prio} className={`flex items-center justify-center py-2 rounded-md border cursor-pointer select-none text-[10px] font-bold uppercase tracking-wider transition-all ${prio === 'Low' ? 'border-white/10 text-white/60 hover:bg-black/40' : (prio === 'Medium' ? 'bg-[#FF5910]/15 border-[#FF5910] text-[#FF5910]' : 'border-red-500/30 text-red-400 hover:bg-red-500/10')}`}>
                              <input type="radio" name="priority" className="sr-only" defaultChecked={prio === 'Medium'} />
                              {prio}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5 mt-2">
                        <label className="text-[9px] font-bold text-white/40 uppercase tracking-wider">Clinical Notes (Reason for Visit)</label>
                        <textarea
                          rows={3}
                          placeholder="Describe the reason for this consultation..."
                          className="bg-black/60 border border-white/15 rounded-md p-3 text-xs focus:border-[#FF5910] focus:outline-none transition-colors text-white placeholder-white/20 resize-none"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="os-card-header px-6 py-4 flex items-center justify-end gap-3 border-t">
                  <button 
                    onClick={() => {
                      setIsConsultModalOpen(false);
                      setConsultSubmitState('idle');
                    }}
                    className="px-4 py-2 text-sm font-medium hover:bg-black/40 rounded-lg transition-colors text-white/70 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmitConsult}
                    disabled={consultSubmitState === 'submitting'}
                    className="bg-[#FF5910] text-white hover:bg-[#FF5910]/80 px-6 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                  >
                    {consultSubmitState === 'submitting' ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Submitting...</>
                    ) : 'Submit Request'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
