"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  Settings, 
  GitBranch,
  ShieldCheck,
  User,
  Bell
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Deep Analysis", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Packet Stream", href: "/dashboard/runs", icon: Activity },
  { label: "Telemetry", href: "/dashboard/metrics", icon: Settings }, // Settings is a bit weird for telemetry, let's use Activity if it wasn't used
  { label: "Pipeline", href: "/dashboard/workflows", icon: GitBranch },
  { label: "Security", href: "/dashboard/alerts", icon: ShieldCheck },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <nav className="nav-blur sticky top-0 z-50 border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-2xl shadow-primary/40 group-hover:scale-110 transition-all duration-500 border border-white/10">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter uppercase leading-none italic">
                Sentinel<span className="animate-gradient-text">Ops</span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground mt-1">Intelligence Layer</span>
            </div>
          </Link>

          <div className="hidden xl:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 group",
                    isActive 
                      ? "text-primary bg-primary/10 shadow-[inset_0_0_12px_rgba(var(--primary-rgb),0.1)]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                  {isActive && (
                    <span className="absolute -bottom-[21px] left-0 w-full h-[3px] bg-primary rounded-t-full shadow-[0_0_20px_rgba(var(--primary-rgb),0.8)]" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-success">Cluster Nominal</span>
          </div>

          <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 text-muted-foreground hover:text-primary transition-all border border-white/5 hover:border-primary/20">
            <Bell className="h-5 w-5" />
          </button>
          
          <div className="h-8 w-[1px] bg-white/10 mx-1" />

          <div className="flex items-center gap-4 pl-2">
            <div className="flex flex-col items-end hidden lg:flex">
              <span className="text-sm font-black italic tracking-tight text-foreground leading-tight">
                {user?.full_name || "Enterprise User"}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-primary font-black opacity-80">
                System Administrator
              </span>
            </div>
            <button
              className="h-11 w-11 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-xs font-black shadow-lg ring-1 ring-white/5 hover:ring-primary/40 transition-all group overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <User className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors z-10" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
