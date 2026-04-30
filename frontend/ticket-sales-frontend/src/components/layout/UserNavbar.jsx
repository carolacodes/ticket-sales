import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NavItem = ({ to, children }) => (
  <NavLink
    to={to}
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

export function UserNavbar({ onLogout }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link to="/start" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-600/20 ring-1 ring-violet-500/30">
            <div className="h-2.5 w-2.5 rounded bg-violet-400" />
          </div>
          <span className="font-semibold tracking-wide">TICKETIFY</span>
        </Link>

        {/* Center nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <NavItem to="/my-tickets">My Tickets</NavItem>
          <NavItem to="/my-purchases">My Purchases</NavItem>
          <NavItem to="/events">Events</NavItem>
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 hover:bg-white/10"
            aria-label="Notifications"
          >
            🔔
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/5">
                <span className="text-xs text-white/80">👤</span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="border-white/10 bg-black/80 text-white">
              <DropdownMenuItem asChild>
                <Link to="/my-profile">My Profile</Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/my-purchases">My Purchases</Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link to="/my-tickets">My Tickets</Link>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}