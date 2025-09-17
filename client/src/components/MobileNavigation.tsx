import { Link, useLocation } from "wouter";

export default function MobileNavigation() {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: "fas fa-chart-pie" },
    { name: "Projects", href: "/projects", icon: "fas fa-folder" },
    { name: "Costs", href: "/cost-entry", icon: "fas fa-dollar-sign" },
    { name: "Reports", href: "/reports", icon: "fas fa-chart-bar" },
  ];

  const isActive = (href: string) => {
    if (href === "/" && location === "/") return true;
    if (href !== "/" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around py-2">
        {navigation.map((item) => (
          <Link key={item.name} href={item.href}>
            <button 
              className={`flex flex-col items-center p-2 ${
                isActive(item.href) ? "text-primary" : "text-muted-foreground"
              }`}
              data-testid={`mobile-nav-${item.name.toLowerCase()}`}
            >
              <i className={`${item.icon} text-lg`}></i>
              <span className="text-xs mt-1">{item.name}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  );
}
