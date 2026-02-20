'use client';

export default function PublicRelationsPage() {
  return (
    <main className="bg-white text-gray-900">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/vibe-demo/radiance" className="text-2xl font-bold tracking-tight">
            <span className="text-blue-600">Radiance</span>
          </a>
          <nav className="hidden md:flex gap-8 text-sm font-medium">
            <a href="/vibe-demo/radiance#services" className="hover:text-blue-600 transition">Services</a>
            <a href="/vibe-demo/radiance#cases" className="hover:text-blue-600 transition">Cases</a>
            <a href="#contact" className="hover:text-blue-600 transition">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-4">Public Relations — Hong Kong</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            Earn Credibility<br />That Converts
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl">
            Positive, credible media exposure fortifies brand reputation and fuels commercial results. As Hong Kong's integrated PR agency, Radiance engineers strategic communication ecosystems—precision news angles, nurtured media ties, narrative mastery—that position your stories for peak impact in top outlets.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            We view PR as an ongoing trust accelerator, not just press releases. Every brief, pitch, and placement is engineered to compound credibility—turning media exposure into stakeholder confidence, sales conversations, and long-term brand equity.
          </p>
        </div>
      </section>

      {/* Trust Stat Banner */}
      <section className="py-12 px-6 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="text-6xl font-bold opacity-20 hidden md:block">❝</div>
          <div>
            <p className="text-xl md:text-2xl font-semibold leading-snug">
              92% of global consumers trust earned media—recommendations and vetted coverage—above all forms of advertising.
            </p>
            <p className="text-sm mt-3 opacity-75">Nielsen Global Trust in Advertising Report</p>
          </div>
        </div>
      </section>

      {/* Why Earned Media Matter */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Why Earned Media Matter</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            Earned media outperforms paid channels because it carries third-party credibility. When journalists vet and amplify your brand, audiences trust it <strong>3× more</strong> than paid advertising. Our integrated PR approach creates a compounding flywheel: coverage fuels events, social proof, and sales conversations—each cycle reinforcing the next.
          </p>

          <ul className="space-y-6">
            <li className="flex gap-5">
              <span className="text-blue-600 font-bold text-xl mt-0.5">●</span>
              <div>
                <strong className="text-gray-900">Instant Legitimacy at Scale.</strong>
                <span className="text-gray-700"> Reaches new audiences through journalists' networks, introducing your brand with built-in credibility that paid placements cannot replicate.</span>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="text-blue-600 font-bold text-xl mt-0.5">●</span>
              <div>
                <strong className="text-gray-900">Compounding Returns.</strong>
                <span className="text-gray-700"> Trusted relationships with media who know your story generate repeated, increasingly favorable coverage—each placement building on the last.</span>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="text-blue-600 font-bold text-xl mt-0.5">●</span>
              <div>
                <strong className="text-gray-900">Precision Narrative Control.</strong>
                <span className="text-gray-700"> Shapes perception at critical moments—launches, crises, leadership transitions—through precise message framing before speculation fills the void.</span>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="text-blue-600 font-bold text-xl mt-0.5">●</span>
              <div>
                <strong className="text-gray-900">Cross-Channel Amplification.</strong>
                <span className="text-gray-700"> Press clips elevate event RSVPs, ignite social sharing, and strengthen KOL partnership pitches—one placement multiplied across every channel.</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      {/* Our Integrated PR Services */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Our Integrated PR Services</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            From strategy to headline, every service is designed to earn trust, deepen media relationships, and translate coverage into measurable business outcomes.
          </p>

          <div className="space-y-10">

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Communication Strategy</h3>
              <p className="text-gray-700 leading-relaxed">
                Deep-dive brand positioning → audience mapping → PR objectives → killer news angles → targeted media network → real-time optimization. Your narrative architecture, built to last.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Media Relations</h3>
              <p className="text-gray-700 leading-relaxed">
                Proactive, relationship-first engagement. We invest time understanding each journalist's beat, deliver exclusive value, and secure the sustained positive coverage that retainer agencies promise but rarely deliver.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Press Releases</h3>
              <p className="text-gray-700 leading-relaxed">
                News-worthy, concise copy tailored to media demands—not corporate memos dressed as news. Precision timing and multi-channel distribution engineered for peak pickup across Hong Kong and regional outlets.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Media Interviews</h3>
              <p className="text-gray-700 leading-relaxed">
                Curated invitations with exclusive angles that give journalists a reason to say yes. We build rapport, prepare your spokespeople, and lock in favorable features before the conversation begins.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Media Pitching & Publicity</h3>
              <p className="text-gray-700 leading-relaxed">
                Strategic placements in the publications that move markets—elevating brand trust, deepening audience affinity, and accelerating sales velocity through third-party endorsement.
              </p>
            </div>

            <div className="border-l-4 border-blue-600 pl-6">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Executive Thought Leadership</h3>
              <p className="text-gray-700 leading-relaxed">
                Position C-suite leaders as definitive industry voices through key outlet interviews, contributed editorials, and speaking opportunities—driving brand awareness, stakeholder favorability, and market leadership perception.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* High-Impact PR Events */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">High-Impact PR Events</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            When coverage meets experience, credibility compounds. We design and execute media events that generate immediate buzz and lasting relationships—each format engineered for a different moment in your brand narrative.
          </p>

          <div className="grid md:grid-cols-2 gap-6">

            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-lg">P</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Press Conferences</h3>
              <p className="text-gray-700 leading-relaxed">
                Orchestrate announcements that command attention from media and key stakeholders. From venue and AV through spokesperson briefing and post-event follow-up, we manage every moment so your message lands without distortion.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-lg">L</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Product Launches</h3>
              <p className="text-gray-700 leading-relaxed">
                Memorable unveilings that generate buzz, secure coverage, and create immediate market traction. We align media invitations, influencer briefings, and social amplification so the launch narrative fills every channel simultaneously.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-lg">M</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Media Luncheons</h3>
              <p className="text-gray-700 leading-relaxed">
                Intimate editorial briefings that foster the journalist relationships driving repeated, favorable coverage. We curate the right guest mix, prepare exclusive story angles, and create an environment where candid conversations become long-term media advocacy.
              </p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-gray-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-lg">T</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Media Preview Tours</h3>
              <p className="text-gray-700 leading-relaxed">
                Immersive facility or product experiences designed to give journalists firsthand insight—yielding deeper, more accurate, and more favorable stories than any press kit alone can achieve.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">How We Work with You</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            PR results compound through relationships and consistency. Our process is built for both—rigorous strategy at the start, agile execution throughout, transparent reporting always.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-50 rounded-xl p-8">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">01</div>
              <h3 className="text-xl font-bold mb-3">Discovery & Strategy</h3>
              <p className="text-gray-700 leading-relaxed">
                Deep-dive brand audit, audience mapping, and competitive coverage analysis. We identify your strongest news angles and build a targeted media network before a single pitch goes out.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">02</div>
              <h3 className="text-xl font-bold mb-3">Content & Materials</h3>
              <p className="text-gray-700 leading-relaxed">
                Press releases, pitch narratives, media briefing notes, and spokesperson talking points—crafted to meet editorial standards, reviewed with you, and ready for precision timing.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">03</div>
              <h3 className="text-xl font-bold mb-3">Execution & Relationship Management</h3>
              <p className="text-gray-700 leading-relaxed">
                We manage all journalist outreach, interview coordination, PR event logistics, and cross-channel timing. You stay informed—without needing to manage media relationships directly.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-8">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">04</div>
              <h3 className="text-xl font-bold mb-3">Reporting & Real-Time Optimisation</h3>
              <p className="text-gray-700 leading-relaxed">
                Monthly coverage reports with placement data, reach estimates, and sentiment analysis. We adapt angles and outreach based on what's resonating—strategy in motion, not set in stone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">How Brands Work with Us</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            From market entries to crisis moments, thought leadership campaigns to product unveilings—strategic PR shapes the narratives that build durable brands.
          </p>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-xl p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Global Consumer Brand Entering Hong Kong</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                A multinational entering Hong Kong needed awareness and credibility fast. We crafted a market entry narrative positioning the brand as innovative and locally attuned, pitched regional business and lifestyle journalists, coordinated an exclusive press preview, and briefed local KOLs to amplify launch messaging across social.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700">
                  <strong className="text-blue-600">Result:</strong> 18 media placements in tier-1 outlets within the first month; press event fuelled KOL partnerships and social amplification; brand achieved category awareness leadership in Q1.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Sustainability NGO Building Institutional Credibility</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                A Hong Kong climate education NGO wanted to position its director as a thought leader and increase donor engagement. We secured editorial placements, pitched research-led interview angles, and coordinated messaging with a community campaign.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700">
                  <strong className="text-blue-600">Result:</strong> 8 media placements including an opinion editorial; director became a cited expert in subsequent industry coverage; increased visibility generated three major grant inquiries.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Tech Startup Managing Reputation Under Pressure</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                An AI startup faced negative social coverage on data privacy. We developed a rapid-response strategy, drafted a transparent media statement, proactively engaged tech journalists with founder context, and coordinated third-party expert commentary to rebuild credibility.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700">
                  <strong className="text-blue-600">Result:</strong> Narrative shifted from controversy to privacy leadership; 5 follow-up stories foregrounded company safeguards; investor confidence stabilised.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ — structured for AISEO */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Frequently Asked Questions</h2>

          <div className="space-y-8">
            {[
              {
                q: "What is earned media and why does it outperform paid advertising?",
                a: "Earned media is coverage secured through editorial merit—journalists choosing to feature your brand because the story is newsworthy. Because it carries third-party validation, Nielsen research shows 92% of consumers trust it above all forms of advertising. Unlike paid placements, earned coverage cannot be bought; it must be earned through credible storytelling and strong media relationships."
              },
              {
                q: "How long does a PR engagement take to show results?",
                a: "A focused product launch campaign typically runs 2–3 months. Ongoing thought leadership or reputation management spans 6–12 months, where coverage compounds as media relationships deepen. We're flexible: month-to-month retainers and project-based engagements are both available."
              },
              {
                q: "Do you work with startups and NGOs, or only established corporates?",
                a: "We work with brands and institutions of all sizes—startups, NGOs, cultural institutions, and multinationals. Some of our most impactful PR work comes from smaller, mission-driven organisations with compelling stories and the conviction to tell them."
              },
              {
                q: "What if we don't have an in-house PR or comms team?",
                a: "We function as your external PR team. We manage all journalist relationships, pitching, interview coordination, event logistics, and reporting. You provide insights and approvals; we handle everything else."
              },
              {
                q: "How does PR integrate with events, social media, and KOL partnerships?",
                a: "Integration is our core strength. We align press coverage with event timings, brief KOLs on key media narratives, and coordinate social calendars to amplify placements. This cross-channel flywheel—where PR feeds events, events generate social content, social content drives KOL reach—delivers compounding impact no single channel can achieve alone."
              },
              {
                q: "Can we start with a pilot project before committing to a retainer?",
                a: "Absolutely. A 2–4 week pilot (product launch campaign, crisis response, or media relations sprint) lets both sides verify fit before expanding to an ongoing engagement."
              }
            ].map((item, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-8 last:border-0">
                <h3 className="text-lg font-bold mb-3 text-gray-900">{item.q}</h3>
                <p className="text-gray-700 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 px-6 bg-blue-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-semibold uppercase tracking-widest mb-4 opacity-75">Partner with Radiance</p>
          <h2 className="text-4xl font-bold mb-6 leading-tight">
            92% trust edge awaits.<br />Let's put it to work for your brand.
          </h2>
          <p className="text-lg mb-8 leading-relaxed opacity-90">
            Whether you're launching a product, navigating a reputation shift, or establishing executive thought leadership, Radiance engineers the credibility that converts. Let's talk about your story.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition">
              Start a PR Conversation
            </button>
            <button className="px-8 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition">
              View Our Work
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-300">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-white mb-4">Radiance</h4>
              <p className="text-sm">PR & Martech for Hong Kong brands</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Services</h4>
              <ul className="text-sm space-y-2">
                <li><a href="/vibe-demo/radiance/events" className="hover:text-white transition">Events & Experiences</a></li>
                <li><a href="/vibe-demo/radiance/social-content" className="hover:text-white transition">Social Media & Content</a></li>
                <li><a href="/vibe-demo/radiance/kol-influencer" className="hover:text-white transition">KOL & Influencer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Company</h4>
              <ul className="text-sm space-y-2">
                <li><a href="/vibe-demo/radiance" className="hover:text-white transition">Home</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Hong Kong</h4>
              <p className="text-sm">hello@radiancehk.com</p>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center text-sm">
            <p>&copy; 2026 Radiance PR & Martech Limited. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
