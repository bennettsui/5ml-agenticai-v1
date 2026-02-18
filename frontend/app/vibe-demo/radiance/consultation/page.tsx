'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function ConsultationPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    industry: '',
    serviceInterest: '',
    budget: '',
    timeline: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/radiance/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form');
      }

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        industry: '',
        serviceInterest: '',
        budget: '',
        timeline: '',
        message: ''
      });

      setTimeout(() => {
        setSubmitted(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative py-24 px-6 bg-gradient-to-br from-purple-50 via-white to-slate-50 dark:from-purple-950/30 dark:via-slate-950 dark:to-slate-900 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 right-10 w-72 h-72 bg-purple-200 dark:bg-purple-900/20 rounded-full blur-3xl opacity-30"></div>
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-100 dark:bg-purple-900/10 rounded-full blur-3xl opacity-20"></div>
          </div>

          <div className="max-w-5xl mx-auto relative z-10 text-center">
            <h1 className="text-6xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Free Strategy Consultation
            </h1>
            <p className="text-2xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-3xl mx-auto font-light">
              Let's explore how integrated PR, events, and digital strategies can accelerate your brand growth in Hong Kong
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase">What you get</p>
                <p className="text-slate-700 dark:text-slate-300 mt-2">30-min strategy session • Market audit • Concrete recommendations</p>
              </div>
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <section className="py-16 px-6 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Why Radiance */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Why Radiance?</h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Integrated Approach</h3>
                      <p className="text-slate-600 dark:text-slate-400">PR, events, and digital working together—not in silos. Every channel amplifies the others.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Deep Local Expertise</h3>
                      <p className="text-slate-600 dark:text-slate-400">Hong Kong market knowledge. Understanding of local media, audiences, and cultural dynamics.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Real Execution</h3>
                      <p className="text-slate-600 dark:text-slate-400">Not just strategy. We handle the details—media relationships, event logistics, content management.</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Diverse Experience</h3>
                      <p className="text-slate-600 dark:text-slate-400">From tech to fashion to NGOs. We've navigated different sectors and bring best practices across industries.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-8 border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">What happens next?</h3>
                <ol className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                  <li className="flex gap-3">
                    <span className="font-bold text-purple-600 dark:text-purple-400">1</span>
                    <span>We review your submission and confirm your meeting time (within 24 hours)</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-purple-600 dark:text-purple-400">2</span>
                    <span>30-minute video or phone call with our strategy team</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold text-purple-600 dark:text-purple-400">3</span>
                    <span>We share actionable recommendations and explore how Radiance can help</span>
                  </li>
                </ol>
              </div>
            </div>

            {/* Consultation Form */}
            <div>
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Book Your Consultation</h2>

                {submitted ? (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                    <h3 className="font-semibold text-green-900 dark:text-green-200 mb-2">✓ Thank you!</h3>
                    <p className="text-green-800 dark:text-green-300">We've received your submission and will be in touch within 24 hours to confirm your consultation time.</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
                    <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">Error</h3>
                    <p className="text-red-800 dark:text-red-300">{error}</p>
                  </div>
                ) : null}

                {!submitted && (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                          placeholder="your.email@company.com"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                          placeholder="+852 xxxx xxxx"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Company
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                          placeholder="Your company"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Industry
                        </label>
                        <input
                          type="text"
                          name="industry"
                          value={formData.industry}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                          placeholder="e.g., Tech, Fashion, F&B"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Service Interest *
                        </label>
                        <select
                          name="serviceInterest"
                          value={formData.serviceInterest}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        >
                          <option value="">Select a service</option>
                          <option value="Public Relations">Public Relations</option>
                          <option value="Events">Event Management</option>
                          <option value="Social Media">Social Media Strategy</option>
                          <option value="KOL Marketing">KOL & Influencer Marketing</option>
                          <option value="Creative Production">Creative & Content Production</option>
                          <option value="Multiple Services">Multiple Services</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Budget Range
                        </label>
                        <select
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        >
                          <option value="">Select a range</option>
                          <option value="Under HKD 50k">Under HKD 50k</option>
                          <option value="HKD 50k - 100k">HKD 50k - 100k</option>
                          <option value="HKD 100k - 250k">HKD 100k - 250k</option>
                          <option value="HKD 250k+">HKD 250k+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                          Timeline
                        </label>
                        <select
                          name="timeline"
                          value={formData.timeline}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        >
                          <option value="">Select a timeline</option>
                          <option value="Immediate (This month)">Immediate (This month)</option>
                          <option value="Short-term (1-3 months)">Short-term (1-3 months)</option>
                          <option value="Medium-term (3-6 months)">Medium-term (3-6 months)</option>
                          <option value="Long-term (6+ months)">Long-term (6+ months)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Tell us about your goals or challenge
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600"
                        placeholder="What are you looking to achieve? Any specific challenges we should know about?"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                    >
                      {loading ? 'Booking Consultation...' : 'Book Your Consultation'}
                    </button>

                    <p className="text-xs text-slate-500 dark:text-slate-500 text-center">
                      We respect your privacy. No spam, just genuine strategy conversations.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Frequently asked questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Is there a cost for the consultation?</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                No, it's completely free. We offer this as a genuine opportunity to understand your challenges and share ideas. There's no obligation to work with us.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How do I prepare for the call?</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Think about your biggest challenge or goal right now. Have your budget and timeline in mind. That's all you need. We'll handle the rest.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">What if I'm not sure what I need?</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Perfect. That's exactly what this consultation is for. We'll ask the right questions and help you clarify what might work best for your situation.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Can we focus on a specific service?</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Absolutely. Whether you're interested in PR, events, social media, or a mix, we can tailor the conversation to your needs.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <div className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
              Not ready to book? You can also reach us directly at <a href="mailto:hello@radiancehk.com" className="text-purple-600 dark:text-purple-400 font-medium hover:underline">hello@radiancehk.com</a>
            </p>
            <Link
              href="/vibe-demo/radiance"
              className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
            >
              ← Back to Radiance
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
