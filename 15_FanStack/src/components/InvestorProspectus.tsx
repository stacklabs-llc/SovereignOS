import React from 'react';
import { ShieldCheck, Activity, Database, Key, Server, ChevronRight, Video, FileText, Network, DollarSign, Cpu, Clock, Map, Target } from 'lucide-react';

interface InvestorProspectusProps {
  onEnterPortal: () => void;
  onEnterAetherVet?: () => void;
  onEnterFanStack?: () => void;
  onEnterSamTracker?: () => void;
}

export default function InvestorProspectus({ onEnterPortal, onEnterAetherVet, onEnterFanStack, onEnterSamTracker }: InvestorProspectusProps) {
  return (
    <div className="min-h-screen w-full bg-[#0B0E14] text-white font-sans flex flex-col overflow-y-auto selection:bg-[#38bdf8] selection:text-white pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#38bdf8]/10 blur-[150px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIvPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDIpIi8+Cjwvc3ZnPg==')] z-0 opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full px-8 pt-16">
        
        {/* Header */}
        <header className="mb-16 border-b border-white/10 pb-8 flex items-end justify-between">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-12 h-12 text-[#38bdf8]" />
            <div>
              <h1 className="text-4xl font-black tracking-widest uppercase mb-1">Sovereign OS</h1>
              <p className="text-sm text-[#38bdf8] font-mono tracking-widest uppercase">Confidential Investor Prospectus</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/40 font-mono uppercase tracking-widest mb-1">Prepared For</div>
            <div className="text-lg font-bold tracking-wider">Pawel Rudnicki</div>
          </div>
        </header>

        <div className="space-y-16">
          
          {/* Executive Summary & Valuation */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-xl flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign className="w-48 h-48 text-[#38bdf8]" />
              </div>
              <h2 className="text-sm font-bold text-white/90 tracking-widest uppercase mb-6 flex items-center gap-2"><FileText className="w-4 h-4 text-[#38bdf8]"/> Enterprise Valuation</h2>
              <div className="text-7xl font-light tracking-tight text-white mb-6">$46,600,000</div>
              <div className="text-sm text-white/80 font-medium space-y-2 font-mono leading-relaxed">
                <p><span className="text-white/60">Pillar 1:</span> Sovereign OS (Bare-Metal AI Orchestration)</p>
                <p><span className="text-white/60">Pillar 2:</span> FanStack (Sports Telemetry & Content Engine)</p>
                <p><span className="text-white/60">Pillar 3:</span> GardenStack (Agricultural Telemetry)</p>
                <p><span className="text-white/60">Pillar 4:</span> Aether Vet (Bio-Spatial Horizon Protocol)</p>
                <p className="text-[#38bdf8] font-bold mt-4 pt-4 border-t border-white/10">CURRENT ROUND: $1.8M SEED</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-xl flex flex-col gap-6">
              <h2 className="text-sm font-bold text-white/90 tracking-widest uppercase flex items-center gap-2"><Network className="w-4 h-4 text-[#38bdf8]"/> Strategic Advantage</h2>
              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#38bdf8]"></div> Sovereign OS</h3>
                <p className="text-sm text-white/80 font-medium leading-relaxed pl-3.5">
                  Sovereign OS creates a significant market lead through massive compute efficiency and localized LLM deployment. It eliminates dependency on cloud providers, ensuring absolute data privacy and zero recurring token costs.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> FanStack Content Engine & Persona Matrix</h3>
                <p className="text-sm text-white/80 font-medium leading-relaxed pl-3.5">
                  Currently scaling from a single autonomous agent to a massive 30-team MLB deployment. The FanStack engine utilizes real-time telemetry to feed hyper-authentic, emotional AI personas, generating automated sports commentary and establishing passive income streams via social media monetization.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> GardenStack Telemetry</h3>
                <p className="text-sm text-white/80 font-medium leading-relaxed pl-3.5 mb-3">
                  Proprietary agricultural mesh network currently deployed. Utilizing IoT edge nodes to monitor environmental variables, optimize growth cycles, and maximize high-yield agricultural outputs autonomously.
                </p>
                <p className="text-sm text-white/80 font-medium leading-relaxed pl-3.5 border-l-2 border-emerald-500/50 ml-3.5 pl-4">
                  <strong className="text-emerald-400 font-bold">The Edge Advantage:</strong> Unlike bloated, cloud-dependent competitors like NetSuite, inecta, and TraceX, GardenStack executes 100% locally on bare metal. It is completely immune to catastrophic AWS outages. When their cloud goes down, our crops keep growing.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div> Aether Vet (The Horizon Protocol)</h3>
                <p className="text-sm text-white/80 font-medium leading-relaxed pl-3.5 mb-3">
                  The future R&D vector for Sovereign OS. Aether Vet utilizes decentralized, local-first IoT endpoints to generate autonomous geospatial perimeters and biological telemetry mapping.
                </p>
                <p className="text-sm text-white/80 font-medium leading-relaxed pl-3.5 border-l-2 border-cyan-500/50 ml-3.5 pl-4">
                  <strong className="text-cyan-400 font-bold">The Metsy Protocol:</strong> Proven via a 2-year live black-ops case study mapping apex predator territorial nodes ("Thrones") using GPS collar data ingested entirely on bare-metal hardware. Aether Vet proves the extreme scalability of the Sovereign Mesh into livestock optimization, security asset tracking, and pharmaceutical-grade biological compliance without exposing a single packet to the corporate cloud.
                </p>
              </div>
            </div>
          </section>

          {/* The Thermodynamic Moat */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-10 backdrop-blur-sm shadow-xl">
            <h2 className="text-sm font-bold text-white/90 tracking-widest uppercase mb-10 flex items-center justify-center gap-2 text-center">
              <Activity className="w-5 h-5 text-emerald-500" /> The Thermodynamic Moat
            </h2>
            
            <div className="flex items-end justify-center gap-16 h-64 border-b border-white/10 pb-8">
              <div className="flex flex-col items-center gap-4 w-64">
                <span className="text-3xl font-bold text-emerald-500">$0 / day</span>
                <div className="w-full bg-emerald-500/20 border border-emerald-500 rounded-t-sm h-8 relative group flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-emerald-400 font-bold">Fixed CapEx Only</div>
                </div>
                <span className="text-sm text-white/90 text-center uppercase tracking-wider font-bold">Local Compute<br/><span className="text-xs text-white/60 font-mono">(Sovereign OS)</span></span>
              </div>
              
              <div className="flex flex-col justify-end h-full opacity-50 pb-16">
                <div className="text-xs font-mono tracking-widest text-white/30 uppercase">VS</div>
              </div>

              <div className="flex flex-col items-center gap-4 w-64">
                <span className="text-3xl font-bold text-orange-500">$50,000 / day</span>
                <div className="w-full bg-orange-500 rounded-t-sm h-40 shadow-[0_0_30px_rgba(249,115,22,0.2)] relative group flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity text-sm font-mono text-white font-bold">SaaS API Taxes</div>
                </div>
                <span className="text-sm text-white/90 text-center uppercase tracking-wider font-bold">Cloud Compute<br/><span className="text-xs text-white/60 font-mono">(AWS / GCP / OpenAI)</span></span>
              </div>
            </div>
            <div className="mt-8 text-center text-sm text-white/80 font-medium max-w-2xl mx-auto leading-relaxed">
              By shifting AI inference to local edge hardware, Sovereign OS escapes the API billing trap that bankrupts modern AI startups and provides absolute immunity to systemic AWS outages. The hardware pays for itself within the first 72 hours of operation.
            </div>
          </section>

          {/* The Autonomous Media Empire (FanStack Scale-Up) */}
          <section className="bg-white/5 border border-purple-500/30 rounded-2xl p-10 backdrop-blur-sm shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Network className="w-64 h-64 text-purple-500" />
            </div>
            <h2 className="text-sm font-bold text-purple-400 tracking-widest uppercase mb-6 flex items-center gap-2 relative z-10">
              <Activity className="w-5 h-5" /> The Autonomous Media Empire (FanStack Scale-Up)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
              <div className="bg-black/40 border border-white/10 rounded-xl p-6">
                <h3 className="font-bold text-white mb-3 text-lg">1. The Strategy</h3>
                <p className="text-sm text-white/80 font-medium leading-relaxed">
                  Aggressive daily rollout of 30 autonomous, highly opinionated AI personas—bringing one new entity online every single day until every Major League Baseball team is represented in the swarm.
                </p>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-xl p-6 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <h3 className="font-bold text-emerald-400 mb-3 text-lg flex items-center gap-2"><DollarSign className="w-4 h-4" /> 2. The Revenue Engine</h3>
                <p className="text-sm text-white/80 font-medium leading-relaxed">
                  Personas autonomously generate "Flow Videos" leveraging live sports telemetry. These assets are posted directly to YouTube and TikTok, transforming high-volume engagement and clicks into direct, passive ad revenue.
                </p>
              </div>
              <div className="bg-black/40 border border-purple-500/50 rounded-xl p-6 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <h3 className="font-bold text-purple-400 mb-3 text-lg">3. The Infrastructure</h3>
                <p className="text-sm text-white/80 font-medium leading-relaxed">
                  Acquiring Premium X (Twitter) subscriptions for all 30 personas. This critical OpEx ensures algorithm prioritization, bypasses rate limits, and guarantees maximum organic reach across the platform.
                </p>
              </div>
            </div>
          </section>

          {/* Capital Allocation & Proceeds */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-[#38bdf8]" />
                <h3 className="text-sm font-bold text-white/90 tracking-widest uppercase">Projected Runway</h3>
              </div>
              <div className="text-4xl font-light mb-6">18-24 MONTHS</div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden flex">
                <div className="bg-[#38bdf8] w-[25%] h-full relative">
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
                <div className="bg-emerald-500 w-[75%] h-full opacity-30"></div>
              </div>
              <div className="text-xs text-white/40 mt-4 flex justify-between font-mono">
                <span>Current Cash Flow</span>
                <span>OpEx Target</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-6">
                <Cpu className="w-5 h-5 text-emerald-500" />
                <h3 className="text-sm font-bold text-white/90 tracking-widest uppercase">Use of Proceeds</h3>
              </div>
              <div className="text-sm font-bold text-white/80 mb-4 tracking-wide">CAPITAL DEPLOYMENT MATRIX ($1.8M SEED)</div>
              <ul className="space-y-3 text-sm text-white/80 font-mono font-medium">
                <li className="flex justify-between border-b border-white/5 pb-2 hover:text-white transition-colors"><span>Compute Clusters:</span> <span className="text-white/90">$900K</span></li>
                <li className="flex justify-between border-b border-white/5 pb-2 hover:text-white transition-colors"><span>Edge Nodes (Argus/Garden):</span> <span className="text-white/90">$400K</span></li>
                <li className="flex justify-between border-b border-white/5 pb-2 hover:text-white transition-colors"><span>Thermal & Power Systems:</span> <span className="text-white/90">$250K</span></li>
                <li className="flex justify-between border-b border-white/5 pb-2 hover:text-white transition-colors"><span>Network Infra (COMB):</span> <span className="text-white/90">$200K</span></li>
                <li className="flex justify-between hover:text-purple-400 transition-colors"><span>Social Infra (X Premium):</span> <span className="text-purple-400 font-bold">$50K</span></li>
              </ul>
            </div>
          </section>

          {/* Live System Demonstration */}
          <section className="bg-black/40 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-sm font-bold text-white/90 tracking-widest uppercase mb-8 flex items-center justify-center gap-2 text-center">
              <Server className="w-5 h-5 text-[#38bdf8]" /> Live Mesh Demonstration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calvin Feed */}
              <div className="bg-[#0b0c10] border-2 border-[#1f2833] rounded-lg overflow-hidden flex flex-col group">
                <div className="bg-[#1f2833] py-2 px-4 border-b border-[#38bdf8]/30 flex justify-between items-center">
                  <span className="font-bold text-sm text-[#38bdf8] uppercase tracking-wider flex items-center gap-2">
                    <Video className="w-4 h-4" /> CALVIN NODE
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] tracking-widest font-mono text-[#38bdf8]">TAILSCALE: calvin</span>
                  </div>
                </div>
                <div className="relative aspect-video flex items-center justify-center bg-black">
                  <img 
                    src="/cam-proxy/calvin/cam/0" 
                    alt="Calvin Node"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                    }}
                  />
                  <div className="fallback hidden absolute inset-0 flex flex-col items-center justify-center text-[#38bdf8]/50 gap-2 font-mono text-xs tracking-widest">
                    <Video className="w-8 h-8 mb-2 opacity-50" />
                    SIGNAL PENDING...
                  </div>
                </div>
              </div>

              {/* Argo Feed */}
              <div className="bg-[#0b0c10] border-2 border-[#1f2833] rounded-lg overflow-hidden flex flex-col group">
                <div className="bg-[#1f2833] py-2 px-4 border-b border-[#a855f7]/30 flex justify-between items-center">
                  <span className="font-bold text-sm text-[#a855f7] uppercase tracking-wider flex items-center gap-2">
                    <Video className="w-4 h-4" /> ARGO NODE
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] tracking-widest font-mono text-[#a855f7]">TAILSCALE: argo</span>
                  </div>
                </div>
                <div className="relative aspect-video flex items-center justify-center bg-black">
                  <img 
                    src="/cam-proxy/argo/cam/0" 
                    alt="Argo Node"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
                    }}
                  />
                  <div className="fallback hidden absolute inset-0 flex flex-col items-center justify-center text-[#a855f7]/50 gap-2 font-mono text-xs tracking-widest">
                    <Video className="w-8 h-8 mb-2 opacity-50" />
                    SIGNAL PENDING...
                  </div>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-white/70 font-mono mt-6 font-bold tracking-wider">Active Argus Nexus telemetry streams via direct Tailscale routing.</p>
          </section>

          {/* Aether Vet Case Study */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-10 backdrop-blur-sm shadow-xl">
            <h2 className="text-sm font-bold text-white/90 tracking-widest uppercase mb-10 flex items-center justify-center gap-2 text-center">
              <Activity className="w-5 h-5 text-cyan-500" /> Case Study: The Metsy Protocol (Aether Vet)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0b0c10] border-2 border-[#1f2833] rounded-lg overflow-hidden flex flex-col group">
                <div className="bg-[#1f2833] py-2 px-4 border-b border-cyan-500/30 flex justify-between items-center">
                  <span className="font-bold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Map className="w-4 h-4" /> B2B CLINIC DIAGNOSTICS
                  </span>
                </div>
                <div className="relative aspect-video flex items-center justify-center bg-black">
                  <img 
                    src="/aether_assets/tech_tablet_portal_mockup_1774766115503.png" 
                    alt="Aether Vet Portal"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="bg-[#0b0c10] border-2 border-[#1f2833] rounded-lg overflow-hidden flex flex-col group">
                <div className="bg-[#1f2833] py-2 px-4 border-b border-cyan-500/30 flex justify-between items-center">
                  <span className="font-bold text-sm text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4" /> SUBCLINICAL TRANSLATION (CTP)
                  </span>
                </div>
                <div className="relative aspect-video flex items-center justify-center bg-black">
                  <img 
                    src="/aether_assets/telepresence_vet_mockup_1774766349214.png" 
                    alt="Aether Vet Telepresence"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-white/70 font-mono mt-6 font-bold tracking-wider">Enterprise early-warning API integration identifying micro-regressions 6-12 months before visual detection.</p>
          </section>

          {/* Appendix A: Local LLM Strategy */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-10 backdrop-blur-sm shadow-xl">
            <h2 className="text-sm font-bold text-white/90 tracking-widest uppercase mb-6 flex items-center gap-2">
              <Database className="w-5 h-5 text-[#38bdf8]" /> Appendix A: Local LLM Capabilities
            </h2>
            <div className="space-y-4 text-sm text-white/80 font-medium leading-relaxed">
              <p>
                Sovereign OS utilizes local inference engines (Dolphin/Llama-3) running on bare-metal hardware. While full pre-training is mathematically unviable on edge infrastructure, we employ two distinct methodologies for "Local LLM Enhancement":
              </p>
              <ul className="list-disc pl-5 space-y-2 text-white/70">
                <li><strong className="text-white">RAG (Retrieval-Augmented Generation):</strong> Used for factual recall. Sovereign OS DNA is indexed into a local Vector Database, allowing the LLM to pull live context dynamically without retraining weights.</li>
                <li><strong className="text-white">QLoRA Fine-Tuning:</strong> Used for behavioral conditioning. Using frameworks like Unsloth, base models are fine-tuned via Low-Rank Adaptation (LoRA) to bake specific personas directly into the neural network.</li>
              </ul>
              <p className="mt-4 border-l-2 border-[#38bdf8] pl-4 text-xs font-mono text-[#38bdf8]">
                Current Hardware Assessment: Heavy LoRA fine-tuning workflows are currently gated pending the deployment of multi-GPU compute clusters (Phase 2 Capital Deployment). RAG is fully operational.
              </p>
            </div>
          </section>

          {/* Appendix B: Hardware Scaling & Edge Compute Roadmap */}
          <section className="bg-white/5 border border-white/10 rounded-2xl p-10 backdrop-blur-sm shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
              <h2 className="text-sm font-bold text-white/90 tracking-widest uppercase flex items-center gap-2">
                <Server className="w-5 h-5 text-[#38bdf8]" /> Appendix B: Hardware Capitalization
              </h2>
              <a 
                href="/docs/Sovereign_OS_Hardware_Investment_Appendix.pdf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/30 text-[#38bdf8] px-4 py-2 rounded-lg transition-all text-xs font-bold tracking-widest uppercase"
              >
                <FileText className="w-4 h-4" /> Download Prospectus PDF
              </a>
            </div>
            <div className="space-y-4 text-sm text-white/80 font-medium leading-relaxed">
              <p>
                To achieve absolute Cloud-Immunity, Zero-Latency, and complete Data Sovereignty, Sovereign OS is transitioning intelligence pipelines from cloud-dependent APIs (like Google Gemini) to on-premises Edge AI.
              </p>
              <p>
                This hardware capitalization strategy outlines the acquisition of enterprise-tier silicon (NVIDIA RTX 4090 / Mac Studio M2 Ultra clusters) to run heavy-weight, open-weights models locally. This eliminates massive recurring API token costs and ensures critical data privacy for enterprise clients.
              </p>
            </div>
          </section>

          {/* Appendix C: Live Operations Traction */}
          <section className="bg-white/5 border border-purple-500/30 rounded-2xl p-10 backdrop-blur-sm shadow-xl relative overflow-hidden">
            <h2 className="text-sm font-bold text-purple-400 tracking-widest uppercase mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" /> Appendix C: Live Operations Traction
            </h2>
            <div className="space-y-4 text-sm text-white/80 font-medium leading-relaxed">
              <p>
                The FanStack multi-persona orchestration engine has proven its massive algorithmic viability during live MLB broadcasts. By synchronizing multiple specialized AI agents to react to high-leverage anomalies in real-time, the system creates highly organic, algorithmic traction.
              </p>
              <div className="bg-black/40 border border-purple-500/20 rounded-xl p-6 mt-4">
                <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Live Validation: Subway Series 2026</h3>
                <p className="text-sm text-white/70 mb-6">
                  During a pivotal walk-off home run by Tyrone Taylor, the FanStack swarm instantly ingested the Statcast telemetry anomaly (404ft exit velocity) and successfully executed a synchronized, multi-persona reaction matrix. This immediate deployment bypasses standard human latency and establishes high-value engagement across digital platforms.
                </p>
                <div className="flex gap-4 flex-wrap">
                  <a href="https://x.com/SFanstack" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-bold text-xs uppercase tracking-widest bg-purple-500/10 px-4 py-2 rounded border border-purple-500/20">
                    <Activity className="w-4 h-4" /> @SFanstack
                  </a>
                  <a href="https://x.com/BarfFanStack" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors font-bold text-xs uppercase tracking-widest bg-emerald-500/10 px-4 py-2 rounded border border-emerald-500/20">
                    <Target className="w-4 h-4" /> @BarfFanStack
                  </a>
                  <a href="/media_vault/01_Ingest/Snipe_1779068903.mp4" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[#38bdf8] hover:text-[#38bdf8]/80 transition-colors font-bold text-xs uppercase tracking-widest bg-[#38bdf8]/10 px-4 py-2 rounded border border-[#38bdf8]/20 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                    <Video className="w-4 h-4 animate-pulse" /> Watch Live Validation
                  </a>
                </div>
              </div>
              <div className="bg-black/40 border border-emerald-500/20 rounded-xl p-6 mt-4 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <h3 className="font-bold text-emerald-400 mb-4 text-sm uppercase tracking-widest flex items-center gap-2"><Target className="w-4 h-4" /> Turing Test Validation: The "Dead Internet" Incident</h3>
                <p className="text-sm text-white/70 mb-6">
                  The Sovereign Swarm has achieved such high-fidelity emotional resonance that real users are actively debating the automated personas. The Barf Persona (programmed for inescapable sports misery) successfully baited real humans into composing structured, multi-point logical rebuttals and throwing vulgar insults at the AI dog. The Turing test has been effectively bypassed, proving the system's capability to organically farm massive algorithmic engagement via pure simulated outrage without direct human intervention.
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="flex justify-center gap-6 pt-8 flex-wrap">
            <button 
              onClick={onEnterPortal}
              className="group flex items-center gap-4 bg-[#10b981]/20 hover:bg-[#10b981]/30 border border-[#10b981]/50 text-[#10b981] px-8 py-4 rounded-xl transition-all font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)]"
            >
              Enter Live WeedStack Farm
              <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
            <button 
              onClick={onEnterFanStack}
              className="group flex items-center gap-4 bg-[#e879f9]/20 hover:bg-[#e879f9]/30 border border-[#e879f9]/50 text-[#e879f9] px-8 py-4 rounded-xl transition-all font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(232,121,249,0.2)] hover:shadow-[0_0_50px_rgba(232,121,249,0.4)]"
            >
              Enter FanStack Portal
              <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
            <button 
              onClick={onEnterAetherVet}
              className="group flex items-center gap-4 bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 border border-[#38bdf8]/50 text-[#38bdf8] px-8 py-4 rounded-xl transition-all font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(56,189,248,0.2)] hover:shadow-[0_0_50px_rgba(56,189,248,0.4)]"
            >
              Enter Aether Vet Portal
              <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
            <button 
              onClick={onEnterSamTracker}
              className="group flex items-center gap-4 bg-[#fbbf24]/20 hover:bg-[#fbbf24]/30 border border-[#fbbf24]/50 text-[#fbbf24] px-8 py-4 rounded-xl transition-all font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(251,191,36,0.2)] hover:shadow-[0_0_50px_rgba(251,191,36,0.4)]"
            >
              Enter SamTracker
              <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
