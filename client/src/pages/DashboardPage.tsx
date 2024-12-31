import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Users, Phone, UserCheck, DollarSign, Briefcase, FileText, AlertCircle, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
  });

  const cards = [
    {
      title: "Total Leads",
      value: stats?.totalLeads ?? 0,
      icon: Users,
      description: "Active leads in pipeline"
    },
    {
      title: "To Contact",
      value: stats?.toContact ?? 0,
      icon: Phone,
      description: "Leads needing follow-up"
    },
    {
      title: "Qualified",
      value: stats?.qualified ?? 0,
      icon: UserCheck,
      description: "Leads ready for conversion"
    },
    {
      title: "Pipeline Value",
      value: `$${(stats?.revenue ?? 0).toLocaleString()}`,
      icon: DollarSign,
      description: "Total qualified leads value"
    },
    {
      title: "Active Projects",
      value: stats?.activeProjects ?? 0,
      icon: Briefcase,
      description: "Projects in progress"
    },
    {
      title: "Monthly Income",
      value: `$${(stats?.monthlyIncome ?? 0).toLocaleString()}`,
      icon: TrendingUp,
      description: "Last 30 days income"
    },
    {
      title: "Monthly Expenses",
      value: `$${(stats?.monthlyExpense ?? 0).toLocaleString()}`,
      icon: FileText,
      description: "Last 30 days expenses"
    },
    {
      title: "Support Tickets",
      value: stats?.openTickets ?? 0,
      icon: AlertCircle,
      description: "Open support tickets"
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}