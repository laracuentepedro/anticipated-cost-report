import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import CostEntryModal from "@/components/CostEntryModal";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [showCostModal, setShowCostModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: changeOrders = [] } = useQuery({
    queryKey: ["/api/change-orders"],
  });

  const pendingChangeOrders = changeOrders.filter((co: any) => co.status === "pending");

  // Calculate metrics from projects
  const activeProjects = projects.filter((p: any) => p.status === "active");
  const totalBudget = activeProjects.reduce((sum: number, p: any) => sum + Number(p.budget), 0);

  const handleViewProject = (projectId: string) => {
    const project = projects.find((p: any) => p.id === projectId);
    setSelectedProject(project);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
            Project Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Monitor project costs and performance</p>
        </div>
        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Link href="/projects">
            <Button variant="secondary" className="flex items-center space-x-2" data-testid="button-new-project">
              <i className="fas fa-plus"></i>
              <span className="hidden sm:inline">New Project</span>
            </Button>
          </Link>
          <Button 
            onClick={() => setShowCostModal(true)}
            className="flex items-center space-x-2"
            data-testid="button-quick-entry"
          >
            <i className="fas fa-receipt"></i>
            <span className="hidden sm:inline">Quick Entry</span>
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Active Projects</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-active-projects">
                  {activeProjects.length}
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <i className="fas fa-folder-open text-primary"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-success text-sm">Active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Budget</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-budget">
                  ${totalBudget.toLocaleString()}
                </p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-full">
                <i className="fas fa-dollar-sign text-secondary"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-success text-sm">All projects</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Change Orders</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-change-orders">
                  {pendingChangeOrders.length}
                </p>
              </div>
              <div className="bg-warning/10 p-3 rounded-full">
                <i className="fas fa-clock text-warning"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-warning text-sm">Pending approval</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Projects</p>
                <p className="text-2xl font-bold text-success" data-testid="text-project-status">
                  On Track
                </p>
              </div>
              <div className="bg-success/10 p-3 rounded-full">
                <i className="fas fa-trending-up text-success"></i>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-success text-sm">Overall status</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      {pendingChangeOrders.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Alerts & Notifications</h2>
          <div className="space-y-3">
            <Alert className="border-warning/20 bg-warning/10">
              <i className="fas fa-clock text-warning"></i>
              <AlertDescription>
                <p className="font-medium text-foreground">
                  {pendingChangeOrders.length} change orders pending approval
                </p>
                <p className="text-sm text-muted-foreground">
                  Review and approve pending change orders
                </p>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Projects List */}
        <Card className="shadow-material">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Active Projects</CardTitle>
              <Link href="/projects">
                <Button variant="ghost" size="sm" data-testid="link-view-all">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-20 bg-accent rounded-md"></div>
                  </div>
                ))}
              </div>
            ) : activeProjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No active projects</p>
                <Link href="/projects">
                  <Button className="mt-4" data-testid="button-create-first-project">
                    Create Your First Project
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {activeProjects.slice(0, 3).map((project: any) => (
                  <div 
                    key={project.id} 
                    className="flex items-center justify-between p-3 bg-accent rounded-md hover:bg-accent/80 transition-colors cursor-pointer"
                    onClick={() => handleViewProject(project.id)}
                    data-testid={`card-project-${project.id}`}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.projectType} • Due: {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="secondary">
                          {project.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Budget: ${Number(project.budget).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card className="shadow-material">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Cost Categories</CardTitle>
              <select className="text-sm border border-border rounded px-2 py-1 bg-background">
                <option>All Projects</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-foreground">Labor</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-foreground font-medium">48%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-secondary rounded-full"></div>
                  <span className="text-foreground">Materials</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-foreground font-medium">35%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-warning rounded-full"></div>
                  <span className="text-foreground">Equipment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-foreground font-medium">11%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-accent rounded-full"></div>
                  <span className="text-foreground">Subcontractors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-foreground font-medium">6%</span>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium text-foreground mb-2">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowCostModal(true)}
                  data-testid="button-add-cost"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Cost
                </Button>
                <Link href="/reports">
                  <Button variant="ghost" size="sm" data-testid="link-view-reports">
                    <i className="fas fa-chart-bar mr-2"></i>
                    Reports
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Mobile */}
      <div className="mt-8 md:hidden">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="p-4 h-auto flex flex-col items-center space-y-2"
            onClick={() => setShowCostModal(true)}
            data-testid="button-mobile-add-cost"
          >
            <i className="fas fa-plus-circle text-primary text-2xl"></i>
            <span className="text-sm font-medium">Add Cost</span>
          </Button>
          <Button 
            variant="outline" 
            className="p-4 h-auto flex flex-col items-center space-y-2"
            data-testid="button-mobile-scan-receipt"
          >
            <i className="fas fa-camera text-secondary text-2xl"></i>
            <span className="text-sm font-medium">Scan Receipt</span>
          </Button>
          <Link href="/change-orders">
            <Button 
              variant="outline" 
              className="p-4 h-auto flex flex-col items-center space-y-2 w-full"
              data-testid="link-mobile-change-order"
            >
              <i className="fas fa-file-alt text-warning text-2xl"></i>
              <span className="text-sm font-medium">Change Order</span>
            </Button>
          </Link>
          <Link href="/reports">
            <Button 
              variant="outline" 
              className="p-4 h-auto flex flex-col items-center space-y-2 w-full"
              data-testid="link-mobile-reports"
            >
              <i className="fas fa-chart-bar text-muted-foreground text-2xl"></i>
              <span className="text-sm font-medium">View Reports</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Floating Action Button - Mobile */}
      <Button 
        className="fixed bottom-24 right-6 w-14 h-14 rounded-full shadow-material hover:shadow-material-hover md:hidden z-40"
        onClick={() => setShowCostModal(true)}
        data-testid="button-floating-add"
      >
        <i className="fas fa-plus text-xl"></i>
      </Button>

      <CostEntryModal open={showCostModal} onOpenChange={setShowCostModal} />
      
      {/* Project Details Modal */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>
          {selectedProject && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedProject.name}</h3>
                <Badge variant={selectedProject.status === 'active' ? 'default' : 'secondary'}>
                  {selectedProject.status}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">Project #:</span>
                  <p>{selectedProject.projectNumber}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Type:</span>
                  <p className="capitalize">{selectedProject.projectType}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Budget:</span>
                  <p>${Number(selectedProject.budget).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">Due Date:</span>
                  <p>{selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'TBD'}</p>
                </div>
              </div>
              {selectedProject.description && (
                <div>
                  <span className="font-medium text-muted-foreground">Description:</span>
                  <p className="text-sm mt-1">{selectedProject.description}</p>
                </div>
              )}
              <div className="flex space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setSelectedProject(null);
                    setLocation('/projects');
                  }}
                >
                  View in Projects
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setSelectedProject(null);
                    setLocation('/cost-entry');
                  }}
                >
                  Add Costs
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
