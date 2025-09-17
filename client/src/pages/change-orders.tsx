import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertChangeOrderSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const changeOrderFormSchema = insertChangeOrderSchema.extend({
  amount: z.string().min(1, "Amount is required"),
});

type ChangeOrderFormData = z.infer<typeof changeOrderFormSchema>;

export default function ChangeOrders() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const { toast } = useToast();

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: changeOrders = [], isLoading } = useQuery({
    queryKey: ["/api/change-orders", selectedProject === "all" ? undefined : selectedProject],
  });

  const form = useForm<ChangeOrderFormData>({
    resolver: zodResolver(changeOrderFormSchema),
    defaultValues: {
      changeOrderNumber: "",
      description: "",
      amount: "",
      status: "pending",
    },
  });

  const createChangeOrderMutation = useMutation({
    mutationFn: async (data: ChangeOrderFormData) => {
      const changeOrderData = {
        ...data,
        amount: data.amount,
      };
      await apiRequest("POST", "/api/change-orders", changeOrderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-orders"] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Change order created successfully",
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

  const updateChangeOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PUT", `/api/change-orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-orders"] });
      toast({
        title: "Success",
        description: "Change order updated successfully",
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

  const onSubmit = (data: ChangeOrderFormData) => {
    createChangeOrderMutation.mutate(data);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "pending": return "outline";
      case "approved": return "default";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return "fas fa-clock";
      case "approved": return "fas fa-check";
      case "rejected": return "fas fa-times";
      default: return "fas fa-file";
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateChangeOrderMutation.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-change-orders-title">
            Change Orders
          </h1>
          <p className="text-muted-foreground mt-1">Manage project change requests and approvals</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0" data-testid="button-create-change-order">
              <i className="fas fa-plus mr-2"></i>
              New Change Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Change Order</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-change-order-project">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {projects.map((project: any) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="changeOrderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Change Order Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter change order number" 
                          {...field} 
                          data-testid="input-change-order-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the change order" 
                          {...field} 
                          data-testid="textarea-change-order-description"
                        />
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
                          data-testid="input-change-order-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setIsCreateOpen(false)}
                    data-testid="button-change-order-cancel"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createChangeOrderMutation.isPending}
                    data-testid="button-change-order-create"
                  >
                    {createChangeOrderMutation.isPending ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger data-testid="select-project-filter">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <Select defaultValue="all">
                <SelectTrigger data-testid="select-status-filter">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
              <Select defaultValue="all">
                <SelectTrigger data-testid="select-date-filter">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-quarter">This Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Orders List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-accent rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : changeOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <i className="fas fa-file-alt text-muted-foreground text-4xl mb-4"></i>
            <h3 className="text-lg font-semibold text-foreground mb-2">No change orders yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first change order to track project modifications
            </p>
            <Button onClick={() => setIsCreateOpen(true)} data-testid="button-create-first-change-order">
              <i className="fas fa-plus mr-2"></i>
              Create First Change Order
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {changeOrders.map((changeOrder: any) => (
            <Card key={changeOrder.id} className="shadow-material hover:shadow-material-hover transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <i className={`${getStatusIcon(changeOrder.status)} text-muted-foreground`}></i>
                      <h3 className="font-semibold text-foreground">
                        {changeOrder.changeOrderNumber}
                      </h3>
                      <Badge variant={getStatusBadgeVariant(changeOrder.status)}>
                        {changeOrder.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mb-2">{changeOrder.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>
                        <i className="fas fa-calendar mr-1"></i>
                        {new Date(changeOrder.requestDate).toLocaleDateString()}
                      </span>
                      {changeOrder.approvalDate && (
                        <span>
                          <i className="fas fa-check mr-1"></i>
                          Approved {new Date(changeOrder.approvalDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        ${Number(changeOrder.amount).toLocaleString()}
                      </p>
                    </div>

                    {changeOrder.status === "pending" && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success border-success hover:bg-success hover:text-success-foreground"
                          onClick={() => handleStatusChange(changeOrder.id, "approved")}
                          disabled={updateChangeOrderMutation.isPending}
                          data-testid={`button-approve-${changeOrder.id}`}
                        >
                          <i className="fas fa-check mr-1"></i>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => handleStatusChange(changeOrder.id, "rejected")}
                          disabled={updateChangeOrderMutation.isPending}
                          data-testid={`button-reject-${changeOrder.id}`}
                        >
                          <i className="fas fa-times mr-1"></i>
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
