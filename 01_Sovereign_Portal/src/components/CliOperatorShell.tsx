import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Database, HelpCircle, RefreshCw, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface StackCI {
  key: string;
  name: string;
  domain: string;
  port: number;
  department: string;
  status: 'OPERATIONAL' | 'STANDBY';
}

const STACK_CIS: StackCI[] = [
  { key: 'aethervet', name: 'AetherVet', domain: 'ROOT', port: 8443, department: 'Medical Privacy', status: 'OPERATIONAL' },
  { key: 'gonzas_cantina', name: 'Gonzas Cantina', domain: 'ROOT', port: 3002, department: 'Cannabis Mfg', status: 'STANDBY' },
  { key: 'samtracker', name: 'SamTracker', domain: 'ROOT', port: 3004, department: 'Sports Silos', status: 'OPERATIONAL' },
  { key: 'anvil_twine', name: 'Anvil & Twine', domain: 'ROOT', port: 3006, department: 'System Admin', status: 'STANDBY' },
  { key: 'fanstack', name: 'FanStack', domain: 'ROOT', port: 3009, department: 'Sports Silos', status: 'OPERATIONAL' },
  { key: 'stacklabs', name: 'StackLabs LLC', domain: 'ROOT', port: 3000, department: 'System Admin', status: 'OPERATIONAL' },
  { key: 'spite_slice', name: 'Spite Slice', domain: 'ROOT', port: 3010, department: 'Cannabis Mfg', status: 'OPERATIONAL' },
  { key: 'catnip_wars', name: 'Catnip Wars', domain: 'ROOT', port: 7300, department: 'System Admin', status: 'OPERATIONAL' }
];

export default function CliOperatorShell() {
  const auth = useAuth();
  const username = auth?.user_name || 'james';

  const [cliInput, setCliInput] = useState('');
  const [entropyLevel, setEntropyLevel] = useState(1);
  const [cliHistory, setCliHistory] = useState<string[]>([
    'SOVEREIGN OPERATOR SHELL v2.0.0 - PROMOTED SECURE CORE',
    `Operator: ${username.toUpperCase()} (Node Authenticated)`,
    "Type 'help' for a list of available system commands.",
    ''
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load local entropy level if any
    const savedEntropy = localStorage.getItem('sovereign_entropy_level');
    if (savedEntropy) {
      setEntropyLevel(parseInt(savedEntropy) || 1);
    }
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cliHistory]);

  const routeGateway = (stackKey: string) => {
    const target = STACK_CIS.find(ci => ci.key === stackKey);
    if (!target) return;
    
    window.dispatchEvent(new CustomEvent('NavigateRoom', {
      detail: { domain: target.domain, room: target.key }
    }));
  };

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim()) return;

    const command = cliInput.trim();
    const args = command.split(' ');
    const mainCommand = args[0].toLowerCase();
    
    const newHistory = [...cliHistory, `${username}@clio:~$ ${command}`];

    switch (mainCommand) {
      case 'help':
        newHistory.push(
          'Available commands:',
          '  help             - Print this directory of command items',
          '  list             - Query CMDB and print active configuration items',
          '  jump <ci_name>   - Route portal gateway to stack CI (e.g. jump fanstack)',
          '  status           - Print telemetry node diagnostics',
          '  entropy <level>  - Set local system entropy scale (1-11)',
          '  clear            - Purge terminal buffer lines'
        );
        break;

      case 'list':
        newHistory.push(
          '+----------------------+------+-------------+-----------------+',
          '| Configuration Item   | Port | Status      | Department      |',
          '+----------------------+------+-------------+-----------------+',
          ...STACK_CIS.map(ci => 
            `| ${ci.key.padEnd(20)} | ${ci.port.toString().padEnd(4)} | ${(ci.status === 'OPERATIONAL' ? 'OPERATIONAL' : 'STANDBY').padEnd(11)} | ${ci.department.padEnd(15)} |`
          ),
          '+----------------------+------+-------------+-----------------+'
        );
        break;

      case 'status':
        newHistory.push(
          'SYSTEM STATUS DIAGNOSTICS:',
          `  OPERATOR: ${username.toUpperCase()} (Node: @james)`,
          '  M.A.R.D ENGINE: ONLINE / NOMINAL',
          '  SQLITE DB: /home/james/SovereignOS/dna/sovereign_now.db',
          `  ENTROPY SCALE: LEVEL ${entropyLevel} / 11`,
          '  TELEMETRY CONNECTIONS: 8 ACTIVE HOPS',
          '  ROUTING INVARIANT: TAILSCALE MagicDNS TUNNEL SECURED'
        );
        break;

      case 'jump':
        if (!args[1]) {
          newHistory.push('Usage: jump <ci_name>  (e.g. jump fanstack)');
        } else {
          const targetKey = args[1].toLowerCase();
          const target = STACK_CIS.find(ci => ci.key === targetKey || ci.name.toLowerCase() === targetKey);
          if (target) {
            newHistory.push(`Gateway authorized. Launching telepresence connection to Port ${target.port}...`);
            setTimeout(() => {
              routeGateway(target.key);
            }, 800);
          } else {
            newHistory.push(`✗ CMDB Lookup Failed: CI "${args[1]}" not found.`);
          }
        }
        break;

      case 'entropy':
        const levelNum = parseInt(args[1]);
        if (isNaN(levelNum) || levelNum < 1 || levelNum > 11) {
          newHistory.push('Usage: entropy <1-11>');
        } else {
          setEntropyLevel(levelNum);
          localStorage.setItem('sovereign_entropy_level', levelNum.toString());
          newHistory.push(`✓ Local entropy level adjusted to ${levelNum}.`);
        }
        break;

      case 'clear':
        setCliHistory([]);
        setCliInput('');
        return;

      default:
        newHistory.push(`sh: command not found: ${mainCommand}. Type 'help' for commands.`);
    }

    newHistory.push(''); // add spacer line
    setCliHistory(newHistory);
    setCliInput('');
  };

  return (
    <div className="h-[80vh] w-full flex flex-col p-6 bg-[#04060C] text-[#C5C6C7] font-mono overflow-hidden rounded-2xl border border-[#00b4d8]/20 shadow-[0_0_30px_rgba(0,180,216,0.05)]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#0b0d13] border border-[#00b4d8]/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,180,216,0.15)]">
            <Terminal className="w-5 h-5 text-[#00b4d8]" />
          </div>
          <div>
            <h1 className="text-white uppercase font-black tracking-widest text-lg flex items-center gap-2">
              CLI Operator Shell <span className="text-[10px] bg-[#00FF88]/20 text-[#00FF88] border border-[#00FF88]/40 px-1.5 py-0.5 rounded-full font-normal tracking-normal uppercase">Active</span>
            </h1>
            <p className="text-[9px] text-slate-500 uppercase tracking-wider">Secure platform shell interface for CMDB CI telepresence & entropy audit</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[9px] bg-slate-950/80 border border-white/5 px-3 py-1.5 rounded">
          <Database className="w-3.5 h-3.5 text-[#00b4d8]" />
          <span>LEDGER: </span>
          <span className="text-emerald-400 font-bold">CONNECTED</span>
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="flex-1 flex flex-col bg-black/80 rounded-xl border border-white/10 p-5 overflow-hidden relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
        
        {/* Overlay info */}
        <div className="absolute top-4 right-4 text-[9px] text-[#00b4d8]/60 bg-black/60 px-2.5 py-1 border border-[#00b4d8]/20 rounded-md select-none font-bold tracking-widest">
          CLIO HOST AUTHENTICATED
        </div>

        {/* History buffer */}
        <div className="flex-1 overflow-y-auto mb-4 flex flex-col gap-1 pr-2 select-text scrollbar-thin scrollbar-thumb-slate-800">
          {cliHistory.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap leading-relaxed min-h-[1.2em] text-[#00b4d8]">
              {line.startsWith(`${username}@clio:~$`) ? (
                <span className="text-white">{line}</span>
              ) : line.includes('Usage:') || line.includes('✗') ? (
                <span className="text-rose-400">{line}</span>
              ) : line.includes('✓') ? (
                <span className="text-emerald-400">{line}</span>
              ) : (
                line
              )}
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* CLI Form */}
        <form onSubmit={handleCliSubmit} className="flex border-t border-white/10 pt-3 shrink-0 items-center">
          <span className="text-[#38bdf8] mr-2 shrink-0 select-none font-bold">{username}@clio:~$</span>
          <input 
            type="text"
            value={cliInput}
            onChange={(e) => setCliInput(e.target.value)}
            className="flex-grow bg-transparent border-none outline-none text-white font-mono text-sm focus:ring-0 p-0"
            placeholder="Type 'help' to begin..."
            autoFocus
          />
        </form>

      </div>

    </div>
  );
}
