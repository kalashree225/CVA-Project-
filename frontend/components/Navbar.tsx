"use client";

import { usePathname } from "next/navigation";
import { 
  User,
  Bell,
  Search,
  ChevronRight,
  Shield,
  Activity,
  Cpu
} from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const getBreadcrumb = () => {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 0) return "Global Overview";
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" / ");
  };

  return (
    <nav className="nav-blur sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/30 border border-border/50">
             <Shield className="h-3.5 w-3.5 text-primary" />
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{getBreadcrumb()}</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
             <div className="flex items-center gap-1.5">
                <Cpu className="h-3 w-3" />
                <span>Sentinel Core v1.0</span>
             </div>
             <div className="h-3 w-[1px] bg-border" />
             <div className="flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600/60">Node Sync: 99.9%</span>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="relative hidden xl:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search Intelligence..." 
              className="h-9 w-72 bg-secondary/20 border border-border/50 rounded-full pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/5 focus:border-primary/30 transition-all placeholder:text-muted-foreground/40 font-medium"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative h-9 w-9 flex items-center justify-center rounded-full bg-secondary/30 border border-border/50 text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary border border-white" />
            </button>
            
            <div className="flex items-center gap-2 pl-2 group cursor-pointer">
               <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {user?.full_name || "Enterprise User"}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter opacity-60">
                    System Admin
                  </span>
               </div>
               <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 p-[1px] transition-transform group-hover:scale-105">
                  <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-[11px] font-black text-primary">
                    {user?.full_name?.[0] || "U"}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
