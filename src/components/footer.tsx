import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Mail } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo.tsx";

function FooterNavLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="hover:text-primary transition-colors cursor-pointer">
      {children}
    </Link>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center">
              <Link to="/" className="cursor-pointer">
                <BrandLogo variant="footer" />
              </Link>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium car rentals in Calgary. Drive your vibe.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><FooterNavLink to="/cars">Browse Cars</FooterNavLink></li>
              <li><FooterNavLink to="/dashboard">My Bookings</FooterNavLink></li>
              <li><FooterNavLink to="/about">About Us</FooterNavLink></li>
              <li><FooterNavLink to="/faq">FAQ</FooterNavLink></li>
              <li><FooterNavLink to="/contact">Contact Us</FooterNavLink></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><MapPin className="h-3 w-3 shrink-0 text-primary" /> Calgary, Alberta, Canada</li>
              <li className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0 text-primary" /> (825) 779-7797</li>
              <li className="flex items-center gap-2"><Mail className="h-3 w-3 shrink-0 text-primary" /> info@yyccarrental.com</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><FooterNavLink to="/privacy">Privacy Policy</FooterNavLink></li>
              <li><FooterNavLink to="/terms">Terms of Service</FooterNavLink></li>
              <li><FooterNavLink to="/faq">FAQ</FooterNavLink></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>&copy; {year} YYC Car Rental. All rights reserved.</span>
          <span>Built with passion in Calgary.</span>
        </div>
      </div>
    </footer>
  );
}
