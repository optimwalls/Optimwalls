import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Building2,
  FileText,
  PenTool,
  HandshakeIcon,
  HeadphonesIcon,
  BookOpen,
  Leaf,
  BarChart,
  DollarSign,
  Menu,
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "HR Management", href: "/hr", icon: Users },
  { name: "Finance", href: "/finance", icon: DollarSign },
  { name: "Projects", href: "/projects", icon: Briefcase },
  { name: "Vendors", href: "/vendors", icon: Building2 },
  { name: "Quotations", href: "/quotations", icon: FileText },
  { name: "Design", href: "/designs", icon: PenTool },
  { name: "Handover", href: "/handovers", icon: HandshakeIcon },
  { name: "Support", href: "/support", icon: HeadphonesIcon },
  { name: "Knowledge Base", href: "/knowledge", icon: BookOpen },
  { name: "Sustainability", href: "/sustainability", icon: Leaf },
  { name: "Reports", href: "/reports", icon: BarChart },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-gray-600 bg-opacity-75 z-20 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 flex flex-col w-64 bg-sidebar border-r border-sidebar-border transition-transform z-30 lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-sidebar-foreground">
              OptimWalls
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-sidebar-foreground hover:text-sidebar-foreground/80"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
