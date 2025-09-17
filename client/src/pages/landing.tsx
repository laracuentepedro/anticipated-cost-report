import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <i className="fas fa-bolt text-primary text-3xl"></i>
            <CardTitle className="text-2xl font-bold">ElectriCost Pro</CardTitle>
          </div>
          <p className="text-muted-foreground">
            Professional cost management for electrical construction projects
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Key Features</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Real-time project cost tracking</li>
              <li>• Mobile field entry</li>
              <li>• Budget variance analysis</li>
              <li>• Change order management</li>
              <li>• Electrical-specific cost codes</li>
            </ul>
          </div>
          <Button 
            className="w-full"
            onClick={() => window.location.href = "/api/login"}
            data-testid="button-login"
          >
            Get Started
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
