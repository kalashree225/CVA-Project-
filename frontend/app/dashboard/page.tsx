"use client";

import { SystemHealthCore } from "@/components/metrics/SystemHealthCore";
import { DeepAnalyticsMonitor } from "@/components/metrics/DeepAnalyticsMonitor";
import { IntelligenceFeed } from "@/components/metrics/IntelligenceFeed";
import { PacketInspector } from "@/components/metrics/PacketInspector";
import { LiveMetricsPanel } from "@/components/metrics/LiveMetricsPanel";
import { ResourceUtilizationMap } from "@/components/metrics/ResourceUtilizationMap";
import { Button } from "@/components/ui/Button";
import { Download, Share2, Filter, ChevronRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-12 pb-20">
      {/* Dynamic Header */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">System Active // Node Cluster 01</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic">
            Cluster <span className="animate-gradient-text">Overview</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="md" className="gap-2 border-white/5 bg-white/5 hover:bg-white/10">
            <Filter className="h-4 w-4" /> Filter Views
          </Button>
          <Button variant="outline" size="md" className="gap-2 border-white/5 bg-white/5 hover:bg-white/10 text-primary">
            <Download className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </header>

      {/* Hero Section: Status & Real-time Metrics */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <SystemHealthCore />
        </div>
        <div className="xl:col-span-1 flex flex-col justify-between gap-6">
           <div className="creative-card flex-1 flex flex-col justify-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Quick Operations</h3>
              <div className="space-y-3">
                <Button className="w-full justify-between group" variant="outline">
                   Initialize Security Scan <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button className="w-full justify-between group" variant="outline">
                   Sync Edge Nodes <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button className="w-full justify-between group bg-primary/10 border-primary/20 hover:bg-primary/20 text-primary">
                   Emergency Protocol <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
           </div>
        </div>
      </section>

      {/* Global Performance Pulse */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
           <h2 className="text-sm font-black uppercase tracking-[0.3em] text-primary whitespace-nowrap">Global Performance Pulse</h2>
           <div className="h-px w-full bg-gradient-to-r from-primary/20 via-white/5 to-transparent" />
        </div>
        <LiveMetricsPanel />
      </section>

      {/* Cluster Topology & Resource Map */}
      <section>
        <ResourceUtilizationMap />
      </section>

      {/* Deep Analytics & Intelligence Feed */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">Neural <span className="text-primary">Analytics</span></h2>
          </div>
          <DeepAnalyticsMonitor />
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">Packet <span className="text-accent">Intelligence</span></h2>
          </div>
          <IntelligenceFeed />
        </div>
      </section>

      {/* Slide-over Inspector */}
      <PacketInspector />
    </div>
  );
}
