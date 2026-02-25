import { Link } from "wouter";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300" role="contentinfo">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Civic Fix</h3>
            <p className="text-sm leading-relaxed">
              Community-powered platform connecting citizens, workers, and local
              leaders to solve neighborhood issues together.
            </p>
            <div className="flex gap-4 pt-2">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="hover:text-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-primary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="hover:text-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="hover:text-primary transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Legal & Compliance */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Legal & Compliance</h4>
            <nav aria-label="Legal links">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/legal/terms"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/privacy"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/refund"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/wallet"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Wallet & Payments
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/dispute"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Dispute Resolution
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/guidelines"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Community Guidelines
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/cookies"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/deletion"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Data Deletion
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/aml"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    AML Policy
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Transparency & Trust */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Transparency</h4>
            <nav aria-label="Transparency links">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/legal/how-it-works"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    How Payments Work
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/escrow"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Escrow Explanation
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/refund-timelines"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Refund Timelines
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/wallet-frozen"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Wallet Freeze Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/fees"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Platform Fees
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/chargeback"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Chargeback Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/legal/verification"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    User Verification
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold">Company</h4>
            <nav aria-label="Company links">
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="/help"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/press"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Press
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-sm hover:text-primary transition-colors"
                  >
                    Blog
                  </Link>
                </li>
              </ul>
            </nav>
            <div className="pt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4" />
                <span>support@civicfix.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4" />
                <span>1-800-CIVIC-FIX</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4" />
                <span>Serving Communities Nationwide</span>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Disclaimer */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h5 className="text-white font-semibold mb-2">
              Platform Disclaimer
            </h5>
            <p className="text-xs leading-relaxed text-gray-400">
              Civic Fix operates as an intermediary platform connecting users
              for community-driven projects. We do not employ workers, guarantee
              job completion, or warrant the quality of work performed. Users
              are independent parties who contract directly with each other. The
              platform facilitates transactions but is not a party to any
              agreement between users. All disputes between users are handled
              directly between the parties involved.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © {currentYear} Civic Fix. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link
              href="/legal/limitation"
              className="hover:text-gray-400 transition-colors"
            >
              Limitation of Liability
            </Link>
            <Link
              href="/legal/disclaimer"
              className="hover:text-gray-400 transition-colors"
            >
              Platform Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
