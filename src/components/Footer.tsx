import Link from "next/link";
import { BookOpen } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-parchment-200 bg-parchment-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-4">
          {/* Product */}
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-parchment-600" />
              <span className="font-serif font-bold text-ink-900">
                SafeReads
              </span>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li>
                <Link
                  href="/about"
                  className="transition-colors hover:text-ink-700"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-ink-700"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-serif font-bold text-ink-900">Legal</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li>
                <Link
                  href="/privacy"
                  className="transition-colors hover:text-ink-700"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="transition-colors hover:text-ink-700"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Safe Family */}
          <div>
            <h4 className="font-serif font-bold text-ink-900">Safe Family</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li>
                <a
                  href="https://getsafereads.com"
                  className="transition-colors hover:text-ink-700"
                >
                  SafeReads &middot; Books
                </a>
              </li>
              <li>
                <a
                  href="https://getsafetunes.com"
                  className="transition-colors hover:text-ink-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SafeTunes &middot; Music
                </a>
              </li>
              <li>
                <a
                  href="https://getsafetube.com"
                  className="transition-colors hover:text-ink-700"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SafeTube &middot; YouTube
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-bold text-ink-900">Get in Touch</h4>
            <p className="mt-3 text-sm text-ink-500">
              Questions, feedback, or suggestions?
            </p>
            <a
              href="mailto:jedaws@gmail.com"
              className="mt-1 inline-block text-sm text-parchment-700 transition-colors hover:text-parchment-800"
            >
              jedaws@gmail.com
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-parchment-200 pt-6 text-center text-sm text-ink-400">
          <p>
            &copy; {new Date().getFullYear()} SafeReads. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
