import { ReactNode } from "react";
import TopNavigation from "./TopNavigation";
import MobileNavigation from "./MobileNavigation";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNavigation />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 pb-20 md:pb-6">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
}
