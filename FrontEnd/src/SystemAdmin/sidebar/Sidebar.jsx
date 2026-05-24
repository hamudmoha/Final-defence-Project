import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Shield,
  Database,
  HardDrive,
  FileText,
  Bell,
  Sparkles,
  Settings,
  DollarSign,
  Tent,
  Users,
  MessageSquare,
  UserPlus
} from "lucide-react";
import { cn } from "../ui/utils";

const navItems = [
  { path: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/super-admin/security", label: "Security", icon: Shield },
  { path: "/super-admin/logs", label: "Logs & Monitoring", icon: FileText },
  { path: "/super-admin/reports", label: "Reports & Alerts", icon: Bell },
  { path: "/super-admin/configuration", label: "Configuration", icon: Settings },
  { path: "/super-admin/features", label: "Features", icon: Sparkles },
  { path: "/super-admin/financial", label: "Financial", icon: DollarSign },
  { path: "/super-admin/camps", label: "Camp Management", icon: Tent },
  { path: "/super-admin/users", label: "User Management", icon: Users },
  { path: "/super-admin/role-requests", label: "Role Requests", icon: UserPlus },
  { path: "/super-admin/support", label: "Support Management", icon: MessageSquare },
];

export function Sidebar({ sidebarOpen }) {
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 overflow-y-auto z-10",
      sidebarOpen ? "w-64" : "w-0"
    )}>
      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path === "/super-admin"
            ? location.pathname === "/super-admin"
            : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group overflow-hidden",
                isActive
                  ? "bg-gradient-to-r from-green-50 to-transparent text-green-700 font-bold shadow-sm scale-[1.02]"
                  : "text-gray-500 hover:bg-gray-50/80 hover:text-gray-900 hover:scale-[1.02] hover:translate-x-1"
              )}
            >
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1 bg-green-600 transition-all duration-300",
                isActive ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 group-hover:scale-y-50 group-hover:opacity-50"
              )} />
              <Icon className={cn(
                "w-5 h-5 transition-transform duration-300",
                isActive ? "scale-110 text-green-600" : "group-hover:scale-110"
              )} />
              <span className="whitespace-nowrap z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


