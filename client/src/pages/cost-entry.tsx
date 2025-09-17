import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import { z } from "zod";

const costEntryFormSchema = insertCostEntrySchema.extend({
  amount: z.string().min(1, "Amount is required"),
  quantity: z.string().optional(),
  unitCost: z.string().optional(),
});

type CostEntryFormData = z.infer<typeof costEntryFormSchema>;

export default function CostEntry() {
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

  const { data: costEntries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["/api/cost-entries", selectedProject],
    enabled: !!selectedProject,
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
      form.reset();
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "labor": return "bg-primary text-primary-foreground";
      case "materials": return "bg-secondary text-secondary-foreground";
      case "equipment": return "bg-warning text-warning-foreground";
      case "subcontractors": return "bg-accent text-accent-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground" data-testid="text-cost-entry-title">
          Cost Entry
        </h1>
        <p className="text-muted-foreground mt-1">Add project costs and expenses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Entry Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-material">
            <CardHeader>
              <CardTitle>New Cost Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Project</label>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger data-testid="select-project">
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
                      <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger data-testid="select-category">
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
                              <SelectTrigger data-testid="select-cost-code">
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
                          <Textarea 
                            placeholder="Enter cost description" 
                            {...field} 
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                              data-testid="input-amount"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.001"
                              placeholder="0" 
                              {...field} 
                              data-testid="input-quantity"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="unitCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Cost (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field} 
                              data-testid="input-unit-cost"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="entryDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-date"
                          />
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
                        <span>Upload Receipt or Photo</span>
                      </div>
                    </ObjectUploader>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createCostEntryMutation.isPending}
                    data-testid="button-save-entry"
                  >
                    {createCostEntryMutation.isPending ? "Saving..." : "Save Entry"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <div>
          <Card className="shadow-material">
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedProject ? (
                <p className="text-muted-foreground text-center py-4">
                  Select a project to view entries
                </p>
              ) : entriesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-accent rounded"></div>
                    </div>
                  ))}
                </div>
              ) : costEntries.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No cost entries yet
                </p>
              ) : (
                <div className="space-y-3">
                  {costEntries.slice(0, 5).map((entry: any) => (
                    <div 
                      key={entry.id} 
                      className="p-3 bg-accent rounded-md"
                      data-testid={`entry-${entry.id}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="font-medium text-foreground text-sm">
                          {entry.description}
                        </p>
                        <span className="font-semibold text-foreground">
                          ${Number(entry.amount).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge size="sm" className={getCategoryColor("materials")}>
                          {entry.category || "General"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.entryDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
