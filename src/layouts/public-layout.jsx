import { Link, Outlet } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

/**
 * Frame for the marketing and public-verification pages: a slim header and
 * footer, no sidebar. Signed-in chrome must not appear here - a first-time
 * visitor may have no account at all.
 */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-[60px] w-full max-w-[1200px] items-center gap-4 px-5 lg:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid size-[30px] place-items-center rounded-[9px] bg-primary text-primary-foreground shadow-md">
              <ShieldCheck className="size-4" />
            </span>
            <span className="text-[0.9375rem] font-semibold tracking-tight">ForenScreen</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-5 text-sm text-muted-foreground md:flex">
            <a href="/#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="/#verdicts" className="transition-colors hover:text-foreground">
              Verdicts
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/login"
              className="inline-flex h-8 items-center rounded-lg px-2.5 text-[0.8125rem] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/check"
              className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-[0.8125rem] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Check an image
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-5 py-6 text-xs text-muted-foreground lg:px-6">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-3.5" />
            ForenScreen — digital evidence integrity
          </span>
          <span className="flex items-center gap-4">
            <Link to="/check" className="transition-colors hover:text-foreground">
              Check an image
            </Link>
            <Link to="/login" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
            <span>© 2026 ForenScreen</span>
          </span>
        </div>
      </footer>
    </div>
  );
}
