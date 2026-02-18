import Link from 'next/link';
import { RadianceLogo } from './RadianceLogo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div>
            <RadianceLogo variant="text" size="md" className="mb-4" />
            <p className="text-sm text-slate-400 mb-6">
              Integrated PR, events, and digital marketing for Hong Kong brands.
            </p>
            <div className="flex gap-4">
              <a href="#" aria-label="Follow Radiance on LinkedIn" className="text-slate-400 hover:text-purple-400 transition">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </a>
              <a href="#" aria-label="Follow Radiance on Instagram" className="text-slate-400 hover:text-purple-400 transition">
                <span className="sr-only">Instagram</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm0 2.5c2.633 0 2.947.01 3.986.058 1.01.046 1.56.211 1.925.349.484.188.829.481 1.191.843.362.362.655.707.843 1.191.138.365.303.915.349 1.925.048 1.039.058 1.353.058 3.986 0 2.633-.01 2.947-.058 3.986-.046 1.01-.211 1.56-.349 1.925-.188.484-.481.829-.843 1.191-.362.362-.707.655-1.191.843-.365.138-.915.303-1.925.349-1.039.048-1.353.058-3.986.058-2.633 0-2.947-.01-3.986-.058-1.01-.046-1.56-.211-1.925-.349-.484-.188-.829-.481-1.191-.843-.362-.362-.655-.707-.843-1.191-.138-.365-.303-.915-.349-1.925-.048-1.039-.058-1.353-.058-3.986 0-2.633.01-2.947.058-3.986.046-1.01.211-1.56.349-1.925.188-.484.481-.829.843-1.191.362-.362.707-.655 1.191-.843.365-.138.915-.303 1.925-.349 1.039-.048 1.353-.058 3.986-.058zm0-1.5c-2.716 0-3.056.012-4.123.06-1.064.049-1.79.218-2.427.465-.658.254-1.216.597-1.772 1.153-.556.556-.899 1.114-1.153 1.772-.247.637-.416 1.363-.465 2.427-.048 1.067-.06 1.407-.06 4.123s.012 3.056.06 4.123c.049 1.064.218 1.79.465 2.427.254.658.597 1.216 1.153 1.772.556.556 1.114.899 1.772 1.153.637.247 1.363.416 2.427.465 1.067.048 1.407.06 4.123.06s3.056-.012 4.123-.06c1.064-.049 1.79-.218 2.427-.465.658-.254 1.216-.597 1.772-1.153.556-.556.899-1.114 1.153-1.772.247-.637.416-1.363.465-2.427.048-1.067.06-1.407.06-4.123s-.012-3.056-.06-4.123c-.049-1.064-.218-1.79-.465-2.427-.254-.658-.597-1.216-1.153-1.772-.556-.556-1.114-.899-1.772-1.153-.637-.247-1.363-.416-2.427-.465-1.067-.048-1.407-.06-4.123-.06z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="font-semibold text-white mb-6">Services</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/vibe-demo/radiance/services/public-relations"
                  className="text-sm text-slate-400 hover:text-purple-400 transition"
                >
                  Public Relations
                </Link>
              </li>
              <li>
                <Link
                  href="/vibe-demo/radiance/services/social-media"
                  className="text-sm text-slate-400 hover:text-purple-400 transition"
                >
                  Social Media & Content
                </Link>
              </li>
              <li>
                <Link
                  href="/vibe-demo/radiance/services/kol-marketing"
                  className="text-sm text-slate-400 hover:text-purple-400 transition"
                >
                  KOL & Influencer Marketing
                </Link>
              </li>
              <li>
                <Link
                  href="/vibe-demo/radiance/services/events"
                  className="text-sm text-slate-400 hover:text-purple-400 transition"
                >
                  Events & Experiences
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="font-semibold text-white mb-6">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/vibe-demo/radiance/about"
                  className="text-sm text-slate-400 hover:text-purple-400 transition"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/vibe-demo/radiance/case-studies"
                  className="text-sm text-slate-400 hover:text-purple-400 transition"
                >
                  Case Studies
                </Link>
              </li>
              <li>
                <Link
                  href="/vibe-demo/radiance/team"
                  className="text-sm text-slate-400 hover:text-purple-400 transition"
                >
                  Team
                </Link>
              </li>
              <li>
                <Link
                  href="/vibe-demo/radiance/blog"
                  className="text-sm text-slate-400 hover:text-purple-400 transition"
                >
                  Blog & Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-semibold text-white mb-6">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li className="text-slate-400">
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email</span>
                <a href="mailto:hello@radiancehk.com" className="hover:text-purple-400 transition">
                  hello@radiancehk.com
                </a>
              </li>
              <li className="text-slate-400">
                <span className="block text-xs font-semibold text-slate-500 uppercase mb-1">Location</span>
                Hong Kong
              </li>
              <li className="pt-4">
                <Link
                  href="/vibe-demo/radiance/contact"
                  className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
            <p>&copy; {currentYear} Radiance PR & Martech Limited. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-purple-400 transition">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-purple-400 transition">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
