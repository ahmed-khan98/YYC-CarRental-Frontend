import { Link } from "react-router-dom";
import { CarFront, MapPin, Phone, Mail } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/50 bg-card mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <CarFront className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">YYC<span className="text-primary">Drive</span></span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Premium car rentals in Calgary. Drive your vibe.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/cars" className="hover:text-primary transition-colors cursor-pointer">Browse Cars</Link></li>
              <li><Link to="/dashboard" className="hover:text-primary transition-colors cursor-pointer">My Bookings</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors cursor-pointer">About Us</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><MapPin className="h-3 w-3 shrink-0" /> Calgary, AB, Canada</li>
              <li className="flex items-center gap-2"><Phone className="h-3 w-3 shrink-0" /> +1 (403) 000-0000</li>
              <li className="flex items-center gap-2"><Mail className="h-3 w-3 shrink-0" /> hello@yycdrive.ca</li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span></li>
              <li><span className="hover:text-primary transition-colors cursor-pointer">Cookie Policy</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>&copy; {year} YYCDrive. All rights reserved.</span>
          <span>Built with passion in Calgary.</span>
        </div>
      </div>
    </footer>
  );
}
