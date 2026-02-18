import { ReactNode } from "react";
import BottomNav from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export default function AppLayout({ children, hideNav = false }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex justify-center">
      <div className="relative w-full max-w-mobile min-h-screen flex flex-col overflow-hidden">
        <main className={`flex-1 overflow-y-auto scroll-hidden ${!hideNav ? "pb-20" : ""}`}>
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
