import Link from "next/link";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        {/* ─── Main columns ─── */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <Image
                src="/logo/kanek_logo_icon.svg"
                alt="kanek"
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
              />
              <span className="text-lg font-bold tracking-tight">kanek</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Community mobility for Belize. People helping people move.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/download" className="hover:text-foreground transition-colors">Download</Link></li>
              <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              <li><Link href="/join" className="hover:text-foreground transition-colors">Join</Link></li>
            </ul>
          </div>

          {/* Ecosystem */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Ecosystem</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://belizechain.org" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">BelizeChain</a></li>
              <li><a href="https://github.com/BelizeChain/nawal-ai" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Nawal AI</a></li>
              <li><a href="https://github.com/BelizeChain/kinich-quantum" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Kinich Quantum</a></li>
              <li><a href="https://github.com/BelizeChain/pakit-storage" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Pakit Storage</a></li>
              <li><a href="https://github.com/BelizeChain/gem" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GEM</a></li>
              <li><a href="https://github.com/BelizeChain/ui" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Maya Wallet</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Connect</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/contact" className="hover:text-foreground transition-colors">Support</Link></li>
              <li>
                <a href="mailto:hello@kanek.bz" className="hover:text-foreground transition-colors">
                  hello@kanek.bz
                </a>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-foreground transition-colors">
                  Admin
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Bottom bar ─── */}
        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} kanek. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with love in Belize 🇧🇿
          </p>
        </div>
      </div>
    </footer>
  );
}
