import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export default function TopNavigation() {
  const { user } = useAuth();
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: "fas fa-chart-pie" },
    { name: "Projects", href: "/projects", icon: "fas fa-folder" },
    { name: "Cost Entry", href: "/cost-entry", icon: "fas fa-dollar-sign" },
    { name: "Reports", href: "/reports", icon: "fas fa-chart-bar" },
    { name: "Change Orders", href: "/change-orders", icon: "fas fa-file-alt" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <header className="bg-card border-b border-border shadow-sm hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer" data-testid="link-logo">
                <i className="fas fa-bolt text-primary text-2xl"></i>
                <span className="text-xl font-bold text-foreground">ElectriCost Pro</span>
              </div>
            </Link>
            <nav className="flex space-x-6">
              {navigation.map((item) => (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`${
                    isActive(item.href)
                      ? "text-primary font-medium border-b-2 border-primary pb-1"
                      : "text-muted-foreground hover:text-foreground"
                  } transition-colors`}
                  data-testid={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" data-testid="button-notifications">
              <i className="fas fa-bell"></i>
            </Button>
            <div className="flex items-center space-x-2">
              {user?.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="User avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                  data-testid="img-user-avatar"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <i className="fas fa-user text-sm"></i>
                </div>
              )}
              <span className="text-sm font-medium" data-testid="text-user-name">
                {user?.firstName || user?.email || "User"}
              </span>
              {user?.role && (
                <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded" data-testid="text-user-role">
                  {user.role}
                </span>
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              <i className="fas fa-sign-out-alt"></i>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
