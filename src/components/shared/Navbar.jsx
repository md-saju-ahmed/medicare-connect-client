"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LayoutDashboard, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import Container from "@/components/shared/Container";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "@/assets/logo.svg";
import { authClient } from "@/lib/auth-client";

const navLinks = [
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

function UserMenu({ user, onLogout, dashboardPath }) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="relative outline-none ring-2 ring-transparent rounded-full transition-all duration-200 hover:ring-primary/30 focus-visible:ring-primary/60">
        <Avatar className="h-9 w-9">
          <AvatarImage src={user.image} alt={user.name} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {user.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-64 rounded-xl p-2 shadow-lg shadow-black/5"
      >
        <div className="mb-1 rounded-lg bg-muted/50 px-3 py-3 flex items-center gap-3">
          <span className="relative block shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.image} alt={user.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-sm leading-tight">
              {user.name}
            </p>
            <span className="mt-0.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium capitalize text-primary leading-none">
              {user.role}
            </span>
          </div>
        </div>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem asChild>
          <Link
            href={dashboardPath}
            className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium"
          >
            <LayoutDashboard className="mr-2.5 h-4 w-4 text-muted-foreground" />
            My Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem
          onClick={onLogout}
          className="cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium text-destructive"
        >
          <LogOut className="mr-2.5 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu({ user, dashboardPath, pathname, onLogout }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-75 p-6">
        <div className="flex flex-col gap-6">
          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {user && (
              <Link
                href={dashboardPath}
                className={`text-sm font-medium transition-colors ${
                  pathname.startsWith("/dashboard")
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Mobile User Actions */}
          {user ? (
            <div className="flex flex-col gap-4 pt-4 border-t">
              <Button
                variant="destructive"
                onClick={onLogout}
                className="w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pt-4 border-t">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="w-full rounded-full">Register</Button>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { data: session, isPending } = authClient.useSession();

  const user = session?.user;
  const loading = isPending;

  const dashboardPath = user ? `/dashboard/${user.role}` : "/dashboard/patient";

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      toast.success("Logged out successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      toast.error(error.message || "Logout failed");
    }
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

        {/* Desktop Links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {user && (
            <Link
              href={dashboardPath}
              className={`text-sm font-medium transition-colors ${
                pathname.startsWith("/dashboard")
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-4 md:flex">
          {loading ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : user ? (
            <UserMenu
              user={user}
              onLogout={handleLogout}
              dashboardPath={dashboardPath}
            />
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

        {/* Mobile Menu */}
        <div className="flex items-center gap-3 md:hidden">
          {loading ? (
            <Skeleton className="h-10 w-10 rounded-full" />
          ) : user ? (
            <UserMenu
              user={user}
              onLogout={handleLogout}
              dashboardPath={dashboardPath}
            />
          ) : (
            <Button asChild size="sm" className="rounded-full px-5">
              <Link href="/login">Login</Link>
            </Button>
          )}

          <MobileMenu
            user={user}
            dashboardPath={dashboardPath}
            pathname={pathname}
            onLogout={handleLogout}
          />
        </div>
      </Container>
    </nav>
  );
}
