import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

function NavItem({ to, children, onClick }) {
    return (
        <NavLink
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
            [
            "text-sm transition-colors",
            isActive ? "text-white" : "text-white/70 hover:text-white",
            ].join(" ")
        }
        >
        {children}
        </NavLink>
    );
}

function useThemeToggle() {
    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains("dark")
    );

    // Si querés que SIEMPRE arranque en dark (tu caso):
    useEffect(() => {
        if (!document.documentElement.classList.contains("dark")) {
        document.documentElement.classList.add("dark");
        setIsDark(true); // ✅ esto es 1 sola vez; igual, si querés evitarlo, abajo te doy variante sin setState en effect
        }
    }, []);

    function setDark() {
        document.documentElement.classList.add("dark");
        setIsDark(true);
    }

    function setLight() {
        document.documentElement.classList.remove("dark");
        setIsDark(false);
    }

    function toggle() {
        if (document.documentElement.classList.contains("dark")) setLight();
        else setDark();
    }

    return { isDark, setDark, setLight, toggle };
    }

    export function SiteNavbar() {
    const { isDark, toggle, setDark, setLight } = useThemeToggle();
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            {/* Logo */}
            <Link to="/start" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-600/20 ring-1 ring-violet-500/30">
                <div className="h-2.5 w-2.5 rounded bg-violet-400" />
            </div>
            <span className="font-semibold tracking-wide">EVENTSAAS</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden items-center gap-6 md:flex">
            <NavItem to="/events">Quiero comprar entradas</NavItem>
            <Link
                to="/register?role=ORGANIZER"
                className="rounded-md border border-violet-500/30 bg-violet-600/10 px-3 py-1.5 text-sm text-violet-200 hover:bg-violet-600/20"
            >
                Quiero vender entradas
            </Link>
            <NavItem to="/events">Events</NavItem>
            </nav>

            {/* Right actions */}
            <div className="hidden items-center gap-2 md:flex">
            {/* Theme */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
                    {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-black/80 text-white border-white/10">
                <DropdownMenuItem onClick={setDark}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={setLight}>Light</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/login" className="text-sm text-white/70 hover:text-white">
                Login
            </Link>

            <Button asChild className="bg-violet-600 hover:bg-violet-500">
                <Link to="/register">Register</Link>
            </Button>
            </div>

            {/* Mobile */}
            <div className="flex items-center gap-2 md:hidden">
            <Button
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
                onClick={toggle}
                aria-label="Toggle theme"
            >
                {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                </Button>
                </SheetTrigger>

                <SheetContent side="right" className="bg-[#07040d] text-white border-white/10">
                <SheetHeader>
                    <SheetTitle className="text-white">Menu</SheetTitle>
                </SheetHeader>

                <div className="mt-6 grid gap-4">
                    <NavItem to="/events" onClick={() => setOpen(false)}>
                    Quiero comprar entradas
                    </NavItem>

                    <NavItem to="/register?role=ORGANIZER" onClick={() => setOpen(false)}>
                    Quiero vender entradas
                    </NavItem>

                    <NavItem to="/events" onClick={() => setOpen(false)}>
                    Events
                    </NavItem>

                    <Separator className="my-2 bg-white/10" />

                    <Button asChild variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
                    <Link to="/login" onClick={() => setOpen(false)}>
                        Login
                    </Link>
                    </Button>

                    <Button asChild className="bg-violet-600 hover:bg-violet-500">
                    <Link to="/register" onClick={() => setOpen(false)}>
                        Register
                    </Link>
                    </Button>
                </div>
                </SheetContent>
            </Sheet>
            </div>
        </div>
        </header>
    );
}
