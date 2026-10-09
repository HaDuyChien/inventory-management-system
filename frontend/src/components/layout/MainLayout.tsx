import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { CommandMenu } from "./CommandMenu";
import { NotificationsDrawer } from "./NotificationsDrawer";
import { ToastContainer } from "@/components/common/ToastContainer";
import { usePageTitle } from "@/utils/usePageTitle";
import { useAuthStore } from "@/stores/useAuthStore";

export const MainLayout: React.FC = () => {
    usePageTitle();
    const { isAuthenticated, currentUser } = useAuthStore();

    if (!isAuthenticated || !currentUser) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-[#f6f5f4] flex text-[#000000]">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <Header />

                <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1440px] w-full mx-auto">
                    <Outlet />
                </main>
            </div>

            <MobileNav />
            <CommandMenu />
            <NotificationsDrawer />
            <ToastContainer />
        </div>
    );
};
