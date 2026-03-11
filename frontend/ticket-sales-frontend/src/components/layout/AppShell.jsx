import { SiteNavbar } from "@/components/layout/SiteNavbar";
import { UserNavbar } from "@/components/layout/UserNavbar";
import { OrganizerNavbar } from "@/components/layout/OrganizerNavbar";
import { useAuth } from "@/hooks/useAuth";
import { SiteFooter } from "@/components/layout/SiteFooter";
export function AppShell({ children }) {
    const { isAuth, loading, user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-neon text-white">
        {loading ? (
            <div className="sticky top-0 z-50 h-16 border-b border-white/10 bg-black/20 backdrop-blur-xl" />
        ) : isAuth ? (
            user?.role === "ORGANIZER" ? (
                <OrganizerNavbar onLogout={logout} />
            ) : (
                <UserNavbar onLogout={logout} />
            )
        ) : (
                <SiteNavbar />
        )}
            <main className="flex-1">
                    {children}
            </main>

            <SiteFooter />
        </div>
    );
}
