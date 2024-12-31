import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Users, Phone, UserCheck, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const { data: stats } = useQuery({
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
      title: "Revenue",
      value: `$${stats?.revenue?.toLocaleString() ?? 0}`,
      icon: DollarSign,
      description: "Total pipeline value"
    }
  ];

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
