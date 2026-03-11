import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Shield,
  AlertTriangle,
  Users,
  Server,
  History,
  LogOut,
  Menu,
  X,
  ChevronRight,
  User,
  Settings,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { RoleBadge } from "./ui";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
  { to: "/logs", icon: <FileText size={18} />, label: "Logs" },
  { to: "/threats", icon: <Shield size={18} />, label: "Threat Analysis" },
  {
    to: "/pending",
    icon: <AlertTriangle size={18} />,
    label: "Pending Alerts",
    adminOnly: true,
  },
  {
    to: "/decisions",
    icon: <History size={18} />,
    label: "Decisions",
    adminOnly: true,
  },
  {
    to: "/agents",
    icon: <Server size={18} />,
    label: "Agents",
    adminOnly: true,
  },
  { to: "/users", icon: <Users size={18} />, label: "Users", adminOnly: true },
];

function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && user?.role !== "admin") return false;
    return true;
  });

  return (
    <aside
      className={`fixed left-0 top-0 h-full z-30 flex flex-col transition-all duration-300
      bg-slate-900 border-r border-slate-800 ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
              <Shield size={16} className="text-white" />
            </div>
            <span className="font-semibold text-white tracking-wide">
              SentinelLog
            </span>
          </div>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Shield size={16} className="text-white" />
          </div>
        )}

        {!collapsed && (
          <div
            onClick={onToggle}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition"
          >
            <X size={16} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all text-sm
               ${
                 isActive
                   ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                   : "text-slate-300 hover:text-white hover:bg-slate-800"
               }`
            }
          >
            <span className="shrink-0">{item.icon}</span>

            {!collapsed && (
              <>
                <span className="truncate">{item.label}</span>
                <ChevronRight
                  size={14}
                  className="ml-auto opacity-30 group-hover:opacity-100"
                />
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-3 p-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 flex items-center justify-center shrink-0">
            <User size={15} className="text-blue-400" />
          </div>

          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{user?.name}</p>
              <div className="mt-0.5"><RoleBadge role={user!.role} /></div>
            </div>
          )}

          {/* Settings gear with dropdown */}
          <div ref={settingsRef} className="relative shrink-0">
            <div
              onClick={() => setSettingsOpen(o => !o)}
              title="Settings"
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition"
            >
              <Settings size={15} className={settingsOpen ? 'text-white' : ''} />
            </div>

            {settingsOpen && (
              <div className="absolute bottom-9 left-0 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1 z-50">
                <div
                  onClick={() => { setSettingsOpen(false); navigate('/profile'); }}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer transition rounded-lg mx-1"
                >
                  <UserCircle size={15} />
                  My Profile
                </div>
                <div className="my-1 border-t border-slate-700" />
                <div
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-300 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition rounded-lg mx-1"
                >
                  <LogOut size={15} />
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#080c1a] flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div
        className={`flex-1 transition-all duration-300 ${
          collapsed ? "ml-16" : "ml-64"
        }`}
      >
        {/* Topbar */}
        <header
          className="sticky top-0 z-20 flex items-center gap-4 px-6 py-3
        bg-slate-900/90 backdrop-blur border-b border-slate-800"
        >
          {collapsed && (
            <div
              onClick={() => setCollapsed(false)}
              className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition"
            >
              <Menu size={20} />
            </div>
          )}

          <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Backend connected
          </div>
        </header>

        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
