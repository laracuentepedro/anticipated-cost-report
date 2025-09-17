import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertCostEntrySchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "./ObjectUploader";
import { z } from "zod";

const costEntryFormSchema = insertCostEntrySchema.extend({
  amount: z.string().min(1, "Amount is required"),
  quantity: z.string().optional(),
  unitCost: z.string().optional(),
});

type CostEntryFormData = z.infer<typeof costEntryFormSchema>;

interface CostEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CostEntryModal({ open, onOpenChange }: CostEntryModalProps) {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { toast } = useToast();

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: costCodes = [] } = useQuery({
    queryKey: ["/api/cost-codes", selectedCategory],
    enabled: !!selectedCategory,
  });

  const form = useForm<CostEntryFormData>({
    resolver: zodResolver(costEntryFormSchema),
    defaultValues: {
      description: "",
      amount: "",
      quantity: "",
      unitCost: "",
      entryDate: new Date().toISOString().split('T')[0],
    },
  });

  const createCostEntryMutation = useMutation({
    mutationFn: async (data: CostEntryFormData) => {
      const entryData = {
        ...data,
        projectId: selectedProject,
        amount: data.amount,
        quantity: data.quantity ? data.quantity : null,
        unitCost: data.unitCost ? data.unitCost : null,
        entryDate: new Date(data.entryDate),
      };
      await apiRequest("POST", "/api/cost-entries", entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-entries"] });
      onOpenChange(false);
      form.reset();
      setSelectedProject("");
      setSelectedCategory("");
      toast({
        title: "Success",
        description: "Cost entry created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CostEntryFormData) => {
    if (!selectedProject) {
      toast({
        title: "Error",
        description: "Please select a project",
        variant: "destructive",
      });
      return;
    }
    createCostEntryMutation.mutate(data);
  };

  const handleGetUploadParameters = async () => {
    const response = await apiRequest("POST", "/api/objects/upload");
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = async (result: any) => {
    if (result.successful.length > 0) {
      const uploadURL = result.successful[0].uploadURL;
      try {
        await apiRequest("PUT", "/api/attachments", { attachmentURL: uploadURL });
        toast({
          title: "Success",
          description: "File uploaded successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to process upload",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Cost Entry</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger data-testid="modal-select-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Cost Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger data-testid="modal-select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="labor">Labor</SelectItem>
                  <SelectItem value="materials">Materials</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="subcontractors">Subcontractors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedCategory && (
              <FormField
                control={form.control}
                name="costCodeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Code</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="modal-select-cost-code">
                          <SelectValue placeholder="Select cost code" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {costCodes.map((code: any) => (
                          <SelectItem key={code.id} value={code.id}>
                            {code.code} - {code.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter cost description" {...field} data-testid="modal-input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      {...field} 
                      data-testid="modal-input-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="entryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="modal-input-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Attachment (Optional)
              </label>
              <ObjectUploader
                maxNumberOfFiles={1}
                maxFileSize={10485760}
                onGetUploadParameters={handleGetUploadParameters}
                onComplete={handleUploadComplete}
                buttonClassName="w-full"
              >
                <div className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-border rounded-md">
                  <i className="fas fa-cloud-upload-alt text-muted-foreground"></i>
                  <span>Drag & drop files or click to browse</span>
                </div>
              </ObjectUploader>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => onOpenChange(false)}
                data-testid="modal-button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createCostEntryMutation.isPending}
                data-testid="modal-button-save"
              >
                {createCostEntryMutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
