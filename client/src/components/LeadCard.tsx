import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, DollarSign, Calendar, Building2, Star, MessageSquare } from "lucide-react";
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-gray-500";
  };

  return (
    <Card
      className="mb-2 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold truncate">{lead.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="secondary" className={getStatusColor(lead.status)}>
                {lead.status}
              </Badge>
              {lead.projectType && (
                <Badge variant="outline" className="ml-1">
                  <Building2 className="h-3 w-3 mr-1" />
                  {lead.projectType}
                </Badge>
              )}
            </div>
          </div>
          {lead.score !== null && (
            <div className="flex items-center">
              <Star className={`h-4 w-4 ${getScoreColor(lead.score)}`} />
              <span className={`text-sm ml-1 ${getScoreColor(lead.score)}`}>
                {lead.score}
              </span>
            </div>
          )}
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
            ${lead.budget.toLocaleString()}
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

        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1">
            <MessageSquare className="h-4 w-4 mr-2" />
            Follow Up
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            View Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}