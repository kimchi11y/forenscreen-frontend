import { useState } from "react";
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  Puzzle,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Scale,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const WORKSPACE_NAV = [
  { to: "/dashboard", label: "Overview", Icon: LayoutDashboard },
  { to: "/assets", label: "Registry", Icon: ImageIcon },
  { to: "/analyze", label: "Analyze", Icon: Scale },
];

const ACCOUNT_NAV = [
  { to: "/check", label: "Public check", Icon: Search, isPublic: true },
  { to: "/extension", label: "Browser extension", Icon: Puzzle },
  { to: "/settings", label: "Settings", Icon: Settings },
];

function NavItem({ to, label, Icon, isPublic, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-[0.5625rem] px-2.5 py-2.5 text-sm font-medium lg:py-[7px]",
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

/** First letters of the first two words, else the first two characters. */
function initialsOf(value) {
  const source = String(value ?? "").trim();
  if (!source) return "?";
  const words = source.split(/\s+/).filter(Boolean);
  const raw =
    words.length > 1 ? `${words[0][0]}${words[1][0]}` : source.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2);
  return raw.slice(0, 2).toUpperCase() || "?";
}

/**
 * Everything in the sidebar. Rendered twice: fixed on wide screens, and inside
 * the slide-in menu on phones and tablets, where `onNavigate` closes the menu.
 */
function SidebarContent({ user, displayName, displayEmail, onSignOut, signingOut, onNavigate }) {
  return (
    <>
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2.5 px-2 pb-4 pt-1.5">
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
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      <p className="px-2 pb-1 pt-3 text-[0.6875rem] font-semibold uppercase tracking-wider text-muted-foreground">
        Account
      </p>
      <nav className="flex flex-col gap-1" aria-label="Account">
        {ACCOUNT_NAV.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onNavigate} />
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-2.5 rounded-[0.5625rem] border-t border-sidebar-border p-2 pt-3">
        {user?.image ? (
          <img
            src={user.image}
            alt=""
            className="size-7 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold text-primary"
          >
            {initialsOf(displayName)}
          </span>
        )}
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[0.8125rem] font-medium">{displayName}</span>
          {displayEmail && (
            <span className="block truncate text-[0.6875rem] text-muted-foreground">
              {displayEmail}
            </span>
          )}
        </span>
        <button
          type="button"
          aria-label="Sign out"
          title="Sign out"
          onClick={onSignOut}
          disabled={signingOut}
          className="grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent lg:size-7 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          <LogOut className="size-4" />
        </button>
      </div>
    </>
  );
}

/** The sidebar as a drawer, for screens too narrow to keep it open. */
function MobileNav({ open, onOpenChange, ...sidebarProps }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="-ml-1.5 grid size-9 shrink-0 place-items-center rounded-lg text-foreground transition-colors hover:bg-accent lg:hidden"
        >
          <Menu className="size-5" />
        </button>
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/30 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 lg:hidden" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col gap-1 overflow-y-auto border-r border-sidebar-border bg-sidebar p-3 shadow-xl outline-none duration-200 data-open:animate-in data-open:slide-in-from-left data-closed:animate-out data-closed:slide-out-to-left lg:hidden"
        >
          <DialogPrimitive.Title className="sr-only">Menu</DialogPrimitive.Title>
          <DialogPrimitive.Close
            aria-label="Close menu"
            className="absolute right-2.5 top-3 grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
          >
            <X className="size-5" />
          </DialogPrimitive.Close>
          <SidebarContent {...sidebarProps} onNavigate={() => onOpenChange(false)} />
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/**
 * The authenticated application frame: fixed sidebar, sticky top bar, content
 * column. Pages render their own heading inside it via <PageHeader>.
 */
export default function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, loading, configured, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (loading) {
    return (
      <div
        className="grid min-h-screen place-items-center bg-background"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <span className="size-7 animate-spin rounded-full border-2 border-border border-t-primary" />
          <span className="text-sm">Checking your session…</span>
        </div>
      </div>
    );
  }

  // Deliberately not redirecting when unconfigured: that is a setup problem,
  // not a signed-out state, so keep the app inspectable and say so plainly.
  if (configured && !user) {
    return <Navigate to="/login" replace />;
  }

  const displayName = user?.name || user?.email || "Signed in";
  const displayEmail = user?.email || "";

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch {
      // signOut() should never throw; if it somehow does, still leave the shell.
    } finally {
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col gap-1 border-r border-sidebar-border bg-sidebar p-3 lg:flex">
        <SidebarContent
          user={user}
          displayName={displayName}
          displayEmail={displayEmail}
          onSignOut={handleSignOut}
          signingOut={signingOut}
        />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur sm:gap-4 sm:px-5 lg:h-[60px] lg:px-6">
          <MobileNav
            open={menuOpen}
            onOpenChange={setMenuOpen}
            user={user}
            displayName={displayName}
            displayEmail={displayEmail}
            onSignOut={handleSignOut}
            signingOut={signingOut}
          />
          <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <ShieldCheck className="size-3.5" />
            </span>
            <span className="text-[0.9375rem] font-semibold tracking-tight">ForenScreen</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {pathname !== "/check" && (
              <Link
                to="/check"
                aria-label="Public check"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 text-[0.8125rem] font-medium transition-colors hover:bg-accent sm:h-8"
              >
                <Search className="size-3.5" />
                <span className="hidden sm:inline">Public check</span>
              </Link>
            )}
            <button
              type="button"
              aria-label="Notifications"
              className="relative hidden size-8 place-items-center lg:grid rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1240px] px-4 pb-16 pt-5 sm:px-5 sm:pt-7 lg:px-6">
          {!configured && (
            <div
              role="alert"
              className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive"
            >
              <ShieldAlert className="mt-0.5 size-5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">Authentication is not configured</p>
                <p className="text-sm text-destructive/80">
                  <code className="font-mono text-[0.8125rem]">VITE_NEON_AUTH_URL</code> is missing,
                  so sign-in and sign-out are unavailable. This page is shown for development
                  only; no account is signed in.
                </p>
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/** Standard page heading: title, optional description, optional actions. */
export function PageHeader({ title, description, children }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{title}</h1>
        {description && <p className="mt-1 break-words text-sm text-muted-foreground">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}
