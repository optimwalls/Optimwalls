import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, DollarSign, Calendar } from "lucide-react";
import type { Lead } from "@db/schema";

interface LeadCardProps {
  lead: Lead;
  onClick?: () => void;
}

export default function LeadCard({ lead, onClick }: LeadCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-500/10 text-blue-500";
      case "Contacted":
        return "bg-yellow-500/10 text-yellow-500";
      case "Qualified":
        return "bg-green-500/10 text-green-500";
      case "Converted":
        return "bg-purple-500/10 text-purple-500";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  return (
    <Card
      className="mb-2 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <h3 className="font-semibold truncate">{lead.name}</h3>
          <Badge variant="secondary" className={getStatusColor(lead.status)}>
            {lead.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Mail className="h-4 w-4 mr-2" />
          {lead.email || "No email"}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Phone className="h-4 w-4 mr-2" />
          {lead.phone || "No phone"}
        </div>
        {lead.budget && (
          <div className="flex items-center text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4 mr-2" />
            {lead.budget.toLocaleString()}
          </div>
        )}
        <div className="flex items-center text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 mr-2" />
          {new Date(lead.createdAt!).toLocaleDateString()}
        </div>
        {lead.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {lead.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
