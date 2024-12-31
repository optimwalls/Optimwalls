import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import LeadCard from "./LeadCard";
import type { Lead } from "@db/schema";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";

interface LeadPipelineProps {
  leads: Lead[];
}

const STATUSES = ["New", "Contacted", "Qualified", "Converted"];

export default function LeadPipeline({ leads }: LeadPipelineProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateLead = useMutation({
    mutationFn: async (lead: Partial<Lead>) => {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData("leadId", lead.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    target.classList.add("bg-accent");
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.classList.remove("bg-accent");
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const target = e.target as HTMLElement;
    target.classList.remove("bg-accent");

    const leadId = parseInt(e.dataTransfer.getData("leadId"));
    const lead = leads.find(l => l.id === leadId);

    if (lead && lead.status !== status) {
      updateLead.mutate({ id: leadId, status });
    }
  };

  const getStageMetrics = (status: string) => {
    const stageLeads = leads?.filter((lead) => lead.status === status) || [];
    const totalValue = stageLeads.reduce((sum, lead) => sum + (lead.budget || 0), 0);

    return {
      count: stageLeads.length,
      value: totalValue,
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATUSES.map((status) => {
        const metrics = getStageMetrics(status);
        return (
          <Card
            key={status}
            className="bg-card rounded-lg p-4"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">{status}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Users className="h-4 w-4 mr-1" />
                {metrics.count}
              </div>
            </div>

            {metrics.count > 0 && (
              <div className="text-sm text-muted-foreground mb-4">
                Total Value: ${metrics.value.toLocaleString()}
              </div>
            )}

            <div className="space-y-2 min-h-[200px]">
              {leads
                ?.filter((lead) => lead.status === status)
                .map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead)}
                    className="transition-transform hover:scale-[1.02]"
                  >
                    <LeadCard lead={lead} />
                  </div>
                ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}