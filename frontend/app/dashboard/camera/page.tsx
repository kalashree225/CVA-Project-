"use client";

import { useEffect, useState, useRef } from "react";
import { Camera, Shield, Activity, Maximize2, RefreshCw, Cpu, Zap, Crosshair, AlertTriangle, Terminal, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function CameraPage() {
  const [isLive, setIsLive] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [status, setStatus] = useState("Synchronized");
  const videoRef = useRef<HTMLImageElement>(null);

  // Simulated AI metadata
  const [threatLevel, setThreatLevel] = useState("Low");
  const [fps, setFps] = useState(24);

  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(Math.random() * (26 - 22 + 1) + 22));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
              <Camera className="h-7 w-7 text-primary" />
           </div>
           <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic text-foreground">
                 Sentinel <span className="text-primary">Intelligence</span> Feed
              </h1>
              <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em] mt-1 italic">Real-time Neural Acquisition // System Active</p>
           </div>
        </div>

        <div className="flex items-center gap-4">
           <div className="flex items-center gap-3 px-6 py-2.5 rounded-2xl bg-black/40 border border-white/5 shadow-2xl">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,1)]" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">{status}</span>
           </div>
           <Button variant="outline" size="sm" className="h-11 px-6 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest gap-2">
             <RefreshCw className="h-3.5 w-3.5" /> Force Sync
           </Button>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
         {/* Camera Viewport */}
         <div className="xl:col-span-3 space-y-6">
            <div className="relative aspect-video bg-[#050505] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
               {!hasError ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/camera/stream`} 
                    alt="Sentinel Stream"
                    onError={() => setHasError(true)}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-1000"
                  />
               ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-3xl gap-6">
                     <AlertTriangle className="h-16 w-16 text-rose-500 animate-pulse" />
                     <div className="text-center space-y-2">
                        <p className="text-xl font-black uppercase tracking-widest text-foreground italic">Hardware Sync Failed</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Check Backend Connectivity // Ensure Camera is not in use</p>
                     </div>
                     <Button 
                       variant="outline" 
                       size="sm" 
                       className="mt-4 h-11 px-8 rounded-2xl border-primary/20 text-primary hover:bg-primary/5 text-[10px] font-black uppercase tracking-widest"
                       onClick={() => setHasError(false)}
                     >
                       <RefreshCw className="h-4 w-4 mr-2" /> Attempt Re-acquisition
                     </Button>
                  </div>
               )}

               {/* Overlays */}
               <div className="absolute inset-0 pointer-events-none">
                  {/* Scanning Line */}
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/20 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-scan" />
                  
                  {/* Digital Vignette */}
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
                  <div className="absolute inset-0 bg-primary/5 opacity-20 digital-grid" />
               </div>

               {/* HUD Elements - High Fidelity */}
               <div className="absolute top-8 left-8 flex flex-col gap-4">
                  <HUDItem icon={<Crosshair className="h-3 w-3" />} label="ACQUISITION ACTIVE" />
                  <HUDItem icon={<Terminal className="h-3 w-3" />} label={`SYNC_FREQ: ${fps} FPS`} />
                  <HUDItem icon={<Layers className="h-3 w-3" />} label="VECTOR_SPACE_3D" />
               </div>

               <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
                  <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 flex flex-col items-end">
                     <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Buffer Status</span>
                     <span className="text-xs font-black text-emerald-500 italic uppercase">Optimized</span>
                  </div>
                  <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full w-4/5 bg-primary animate-pulse" />
                  </div>
               </div>

               {/* Center Targeting Reticle */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-primary/20 rounded-full pointer-events-none">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-[1px] bg-primary/60" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-4 w-[1px] bg-primary/60" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-primary/60" />
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-[1px] bg-primary/60" />
                  
                  <div className="absolute inset-12 border border-primary/10 rounded-full animate-ping opacity-20" />
               </div>

               <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                  <div className="flex gap-4">
                     <ControlIndicator label="Neural Core" active />
                     <ControlIndicator label="Hardware Link" active />
                     <ControlIndicator label="Encryption" active />
                  </div>
                  <button className="h-14 w-14 rounded-2xl bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all group/btn shadow-2xl">
                     <Maximize2 className="h-6 w-6 group-hover/btn:scale-110 transition-transform" />
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
               <FeedMetric label="Signal Strength" value="98%" trend="Optimal" />
               <FeedMetric label="Bitrate" value="14.2 Mbps" trend="Nominal" />
               <FeedMetric label="Packet Loss" value="0.002%" trend="Stable" />
            </div>
         </div>

         {/* Sidebar Controls */}
         <div className="space-y-6">
            <div className="creative-card bg-black/40 border-white/5 p-8 shadow-2xl">
               <div className="flex items-center gap-3 mb-8">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest italic">Threat <span className="text-primary">Profile</span></h3>
               </div>
               <div className="space-y-8">
                  <div>
                     <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Detection Status</p>
                     <p className={cn(
                        "text-2xl font-black italic tracking-tighter",
                        threatLevel === "Low" ? "text-emerald-500" : "text-rose-500"
                     )}>{threatLevel.toUpperCase()} RISK DETECTED</p>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full w-1/4 bg-primary shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  </div>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5 font-mono text-[9px] text-muted-foreground leading-relaxed italic">
                     Behavioral baseline synchronized. No neural anomalies detected in current acquisition window.
                  </div>
               </div>
            </div>

            <div className="creative-card bg-black/40 border-white/5 p-8 shadow-2xl">
               <div className="flex items-center gap-3 mb-6">
                  <Cpu className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-black uppercase tracking-widest italic">Hardware <span className="text-primary">Ops</span></h3>
               </div>
               <div className="space-y-4">
                  <HardwareRow label="Camera ID" value="SENT_01_HD" />
                  <HardwareRow label="Aperture" value="F/1.8_AUTO" />
                  <HardwareRow label="Focal Length" value="35MM_FIX" />
                  <HardwareRow label="Neural_TPU" value="ACTIVE" color="text-primary" />
               </div>
            </div>

            <button className="w-full h-24 rounded-[2rem] bg-primary p-1 relative group overflow-hidden shadow-2xl shadow-primary/20">
               <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
               <div className="h-full w-full rounded-[1.8rem] border border-white/20 flex flex-col items-center justify-center gap-1">
                  <Zap className="h-6 w-6 text-primary-foreground group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-primary-foreground">Execute Protocol</span>
               </div>
            </button>
         </div>
      </div>
    </div>
  );
}

function HUDItem({ icon, label }: any) {
  return (
    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 flex items-center gap-3 shadow-2xl">
       <div className="text-primary animate-pulse">{icon}</div>
       <span className="text-[10px] font-mono text-white font-black tracking-[0.2em]">{label}</span>
    </div>
  )
}

function ControlIndicator({ label, active }: any) {
  return (
    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
       <div className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-primary shadow-[0_0_5px_rgba(16,185,129,1)]" : "bg-white/20")} />
       <span className="text-[8px] font-black uppercase text-white/60 tracking-widest">{label}</span>
    </div>
  )
}

function FeedMetric({ label, value, trend }: any) {
  return (
    <div className="creative-card p-6 bg-black/20 border-white/5 flex flex-col items-center text-center group hover:bg-white/5 transition-colors">
       <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">{label}</p>
       <p className="text-xl font-black italic tracking-tighter uppercase mb-1 group-hover:text-primary transition-colors">{value}</p>
       <span className="text-[8px] font-black uppercase text-emerald-500/60 tracking-tighter">{trend}</span>
    </div>
  )
}

function HardwareRow({ label, value, color = "text-muted-foreground" }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
       <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{label}</span>
       <span className={cn("text-[10px] font-mono font-black", color)}>{value}</span>
    </div>
  )
}
