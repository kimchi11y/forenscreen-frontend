import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  Folder,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Scale,
  Search,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { cn } from "@/lib/utils";

const WORKSPACE_NAV = [
  { to: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  { to: "/assets", label: "Registry", Icon: ImageIcon },
  { to: "/cases", label: "Cases", Icon: Folder },
  { to: "/analyze", label: "Analyze", Icon: Scale },
];

const ACCOUNT_NAV = [
  { to: "/check", label: "Public check", Icon: Search, isPublic: true },
  { to: "/settings", label: "Settings", Icon: Settings },
];

function NavItem({ to, label, Icon, isPublic }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-[0.5625rem] px-2.5 py-[7px] text-sm font-medium",
          "text-sidebar-foreground transition-colors",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
            : "hover:bg-sidebar-accent",
        )
      }
    >
      <Icon className={cn("size-4 shrink-0", isPublic ? "opacity-70" : "opacity-75")} />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

/**
 * The authenticated application frame: fixed sidebar, sticky top bar, content
 * column. Pages render their own heading inside it via <PageHeader>.
 */
export default function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-1 border-r border-sidebar-border bg-sidebar p-3 lg:flex">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-2 pb-4 pt-1.5">
          <span className="grid size-[30px] shrink-0 place-items-center rounded-[9px] bg-primary text-primary-foreground shadow-md">
            <ShieldCheck className="size-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-[0.9375rem] font-semibold tracking-tight">ForenScreen</span>
            <span className="text-[0.6875rem] text-muted-foreground">Evidence registry</span>
          </span>
        </Link>

        <p className="px-2 pb-1 pt-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        <nav className="flex flex-col gap-1" aria-label="Workspace">
          {WORKSPACE_NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <p className="px-2 pb-1 pt-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </p>
        <nav className="flex flex-col gap-1" aria-label="Account">
          {ACCOUNT_NAV.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2.5 rounded-[0.5625rem] border-t border-sidebar-border p-2 pt-3">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            AR
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-[0.8125rem] font-medium">Aisha Rahman</span>
            <span className="block truncate text-[0.6875rem] text-muted-foreground">
              Personal account
            </span>
          </span>
          <LogOut className="size-4 shrink-0 text-muted-foreground" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-[60px] items-center gap-4 border-b border-border bg-background/85 px-5 backdrop-blur lg:px-6">
          <div className="relative hidden max-w-sm flex-1 sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              placeholder="Search files, hashes, cases…"
              aria-label="Search registry"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            {pathname !== "/check" && (
              <Link
                to="/check"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-[0.8125rem] font-medium transition-colors hover:bg-accent"
              >
                <Search className="size-3.5" />
                Public check
              </Link>
            )}
            <button
              type="button"
              aria-label="Notifications"
              className="relative grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1240px] px-5 pb-16 pt-7 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Standard page heading: title, optional description, optional actions. */
export function PageHeader({ title, description, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.75rem] font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
