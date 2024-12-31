import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Users, PieChart, Settings } from "lucide-react";
import { useUser } from "@/hooks/use-user";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Reports", href: "/reports", icon: PieChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();

  return (
    <div className="flex h-full w-56 flex-col bg-sidebar border-r">
      <div className="flex flex-col flex-1 gap-1 p-4">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  location === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </a>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t">
        <div className="text-sm font-medium text-sidebar-foreground/60">
          Signed in as
        </div>
        <div className="text-sm font-semibold text-sidebar-foreground">
          {user?.username}
        </div>
      </div>
    </div>
  );
}
