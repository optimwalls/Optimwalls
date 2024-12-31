import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import LeadCard from "./LeadCard";
import type { Lead } from "@db/schema";

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
  };

  const handleDrop = async (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const leadId = parseInt(e.dataTransfer.getData("leadId"));
    const lead = leads.find(l => l.id === leadId);
    
    if (lead && lead.status !== status) {
      updateLead.mutate({ id: leadId, status });
    }
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      {STATUSES.map((status) => (
        <div
          key={status}
          className="bg-card rounded-lg p-4"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, status)}
        >
          <h3 className="font-semibold mb-4">{status}</h3>
          <div className="space-y-2">
            {leads
              ?.filter((lead) => lead.status === status)
              .map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead)}
                >
                  <LeadCard lead={lead} />
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
