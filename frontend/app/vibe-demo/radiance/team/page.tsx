'use client';

import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1">
        {/* Hero Section */}
        <section className="pt-32 pb-16 px-6 max-w-4xl mx-auto">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
              Meet Our Team
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Behind every campaign is a team that cares about details as much as ideas. Our consultants, producers and creatives bring experience from PR agencies, in-house brand teams and the cultural sector, giving us a practical view on what will actually work in the Hong Kong market.
            </p>
          </div>
        </section>

        {/* Team Grid */}
        <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <div className="grid md:grid-cols-2 gap-12 mb-16">
            {[
              {
                name: '[Team Member Name]',
                title: '[Role & Specialisation]',
                bio: 'Team member bio and background coming soon.',
                expertise: ['PR', 'Strategy']
              },
              {
                name: '[Team Member Name]',
                title: '[Role & Specialisation]',
                bio: 'Team member bio and background coming soon.',
                expertise: ['Events', 'Production']
              },
              {
                name: '[Team Member Name]',
                title: '[Role & Specialisation]',
                bio: 'Team member bio and background coming soon.',
                expertise: ['Social Media', 'Content']
              },
              {
                name: '[Team Member Name]',
                title: '[Role & Specialisation]',
                bio: 'Team member bio and background coming soon.',
                expertise: ['KOL Marketing', 'Partnerships']
              }
            ].map((member, idx) => (
              <div key={idx} className="group">
                <div className="bg-gradient-to-br from-purple-50 to-purple-25 dark:from-purple-950/30 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8 h-full">
                  <div className="mb-6 w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{member.name}</h2>
                  <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 mb-4">{member.title}</p>
                  <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{member.bio}</p>
                  <div className="flex flex-wrap gap-2">
                    {member.expertise.map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">
              <strong>Individual team bios and professional backgrounds will be added as we complete team information.</strong>
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              In the meantime, you can learn more about our approach and what we do on our services pages. Curious about who would handle your project? Feel free to reach out—we're happy to introduce you to the team member who would lead your campaign.
            </p>
          </div>
        </section>

        {/* Culture & Values */}
        <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">How we work</h2>
          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Collaborative problem-solving</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                We don't believe in top-down strategy handed down from on high. Our team works together—creatives, strategists, producers, account managers—to solve your challenge collectively. You'll work with all of us, not just one person.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Practical expertise</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                We've worked across sectors and for organisations of all sizes. That experience means we know what actually works in Hong Kong, not just what sounds good in theory. We're direct about trade-offs and constraints.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Commitment to execution</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Great strategy means nothing without great execution. We're hands-on—we're in the room, on-site at events, managing the details that turn ideas into reality.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Continuous learning</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Communications and media change constantly. Our team stays current on trends, platforms and best practices, and brings that knowledge to your projects.
              </p>
            </div>
          </div>
        </section>

        {/* Join Us */}
        <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">We're hiring</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            If you're passionate about PR, digital marketing, creative production or event management—and you want to work on meaningful campaigns for interesting brands and causes—we'd love to hear from you. We're always looking for talented people who care about quality, strategy and impact.
          </p>
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
            View open roles
          </button>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 max-w-4xl mx-auto border-t border-slate-200 dark:border-slate-800">
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Want to meet the team?</h2>
            <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
              Book a 30-minute call with us. We'll listen to your challenge, introduce you to the team member who'd lead your project, and explore what's possible.
            </p>
            <div className="flex gap-4 flex-wrap">
              <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                Schedule a call
              </button>
              <button className="px-6 py-3 border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
                Learn about our work
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
