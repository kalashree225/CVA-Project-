"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  BarChart3, 
  Activity, 
  AlertTriangle, 
  GitBranch,
  ShieldCheck,
  LogOut,
  Command,
  Settings,
  User,
  Camera
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";

const NAV_ITEMS = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Live Sentinel", href: "/dashboard/camera", icon: Camera },
  { label: "Packet Stream", href: "/dashboard/runs", icon: Activity },
  { label: "Deep Analysis", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Security", href: "/dashboard/alerts", icon: ShieldCheck },
  { label: "Workflows", href: "/dashboard/workflows", icon: GitBranch },
  { label: "Metrics", href: "/dashboard/metrics", icon: AlertTriangle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();

  return (
    <aside className="w-64 border-r border-border bg-white flex flex-col h-screen sticky top-0 hidden lg:flex">
      <div className="p-7 mb-2">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
            <Command className="h-4 w-4 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground">Sentinel</span>
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] -mt-0.5">Intelligence</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        <div className="px-4 mb-3">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">Main Menu</p>
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 group relative",
                isActive 
                  ? "bg-secondary/50 text-primary" 
                  : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-full" />
              )}
              <item.icon className={cn("h-4 w-4 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="px-4 mb-2">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.15em]">Control</p>
        </div>
        <div className="space-y-0.5">
          <Link href="/dashboard/settings" className={cn(
            "flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
            pathname === "/dashboard/settings" ? "bg-secondary/50 text-primary" : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
          )}>
            <Settings className="h-4 w-4" />
            Config
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Terminate Session
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-border/50 px-4">
           <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Hardware Sync: Active</span>
           </div>
        </div>
      </div>
    </aside>
  );
}
