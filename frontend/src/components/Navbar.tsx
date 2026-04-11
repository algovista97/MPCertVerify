import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck, LogOut } from "lucide-react";

const Navbar = () => {
  const { isLoggedIn, role, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/verify", label: "Verify" },
    ...(isLoggedIn && role === "institution" ? [{ to: "/upload", label: "Issue" }] : []),
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <ShieldCheck className="h-6 w-6 text-primary transition-transform group-hover:scale-110 group-active:scale-95" />
          <span className="text-lg font-bold tracking-tight">CertVerify</span>
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "text-foreground bg-secondary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <button
              type="button"
              onClick={logout}
              className="ml-2 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors active:scale-95"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="ml-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors active:scale-95"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
