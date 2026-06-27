"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useUserContext } from "@/context/UserContext";
import { Menu, LayoutDashboard, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Container from "@/components/shared/Container";
import logo from "@/assets/logo.svg";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/admin-utils";

const NAV_LINKS = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Find Doctors",
    href: "/doctors",
  },
  {
    label: "About Us",
    href: "/about",
  },
  {
    label: "Contact Us",
    href: "/contact",
  },
];

const ROLE_LABELS = {
  admin: "Administrator",
  doctor: "Doctor",
  patient: "Patient",
};

function linkClass(href, pathname, isDashboard = false) {
  const active = isDashboard
    ? pathname.startsWith("/dashboard")
    : pathname === href;
  return cn(
    "text-sm font-medium transition-colors",
    active ? "text-primary" : "text-muted-foreground hover:text-primary",
  );
}

/**
 * Renders the main navigation links.
 * @param {string}   pathname   - current pathname
 * @param {boolean}  isLoggedIn - whether the user is authenticated
 * @param {function} [onNavigate] - optional callback (used on mobile to close the sheet)
 */
function NavLinks({ pathname, isLoggedIn, onNavigate }) {
  return (
    <>
      {NAV_LINKS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={linkClass(href, pathname)}
        >
          {label}
        </Link>
      ))}

      {isLoggedIn && (
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className={linkClass("/dashboard", pathname, true)}
        >
          Dashboard
        </Link>
      )}
    </>
  );
}

function AvatarTrigger({ user }) {
  return (
    <>
      <Avatar className="h-9 w-9">
        <AvatarImage
          src={user?.image || ""}
          alt={user?.name || "User avatar"}
        />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
          {getInitials(user?.name) || "U"}
        </AvatarFallback>
      </Avatar>
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
    </>
  );
}

function UserMenu({ user, onLogout }) {
  const userDisplayName = user?.name || "User";
  const roleLabel = ROLE_LABELS[user?.role] || user?.role || "Member";

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="relative outline-none ring-2 ring-transparent rounded-full transition-all duration-200 hover:ring-primary/30 focus-visible:ring-primary/60">
        <AvatarTrigger user={user} />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-64 rounded-xl p-2 shadow-lg shadow-black/5"
      >
        <div className="mb-1 rounded-lg bg-muted/50 px-3 py-3 flex items-center gap-3">
          <span className="relative block shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user?.image || ""}
                alt={user?.name || "User avatar"}
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(user?.name) || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm leading-tight">
              {userDisplayName}
            </p>
            <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium capitalize text-primary leading-none">
              {roleLabel}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard"
            className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium"
          >
            <LayoutDashboard className="mr-2.5 h-4 w-4 text-muted-foreground" />
            My Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-destructive data-disabled:opacity-50 data-disabled:cursor-not-allowed"
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Mobile slide-out menu
 * Receives only the props it really needs.
 */
function MobileMenu({ pathname, isLoggedIn, isPending, onLogout }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-75 p-6">
        <div className="flex flex-col gap-6">
          <nav className="flex flex-col gap-4">
            <NavLinks
              pathname={pathname}
              isLoggedIn={isLoggedIn}
              onNavigate={close}
            />
          </nav>

          {isLoggedIn ? (
            <div className="flex flex-col gap-4 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={() => {
                  onLogout();
                  close();
                }}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          ) : (
            !isPending && (
              <div className="flex flex-col gap-3 pt-4 border-t">
                <Link href="/login" onClick={close}>
                  <Button variant="outline" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/register" onClick={close}>
                  <Button className="w-full">Register</Button>
                </Link>
              </div>
            )
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  const { user: contextUser } = useUserContext();
  const pathname = usePathname();
  const router = useRouter();

  const isLoggedIn = !isPending && !!session?.user;
  const user = contextUser || session?.user;

  const handleSignOut = async () => {
    await authClient.signOut();
    toast.success("Logged out successfully");
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <Container className="flex h-18 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={logo}
            alt="MediCare Connect Logo"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="flex flex-col leading-none text-lg text-primary md:text-xl">
            <span className="font-bold">MediCare</span>
            <span>Connect</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-8 md:flex">
          <NavLinks pathname={pathname} isLoggedIn={isLoggedIn} />
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          {isPending ? (
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          ) : isLoggedIn ? (
            <UserMenu user={user} onLogout={handleSignOut} />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground hover:text-primary"
              >
                Login
              </Link>
              <Button asChild className="rounded-full px-6">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile: Avatar + Sheet */}
        <div className="flex items-center gap-3 md:hidden">
          {isPending ? (
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          ) : isLoggedIn ? (
            <UserMenu user={user} onLogout={handleSignOut} />
          ) : (
            <Button asChild size="sm" className="rounded-full px-5">
              <Link href="/login">Login</Link>
            </Button>
          )}

          <MobileMenu
            pathname={pathname}
            isLoggedIn={isLoggedIn}
            isPending={isPending}
            onLogout={handleSignOut}
          />
        </div>
      </Container>
    </nav>
  );
}
