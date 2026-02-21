import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import PullToRefresh from "./PullToRefresh";

interface AppLayoutProps {
  children: ReactNode;
  hideNav?: boolean;
  onRefresh?: () => Promise<void>;
}

export default function AppLayout({ children, hideNav = false, onRefresh }: AppLayoutProps) {
  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-background flex justify-center overflow-hidden overscroll-none z-0">
      <div className="relative w-full max-w-mobile h-full flex flex-col overflow-hidden shadow-2xl bg-background">
        <main className="flex-1 w-full h-full relative overflow-hidden bg-background z-10">
          <PullToRefresh onRefresh={onRefresh}>
            <div className={`w-full min-h-full pt-14 safe-top ${!hideNav ? 'pb-[110px]' : 'pb-8'} safe-bottom`}>
              {children}
            </div>
          </PullToRefresh>
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
