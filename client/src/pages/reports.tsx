import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function Reports() {
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [reportType, setReportType] = useState<string>("summary");

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: costEntries = [] } = useQuery({
    queryKey: ["/api/cost-entries", selectedProject === "all" ? undefined : selectedProject],
  });

  const exportToCSV = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + data.map(row => Object.values(row).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = () => {
    const exportData = costEntries.map((entry: any) => ({
      Date: new Date(entry.entryDate).toLocaleDateString(),
      Description: entry.description,
      Amount: entry.amount,
      Category: entry.category || "General",
    }));
    exportToCSV(exportData, `cost-report-${new Date().toISOString().split('T')[0]}.csv`);
  };

  // Calculate summary metrics
  const totalCosts = costEntries.reduce((sum: number, entry: any) => sum + Number(entry.amount), 0);
  const costsByCategory = costEntries.reduce((acc: Record<string, number>, entry: any) => {
    const category = entry.category || "General";
    acc[category] = (acc[category] || 0) + Number(entry.amount);
    return acc;
  }, {});

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-reports-title">
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">Cost analysis and project insights</p>
        </div>
        <Button onClick={handleExport} className="mt-4 sm:mt-0" data-testid="button-export">
          <i className="fas fa-download mr-2"></i>
          Export CSV
        </Button>
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
              <label className="block text-sm font-medium text-foreground mb-2">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger data-testid="select-report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Cost Summary</SelectItem>
                  <SelectItem value="variance">Budget Variance</SelectItem>
                  <SelectItem value="trend">Cost Trends</SelectItem>
                  <SelectItem value="productivity">Labor Productivity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Period</label>
              <Select defaultValue="current-month">
                <SelectTrigger data-testid="select-period">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Current Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Costs</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-costs">
                  ${totalCosts.toLocaleString()}
                </p>
              </div>
              <div className="bg-primary/10 p-3 rounded-full">
                <i className="fas fa-dollar-sign text-primary"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Entries</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-entries">
                  {costEntries.length}
                </p>
              </div>
              <div className="bg-secondary/10 p-3 rounded-full">
                <i className="fas fa-list text-secondary"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg. Entry</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-avg-entry">
                  ${costEntries.length > 0 ? (totalCosts / costEntries.length).toFixed(0) : '0'}
                </p>
              </div>
              <div className="bg-warning/10 p-3 rounded-full">
                <i className="fas fa-calculator text-warning"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Categories</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-categories">
                  {Object.keys(costsByCategory).length}
                </p>
              </div>
              <div className="bg-accent/10 p-3 rounded-full">
                <i className="fas fa-tags text-accent-foreground"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <Card className="shadow-material">
          <CardHeader>
            <CardTitle>Cost Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(costsByCategory).length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No cost data available
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(costsByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Badge className={getCategoryColor(category)}>
                        {category}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-foreground font-medium">
                        ${(amount as number).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {totalCosts > 0 ? ((amount as number / totalCosts * 100)).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card className="shadow-material">
          <CardHeader>
            <CardTitle>Recent Cost Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {costEntries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No cost entries found
              </p>
            ) : (
              <div className="space-y-3">
                {costEntries.slice(0, 8).map((entry: any) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-3 bg-accent rounded-md"
                    data-testid={`recent-entry-${entry.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">
                        {entry.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.entryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ${Number(entry.amount).toLocaleString()}
                      </p>
                      <Badge size="sm" className={getCategoryColor(entry.category || "general")}>
                        {entry.category || "General"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Performance */}
      {selectedProject !== "all" && (
        <Card className="shadow-material">
          <CardHeader>
            <CardTitle>Project Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <i className="fas fa-chart-line text-success text-2xl mb-2"></i>
                <p className="text-sm text-muted-foreground">Budget Status</p>
                <p className="text-lg font-semibold text-success">On Track</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <i className="fas fa-clock text-warning text-2xl mb-2"></i>
                <p className="text-sm text-muted-foreground">Schedule</p>
                <p className="text-lg font-semibold text-warning">On Time</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <i className="fas fa-users text-primary text-2xl mb-2"></i>
                <p className="text-sm text-muted-foreground">Team Performance</p>
                <p className="text-lg font-semibold text-primary">Excellent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
