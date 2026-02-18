'use client';

export default function EventsPage() {
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
          <h1 className="text-5xl md:text-6xl font-bold mb-8 leading-tight">
            Events & Experiences
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl">
            Create memorable brand moments that turn audiences into advocates—from product launches and press conferences to community events and cultural activations that leave lasting impact.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            Events are where strategy becomes real. At Radiance, we design and execute experiences that engage audiences on a human level while driving business outcomes. From intimate product previews for press to large-scale community activations, we handle every detail—concept, logistics, on-site management, and post-event storytelling—ensuring your event amplifies your brand narrative across PR, social, and word-of-mouth.
          </p>
        </div>
      </section>

      {/* Why This Service Matters */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Why Events & Experiences Matter</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            In a digital world, live experiences create irreplaceable moments of human connection. Events allow you to tell your brand story in real time, deepen relationships with media and influencers, generate content, and create buzz that extends far beyond the day itself. Whether it's a product launch, press conference, or community gathering, events amplify your narrative and turn stakeholders into brand ambassadors.
          </p>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Direct Engagement:</strong> Events create face-to-face moments with journalists, influencers, and customers, deepening relationships and loyalty.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Content Generation:</strong> Live events produce photos, videos, quotes, and social moments that fuel PR, social media, and influencer amplification for weeks after.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Authentic Storytelling:</strong> Experiences let audiences experience your brand firsthand—building trust and emotional connection that advertising alone cannot achieve.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Multi-Channel Amplification:</strong> Events fuel PR coverage, social content, influencer posts, and word-of-mouth, multiplying reach and impact.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Our Approach to Events & Experiences</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            Great events start with a clear purpose. We work backward from your goals—whether it's launching a product, building community, generating press coverage, or deepening stakeholder relationships. We design every detail to create meaningful moments, manage logistics flawlessly, and ensure the event extends beyond the day through content and follow-up engagement.
          </p>

          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold mb-3">Purpose-Driven Concept Development</h3>
              <p className="text-gray-700 leading-relaxed">
                We start by understanding why you need an event. Is it product discovery for press? Community building? Thought leadership? Celebration? We then design a concept that aligns with that purpose—venue selection, format, guest mix, flow, and experiences that deliver on your objectives while creating genuine moments of engagement.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Experience-Focused Design</h3>
              <p className="text-gray-700 leading-relaxed">
                Events aren't just logistical exercises; they're brand moments. We design every touchpoint—from invitation through post-event communication—to reinforce your brand story. We think about how attendees will feel, what they'll talk about, what photos they'll take, and what stories journalists will file. This turns a generic event into a memorable experience.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Integrated Planning with PR & Social</h3>
              <p className="text-gray-700 leading-relaxed">
                Events deliver maximum impact when coordinated with PR and social. We align media invitations, influencer partnerships, press kits, and social briefings to create a unified narrative. We plan content shots in advance, brief attendees on key talking points, and prime social teams to amplify in real time.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">End-to-End Logistics & Execution</h3>
              <p className="text-gray-700 leading-relaxed">
                We handle all operational details: venue management, catering, AV/production, registration, staffing, timeline management, and contingency planning. On the day, our team is on-site managing every moment so you can focus on hosting great conversations. We're the ones ensuring the presentation starts on time, the press has what they need, and attendees feel welcomed.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Post-Event Amplification & Reporting</h3>
              <p className="text-gray-700 leading-relaxed">
                The event doesn't end when attendees leave. We compile post-event materials—photos, videos, attendee quotes—that social teams amplify. We follow up with journalists to encourage coverage, thank influencers for their participation, and generate reporting on reach, engagement, and media outcomes. Events become lasting content assets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Scope of Services */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Scope of Services</h2>

          <div className="space-y-10">
            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Event Strategy & Concept</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Event strategy aligned with brand goals and KPIs (awareness, engagement, leads, community building)</li>
                <li className="text-gray-700">• Concept development including format, guest mix, venues, and experiences</li>
                <li className="text-gray-700">• Stakeholder and audience mapping (press, influencers, customers, partners)</li>
                <li className="text-gray-700">• Integrated planning connecting event timing with PR campaigns and social calendars</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Event Types & Activations</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Product launch events and press showcase activations</li>
                <li className="text-gray-700">• Press conferences, media briefings, and media luncheons</li>
                <li className="text-gray-700">• Community events, charity galas, and celebration activations</li>
                <li className="text-gray-700">• Thought leadership salons, workshops, and community gatherings</li>
                <li className="text-gray-700">• Cultural exhibitions, pop-up experiences, and brand installations</li>
                <li className="text-gray-700">• Hybrid and virtual event management (webinars, virtual product launches)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Full-Service Event Operations</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Venue sourcing, booking, and logistics management</li>
                <li className="text-gray-700">• Guest list curation and registration management (Eventbrite, custom platforms)</li>
                <li className="text-gray-700">• Catering, beverage, and AV/production sourcing and coordination</li>
                <li className="text-gray-700">• Signage, collateral production, press kit design and printing</li>
                <li className="text-gray-700">• Staffing, check-in management, and attendee experience coordination</li>
                <li className="text-gray-700">• Timeline management, run-of-show production, and on-site contingency planning</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Press & Influencer Coordination</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Press invitation strategy and media list development</li>
                <li className="text-gray-700">• Influencer and KOL briefing and partnership coordination</li>
                <li className="text-gray-700">• Press kit design and distribution (physical and digital)</li>
                <li className="text-gray-700">• Interview scheduling and executive briefing support</li>
                <li className="text-gray-700">• On-site media relations and press support during the event</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Content & Post-Event Amplification</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Professional photography and videography services</li>
                <li className="text-gray-700">• Real-time social media coverage and live updates</li>
                <li className="text-gray-700">• Post-event content compilation (photos, videos, quotes, highlights)</li>
                <li className="text-gray-700">• Media follow-up and coverage tracking</li>
                <li className="text-gray-700">• Attendee thank-you and engagement follow-up communications</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">How Brands Work with Us</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            Radiance has conceived and executed events ranging from intimate product previews to large-scale community activations—for tech startups, consumer brands, NGOs, and cultural institutions. Each event is tailored to the brand's goals and audience, with careful attention to creating moments that resonate and amplify across channels.
          </p>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Tech Startup Product Launch</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                An AI software startup wanted to launch its Hong Kong product with both press credibility and influencer buzz. We designed an intimate launch event for 80 attendees including tech journalists, industry analysts, and macro-influencers, featuring live product demos, founder talks, and informal networking. We coordinated press previews, briefed influencers on key talking points, and arranged for professional photography and live social coverage.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> 12 media mentions including top-tier tech publications; 5 influencers posted about launch reaching 50K+ combined audience; event-generated photos and videos became core social content for 2 months post-launch.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">NGO Community Education Program Launch</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                A Hong Kong education NGO launched a new community scholarship program and wanted to build awareness while celebrating beneficiaries. We designed a community gathering featuring student testimonials, partner school presentations, and a modest reception—creating an authentic moment for donors, educators, and families. We coordinated media invitations and social amplification to tell the human story behind the program.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> 150 attendees including 10 media representatives; 4 education-focused media placements; strong social amplification from partner schools; generated donor interest resulting in 3 major grant commitments.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Consumer Brand Pop-Up Experience & Press Preview</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                A lifestyle brand wanted to open a pop-up flagship store in Hong Kong with strong press coverage and community engagement. We designed a 3-day launch featuring a press preview event, customer opening day, and community workshop programming. We handled venue management, media coordination, professional photography, social content, and follow-up community engagement to turn the pop-up into a lasting community touchpoint.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> 8 media placements (print and digital); press event attendance of 120 journalists, influencers, and customers; 1.2M social impressions across 3 days; pop-up extended 2 weeks due to community demand.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How We Work Together */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">How We Work with You</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">01</div>
              <h3 className="text-2xl font-bold mb-3">Concept & Planning</h3>
              <p className="text-gray-700 leading-relaxed">
                We begin with a workshop to understand your goals, audience, and constraints. We then develop an event concept including format, venue options, guest mix, and integrated plan (PR, social, influencers). You approve the concept and we move to detailed planning.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">02</div>
              <h3 className="text-2xl font-bold mb-3">Logistics & Coordination</h3>
              <p className="text-gray-700 leading-relaxed">
                We source and book vendors (venue, catering, AV), build guest lists, design collateral, and create detailed run-of-show timelines. We share regular updates on bookings, designs, and coordination. You stay informed and involved in key decisions.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">03</div>
              <h3 className="text-2xl font-bold mb-3">Execution & On-Site Management</h3>
              <p className="text-gray-700 leading-relaxed">
                Our team is on-site managing every detail: check-ins, AV, timeline, speaker coordination, media relations, photography, and real-time social updates. We handle contingencies so your team can focus on hosting and engaging attendees.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">04</div>
              <h3 className="text-2xl font-bold mb-3">Follow-Up & Amplification</h3>
              <p className="text-gray-700 leading-relaxed">
                We compile post-event materials, coordinate media follow-up, deliver attendee thank-yous, and support ongoing social amplification. We report on attendance, media outcomes, and engagement metrics to show the full impact of your event.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Frequently Asked Questions</h2>

          <div className="space-y-8">
            {[
              {
                q: "How much does an event with Radiance cost?",
                a: "It depends on event size, complexity, and duration. A press preview for 80 people might run $15–25K in total spend (including venue, catering, AV, staffing, and production). A larger community activation could be $40K+. We work within your budget and can scale services to fit."
              },
              {
                q: "How long does it take to plan an event?",
                a: "A typical timeline is 6–8 weeks for medium-sized events (50–150 people). Large events or complex activations might need 3–4 months. Smaller press previews can be planned in 4–6 weeks. We'll work faster if needed, but we recommend adequate lead time for best vendor partnerships and media outreach."
              },
              {
                q: "Can you handle both event planning and the creative design (signage, collateral)?",
                a: "Yes. We handle event planning, logistics, and basic collateral design (invitations, signage, press kits). For larger creative projects (experiential design, elaborate set pieces), we can partner with specialized production partners or coordinate with your in-house creative team."
              },
              {
                q: "Do you handle virtual or hybrid events?",
                a: "Absolutely. We've managed webinars, virtual product launches, and hybrid events combining in-person and online attendance. We work with event platforms, manage live streaming, coordinate speaker setup, and engage online audiences real-time."
              },
              {
                q: "What if something goes wrong on the day of the event?",
                a: "Our team is trained in contingency management. We build buffers into timelines, have backup vendors on standby, and are prepared for common issues (tech failures, no-show speakers, weather). We'll solve problems quickly and keep your event on track."
              }
            ].map((item, idx) => (
              <div key={idx}>
                <h3 className="text-lg font-bold mb-3">{item.q}</h3>
                <p className="text-gray-700 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 px-6 bg-blue-600 text-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Create an Unforgettable Event?</h2>
          <p className="text-lg mb-8 leading-relaxed opacity-95">
            Whether you're launching a product, building community, or celebrating a milestone, Radiance can help you design and execute an event that generates buzz, press coverage, and lasting memories. Let's talk about your vision and the experience we can create together.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition">
              Plan an Event
            </button>
            <button className="px-8 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition">
              Speak with Our Team
            </button>
          </div>
        </div>
      </section>

      {/* Chinese Summary */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto border-t-4 border-blue-600 pt-12">
          <h3 className="text-2xl font-bold mb-6 text-blue-600">繁體中文總結</h3>
          <p className="text-gray-700 leading-relaxed text-lg">
            活動與體驗是品牌與眾生直接互動、創造難忘時刻的最有力渠道。Radiance 提供從活動概念策劃、場地選址、全面物流管理，到現場執行、媒體協調和事後內容放大的全方位服務。我們設計體驗式活動，包括新品發佈會、媒體預覽、社區聚集活動、文化展覽等，讓每個細節都強化品牌故事，同時為公關、社交媒體和口碑行銷生成珍貴內容。無論你是科技新創、消費品牌、NGO 還是文化機構，我們都能根據你的目標量身設計活動。我們不只處理後勤，更重要的是在現場管理每一刻，讓你的品牌故事栩栩如生。立即聯絡我們，探索如何透過一場精心策劃的活動，為你的品牌帶來動力和聲量。
          </p>
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
                <li><a href="/vibe-demo/radiance/public-relations" className="hover:text-white transition">Public Relations</a></li>
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
