import { Link, Outlet } from "react-router-dom";
import { Menu, ShieldCheck } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Frame for the marketing and public-verification pages: a slim header and
 * footer, no sidebar. Signed-in chrome must not appear here - a first-time
 * visitor may have no account at all.
 */
export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center gap-3 px-4 sm:h-[60px] sm:gap-4 sm:px-5 lg:px-6">
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
            <Link to="/verify" className="transition-colors hover:text-foreground">
              Verify a fingerprint
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="More pages"
                className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
              >
                <Menu className="size-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem asChild className="py-2">
                  <a href="/#how-it-works">How it works</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="py-2">
                  <a href="/#verdicts">Verdicts</a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="py-2">
                  <Link to="/verify">Verify a fingerprint</Link>
                </DropdownMenuItem>
                {/* The header's own Sign in link is hidden on the narrowest screens. */}
                <DropdownMenuItem asChild className="py-2 sm:hidden">
                  <Link to="/login">Sign in</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              to="/login"
              className="hidden h-9 items-center rounded-lg px-2.5 text-[0.8125rem] font-medium whitespace-nowrap text-muted-foreground sm:inline-flex sm:h-8 transition-colors hover:bg-accent hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/check"
              className="inline-flex h-9 items-center rounded-lg bg-primary px-3 text-[0.8125rem] font-medium whitespace-nowrap text-primary-foreground sm:h-8 shadow-sm transition-colors hover:bg-primary/90"
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
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:px-5 lg:px-6">
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-3.5" />
            ForenScreen — digital evidence integrity
          </span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link to="/check" className="transition-colors hover:text-foreground">
              Check an image
            </Link>
            <Link to="/verify" className="transition-colors hover:text-foreground">
              Verify a fingerprint
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
