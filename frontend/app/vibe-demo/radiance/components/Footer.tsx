import Link from 'next/link';
import { RadianceLogo } from './RadianceLogo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Column */}
          <div>
            <RadianceLogo variant="text" size="md" className="mb-6" />
            <a href="#" aria-label="Follow Radiance on Instagram" className="text-slate-400 hover:text-purple-400 transition inline-block">
              <span className="sr-only">Instagram</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>

          {/* Navigation Column */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-white mb-6 text-sm uppercase tracking-wide">Services</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/vibe-demo/radiance/services/public-relations" className="text-sm text-slate-400 hover:text-purple-400 transition">
                    Public Relations
                  </Link>
                </li>
                <li>
                  <Link href="/vibe-demo/radiance/services/events" className="text-sm text-slate-400 hover:text-purple-400 transition">
                    Events & Experiences
                  </Link>
                </li>
                <li>
                  <Link href="/vibe-demo/radiance/services/social-media" className="text-sm text-slate-400 hover:text-purple-400 transition">
                    Social Media & Content
                  </Link>
                </li>
                <li>
                  <Link href="/vibe-demo/radiance/services/kol-marketing" className="text-sm text-slate-400 hover:text-purple-400 transition">
                    KOL & Influencer Marketing
                  </Link>
                </li>
                <li>
                  <Link href="/vibe-demo/radiance/services/creative-production" className="text-sm text-slate-400 hover:text-purple-400 transition">
                    Creative & Production
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-6 text-sm uppercase tracking-wide">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/vibe-demo/radiance/about" className="text-sm text-slate-400 hover:text-purple-400 transition">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/vibe-demo/radiance/case-studies" className="text-sm text-slate-400 hover:text-purple-400 transition">
                    Case Studies
                  </Link>
                </li>
                <li>
                  <Link href="/vibe-demo/radiance/blog" className="text-sm text-slate-400 hover:text-purple-400 transition">
                    Blog & Insights
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-semibold text-white mb-6 text-sm uppercase tracking-wide">Get in Touch</h4>
            <ul className="space-y-4 text-sm">
              <li className="text-slate-400">
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</span>
                <a href="mailto:mandy@radiancehk.com" className="hover:text-purple-400 transition">
                  mandy@radiancehk.com
                </a>
              </li>
              <li className="pt-2">
                <Link
                  href="/vibe-demo/radiance/consultation"
                  className="inline-block px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
                >
                  Book a Free Consultation
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8">
          <p className="text-sm text-slate-500 text-center">
            &copy; {currentYear} Radiance PR & Martech Limited. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
