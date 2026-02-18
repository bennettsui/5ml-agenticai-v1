'use client';

import { useState } from 'react';
import Link from 'next/link';
import { RadianceLogo } from '../components/RadianceLogo';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function LeadGenPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', company: '', service: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative py-20 px-6 bg-gradient-to-br from-purple-50 via-white to-slate-50 dark:from-purple-950/20 dark:via-slate-950 dark:to-slate-900">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 flex justify-center">
              <RadianceLogo variant="text" size="md" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              Ready to Grow Your Brand?
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
              Get a free strategy session with our team. We'll discuss your goals, audit your current positioning, and share concrete ideas to accelerate your growth through integrated PR, events, and digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors text-lg">
                Schedule Free Session
              </button>
              <button className="px-8 py-4 border-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 font-semibold rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors text-lg">
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* Value Proposition */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-16 text-center">
              Why Radiance?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🎯',
                  title: 'Strategic Integration',
                  desc: 'PR, events, and digital work together—not in silos. Each channel amplifies the others.'
                },
                {
                  icon: '⚡',
                  title: 'Hands-On Execution',
                  desc: 'We don\'t hand you a deck and disappear. We\'re in the room, on-site, managing outcomes.'
                },
                {
                  icon: '📊',
                  title: 'Measurable Results',
                  desc: 'We track what matters: media coverage, event impact, audience growth, and business results.'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-8 bg-gradient-to-br from-purple-50 to-slate-50 dark:from-purple-950/20 dark:to-slate-900/20 border border-purple-200 dark:border-purple-900/50 rounded-lg hover:shadow-lg dark:hover:shadow-purple-900/20 transition-all">
                  <div className="text-5xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{item.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Services Overview */}
        <section className="py-20 px-6 bg-slate-50 dark:bg-slate-900/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-16 text-center">
              What We Do
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { title: 'Public Relations', icon: '📰' },
                { title: 'Events & Experiences', icon: '🎉' },
                { title: 'Social Media Strategy', icon: '📱' },
                { title: 'KOL Marketing', icon: '⭐' },
                { title: 'Creative Production', icon: '🎨' }
              ].map((service, idx) => (
                <Link
                  key={idx}
                  href={`/vibe-demo/radiance/services/${service.title.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                  className="p-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all"
                >
                  <div className="text-3xl mb-3">{service.icon}</div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-center">{service.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof - Testimonials */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-16 text-center">
              What Our Clients Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  quote: '"Radiance transformed how we think about our brand. The integrated approach actually works."',
                  author: 'Client Executive',
                  company: 'Leading Tech Startup'
                },
                {
                  quote: '"Within 3 months we went from unknown to respected industry voice. Highly professional."',
                  author: 'Marketing Director',
                  company: 'Enterprise SaaS'
                },
                {
                  quote: '"Their events and PR work together seamlessly. It\'s actually what we needed all along."',
                  author: 'Brand Manager',
                  company: 'Consumer Brand'
                }
              ].map((testimonial, idx) => (
                <div key={idx} className="p-8 bg-gradient-to-br from-purple-50 to-white dark:from-slate-800 dark:to-slate-900 border border-purple-200 dark:border-slate-700 rounded-lg">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 mb-4 italic">{testimonial.quote}</p>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{testimonial.author}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{testimonial.company}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-20 px-6 bg-gradient-to-br from-purple-600 to-purple-700">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-4 text-center">
              Let's Talk
            </h2>
            <p className="text-lg text-purple-100 mb-12 text-center">
              Fill out the form below and we'll reach out within 24 hours to discuss your project.
            </p>

            {submitted ? (
              <div className="bg-white/10 border border-white/20 rounded-lg p-8 text-center backdrop-blur-sm">
                <h3 className="text-2xl font-bold text-white mb-2">✓ Message Received!</h3>
                <p className="text-purple-100">We'll get back to you shortly. Check your email for next steps.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 bg-white/10 backdrop-blur-sm p-8 rounded-lg border border-white/20">
                <div className="grid md:grid-cols-2 gap-6">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="px-4 py-3 bg-white/90 text-slate-900 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="px-4 py-3 bg-white/90 text-slate-900 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+852 xxxx xxxx"
                    value={formData.phone}
                    onChange={handleChange}
                    className="px-4 py-3 bg-white/90 text-slate-900 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                  <input
                    type="text"
                    name="company"
                    placeholder="Your Company"
                    value={formData.company}
                    onChange={handleChange}
                    className="px-4 py-3 bg-white/90 text-slate-900 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white"
                  />
                </div>

                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white/90 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-white"
                >
                  <option value="">Select Service of Interest</option>
                  <option value="pr">Public Relations</option>
                  <option value="events">Events & Experiences</option>
                  <option value="social">Social Media Strategy</option>
                  <option value="kol">KOL & Influencer Marketing</option>
                  <option value="creative">Creative Production</option>
                  <option value="integrated">Integrated Campaign</option>
                </select>

                <textarea
                  name="message"
                  placeholder="Tell us about your project or challenge..."
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  className="w-full px-4 py-3 bg-white/90 text-slate-900 rounded-lg placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-white"
                />

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Schedule Your Free Session →
                </button>

                <p className="text-xs text-purple-100 text-center">
                  We respect your privacy. Your information is secure and we'll only use it to contact you about your project.
                </p>
              </form>
            )}
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-12 text-center">
              Frequently Asked
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'How long is the free strategy session?',
                  a: 'Typically 30 minutes. We\'ll use the time to understand your goals, assess your current positioning, and share initial ideas.'
                },
                {
                  q: 'What\'s the typical project timeline?',
                  a: 'Depends on scope. Most campaigns run 3-6 months. We can discuss your specific timeline during the strategy session.'
                },
                {
                  q: 'Do you work with startups or only established brands?',
                  a: 'We work with both. Whether you\'re launching something new or scaling an existing brand, we can help.'
                },
                {
                  q: 'What if we already have an agency?',
                  a: 'No problem. We can coordinate with existing partners or take over complete management. Let\'s discuss.'
                }
              ].map((item, idx) => (
                <div key={idx} className="p-6 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">{item.q}</h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-6 bg-gradient-to-r from-purple-900 to-purple-800">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              Let's Build Something Great
            </h2>
            <p className="text-lg text-purple-100 mb-8">
              No commitment, no pressure. Just a conversation about what's possible for your brand.
            </p>
            <button className="px-8 py-4 bg-white text-purple-600 font-bold rounded-lg hover:bg-purple-50 transition-colors text-lg">
              Schedule Your Free Session
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
