'use client';

import Link from 'next/link';
import { Header } from '../../components/Header';
import { Footer } from '../../components/Footer';
import { Breadcrumb } from '../../components/Breadcrumb';

export default function EventManagementServicePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 pt-20">
        {/* Breadcrumb */}
        <section className="py-6 px-6">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[
              { label: 'Home', href: '/vibe-demo/radiance' },
              { label: 'Services', href: '/vibe-demo/radiance/services' },
              { label: 'Events & Experiences' }
            ]} />
          </div>
        </section>

        {/* Hero Section */}
        <section className="pt-16 pb-16 px-6 max-w-6xl mx-auto">
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-white leading-tight">
            Event & Experience Management
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            A successful event doesn't happen by accident. It requires clear objectives, thoughtful planning and meticulous execution. Radiance provides end-to-end event management from conception to implementation, helping you create memorable experiences that gain media publicity, drive social media exposure and connect you with your target audiences.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Events are powerful marketing tools. Whether you're launching a product, opening a venue, activating a brand, supporting a cause or entertaining your community, Radiance brings strategic planning, creative production and hands-on logistics expertise to make sure your event achieves its objectives and leaves a lasting impression.
          </p>
        </div>
      </section>

      {/* Why This Service Matters */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Why events still matter</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
          In an increasingly digital world, in-person events create unmatched opportunities for authentic engagement. Events generate media coverage, create social media moments, foster direct relationships with audiences and provide tangible proof points for your brand or cause. But only when they're properly conceived, executed and amplified through PR and social channels.
        </p>
        <ul className="space-y-4">
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Events generate earned media coverage and social media moments that amplify reach far beyond attendees—when planned with publicity in mind.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Live experiences build stronger emotional connections than digital alone—trust, loyalty and advocacy are forged through face-to-face interaction.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Well-executed events create memorable stories that people share—through photos, posts, word-of-mouth—extending your message long after the event ends.</span>
          </li>
          <li className="flex gap-4">
            <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
            <span className="text-slate-600 dark:text-slate-400">Events allow you to control the narrative, showcase your brand personality and demonstrate commitment to your audience in ways no other channel can match.</span>
          </li>
        </ul>
      </section>

      {/* Our Approach */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Our approach to events & experience</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
          We treat every event as a strategic communication opportunity. Our planning integrates{' '}
          <Link href="/vibe-demo/radiance/services/public-relations" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">PR goals</Link>
          {' (media coverage), '}
          <Link href="/vibe-demo/radiance/services/social-media" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">social goals</Link>
          {' (content and engagement), '}
          <Link href="/vibe-demo/radiance/services/creative-production" className="text-purple-600 dark:text-purple-400 hover:underline font-medium">creative goals</Link>
          {' (memorable experience) and business goals (awareness, leads, loyalty). We sweat the details—from concept through to post-event follow-up—so your event runs smoothly and delivers results.'}
        </p>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Strategic planning & objective-setting</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We start by understanding your event goals: Is this about product awareness? Building community? Raising funds? Educating the public? We define success metrics, identify your target audience and map out how the event connects to your broader PR and marketing strategy. A clear objective drives every decision that follows.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Creative concept development</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We ideate on the event concept, theme, experience flow and key moments. What makes your event memorable? What's the "gimmick" or opening moment that captures attention? We design experiences that are not only enjoyable but also highly shareable and media-friendly.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Detailed logistical execution</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We manage everything behind the scenes: venue selection and setup, vendor coordination, guest invitation and RSVP tracking, stage and entertainment logistics, on-site reception and flow. We anticipate problems and have contingencies ready so your event runs seamlessly.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Media and content integration</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We coordinate with our{' '}
              <Link href="/vibe-demo/radiance/services/public-relations" className="text-purple-600 dark:text-purple-400 hover:underline">PR</Link>
              {' and '}
              <Link href="/vibe-demo/radiance/services/social-media" className="text-purple-600 dark:text-purple-400 hover:underline">social</Link>
              {' teams to ensure media relations, '}
              <Link href="/vibe-demo/radiance/services/kol-marketing" className="text-purple-600 dark:text-purple-400 hover:underline">KOL seeding</Link>
              {', and content capture are built into the event plan. Press invitations, media briefing materials, live social posting, photography and videography all work together to amplify your event\'s reach and impact.'}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">On-site management & real-time problem-solving</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Our team is on-ground, present, managing timings, guest flow, presentations and any issues that arise. We ensure your event stays on schedule, runs smoothly and delivers the experience your guests expect.
            </p>
          </div>
        </div>
      </section>

      {/* Scope of Services */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Scope of services</h2>
        <div className="space-y-12">
          {/* Strategy & Planning */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Strategy & Planning</h3>
            <ul className="space-y-3">
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Event objectives and success metrics aligned to your business and communication goals.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Audience analysis, target attendee profiling and invitation strategy.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Event concept development, theme, experience flow and key touchpoints.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Budget development and vendor selection process.</span>
              </li>
            </ul>
          </div>

          {/* Venue & Production */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Venue & Production</h3>
            <ul className="space-y-3">
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Venue sourcing, selection and liaison with venue management.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Venue design, layout, decoration, lighting and PA system setup.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Stage design, performance logistics and entertainment coordination.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Vendor management: catering, florals, furniture rental, technical support.</span>
              </li>
            </ul>
          </div>

          {/* Guest Management */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Guest Management & Flow</h3>
            <ul className="space-y-3">
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Guest list development, invitation design and distribution.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">RSVP tracking, capacity management and seating / registration logistics.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">On-site guest reception, welcome desk management and guest flow direction.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">VIP coordination, special guest arrival and interaction management.</span>
              </li>
            </ul>
          </div>

          {/* Content & Entertainment */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Content & Entertainment</h3>
            <ul className="space-y-3">
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">MC selection, script writing and presentation coordination.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Entertainment booking and rehearsal: performers, speakers, activities.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Event opening gimmick design and execution—the moment that captures attention.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Gift and premium sourcing, packaging and distribution logistics.</span>
              </li>
            </ul>
          </div>

          {/* Documentation & PR */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Documentation & Post-Event</h3>
            <ul className="space-y-3">
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Photography and videography for documentation, social content and media use.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Event recap content: behind-the-scenes, highlights, testimonials.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Press follow-up and media coverage tracking and reporting.</span>
              </li>
              <li className="flex gap-4">
                <span className="text-purple-600 dark:text-purple-400 font-bold flex-shrink-0">•</span>
                <span className="text-slate-600 dark:text-slate-400">Attendee database management and post-event follow-up strategy.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Examples of Work */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">How brands work with us</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-12 leading-relaxed">
          Radiance has rich experience organizing a wide range of event formats, from intimate product showcases to large-scale community activations. We often combine event management with{' '}
          <Link href="/vibe-demo/radiance/services/public-relations" className="text-purple-600 dark:text-purple-400 hover:underline">PR media relations</Link>
          {' and '}
          <Link href="/vibe-demo/radiance/services/social-media" className="text-purple-600 dark:text-purple-400 hover:underline">social media coverage</Link>
          {', turning each event into a multi-channel campaign that extends reach well beyond the room. See how this looks in practice in our '}
          <Link href="/vibe-demo/radiance/case-studies" className="text-purple-600 dark:text-purple-400 hover:underline">case studies</Link>.
        </p>
        <div className="space-y-8">
          {/* Use Case 1 */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Product Launch, Consumer Brand</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
              A fashion, beauty or F&B brand launched a new product or collection with a dedicated launch event. We designed the concept, secured an exciting venue, coordinated entertainment, managed media and KOL invitations, coordinated live social content, and ensured press coverage flowed through—turning the event into a media moment with reach far beyond the guest list.
            </p>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
                <span className="text-slate-600 dark:text-slate-400 text-sm">Strong media coverage, social amplification through attendee and KOL posts, product awareness spike and customer acquisition.</span>
              </li>
            </ul>
          </div>

          {/* Use Case 2 */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Charity Gala or Fundraising Event, NGO</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
              An environmental or social-impact NGO held a fundraising gala to support a programme. We conceptualized the event, managed all logistics from venue to catering to entertainment, coordinated media attendance, ensured compelling storytelling about the cause throughout the evening, and captured content that could be repurposed for future campaigns and donor outreach.
            </p>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
                <span className="text-slate-600 dark:text-slate-400 text-sm">Successful fundraising, earned media coverage of the cause, strengthened donor relationships and authentic storytelling assets for future campaigns.</span>
              </li>
            </ul>
          </div>

          {/* Use Case 3 */}
          <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Shopping Mall Activation or Roadshow, Retail Brand</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
              A brand ran a multi-week mall activation or roadshow across Hong Kong venues. We designed the concept and booth experience, coordinated on-site logistics at each location, managed performance talent and entertainment, drove foot traffic through social and community outreach, ensured consistent branding and messaging, and captured content from each location for real-time social and recap use.
            </p>
            <ul className="space-y-2">
              <li className="flex gap-3">
                <span className="text-purple-600 dark:text-purple-400 font-bold">→</span>
                <span className="text-slate-600 dark:text-slate-400 text-sm">Strong foot traffic, social engagement across multiple venues, direct customer engagement and feedback, and content library for ongoing marketing use.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How We Work Together */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">How we work with you</h2>
        <div className="space-y-8">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">1. Discovery & Strategy Workshop</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We start with a kickoff meeting or workshop to understand your event goals, target audience, budget, timeline and success metrics. We discuss media and social objectives, brand positioning and any stakeholders or partners involved. This gives us everything we need to develop a strategic event plan.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">2. Concept & Planning</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We develop the event concept, theme, experience flow and key moments. We present venue options, entertainment ideas, budget breakdown and a detailed timeline. We refine based on your feedback until everyone is aligned on the vision and logistics.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">3. Execution & Coordination</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We execute all logistics: vendor bookings, guest invitations, rehearsals, media outreach, content planning. We stay in touch with you throughout, providing updates and flagging decisions that need your input. We typically conduct a final walk-through or rehearsal before event day.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-3">4. On-Site Management & Post-Event</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              On event day, our team is on-ground managing setup, guest arrival, content capture, troubleshooting and timing. After the event, we handle thank-you communications, press follow-up, content editing and delivery of a comprehensive recap report with metrics, media coverage summary and next steps.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Frequently asked questions</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Why hire an event management agency?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Events require detailed coordination across catering, venue, décor, photography, design, logistics and more. Radiance brings specialised knowledge, years of experience and established vendor relationships. We save you time, reduce costs through vendor networks, and proactively manage risks—emergencies, supplier issues, guest flow challenges. An agency helps ensure your event runs smoothly and delivers the results you need.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Should we do this in-house or hire an agency?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              In-house teams often lack specialised event skills or bandwidth and must juggle events alongside regular responsibilities—which can compromise quality. A professional agency focuses entirely on event excellence, bringing creative thinking, technical expertise and hands-on execution. The result is a more polished, successful event. Many clients find that outsourcing events frees their team to focus on their core business.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Events vs discounts—isn't it cheaper to just run a promotion?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Discounts drive transactions in the short term, but events create deeper, more meaningful customer interactions that build loyalty and brand affinity. Well-designed events strengthen brand associations, foster community and generate customer insights. When combined with smart positioning and PR, events improve acquisition, conversion and retention—delivering longer-term value than discounts alone.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">How far in advance do we need to book your team?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              It depends on event size and complexity. A small product showcase might need 4–6 weeks. A large-scale gala or multi-venue activation typically benefits from 3–6 months of planning. We recommend connecting early so we can assess your timeline and confirm availability.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Can you manage events outside Hong Kong?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Yes, we've managed events across the Greater Bay Area and beyond. We can coordinate logistics remotely or travel on-site for execution. If you're planning an event outside HK, let's discuss the scope and logistics to confirm our involvement.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Do you handle all vendors or do we source some ourselves?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              We can handle vendor sourcing and management end-to-end, or work with your preferred vendors. Whatever makes sense for your situation. We'll clarify roles and responsibilities during planning so there's no confusion.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">What if things go wrong on event day?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Our team is trained to anticipate and handle issues in real-time. We have contingency plans for common problems—late arrivals, technical issues, weather, talent cancellation. On-site, we're flexible and problem-solving focused, so your event runs smoothly despite inevitable surprises.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Do you coordinate with our PR or marketing teams?</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Absolutely. We can coordinate with your in-house team or work alongside other agencies. In fact, we encourage it—the more aligned everyone is, the stronger the overall campaign. We'll work seamlessly with whoever else is involved.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 max-w-6xl mx-auto border-t border-slate-200 dark:border-slate-800">
        <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Ready to plan an impactful event?</h3>
          <p className="text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
            Whether you're launching a product, hosting a gala, running a community activation or any other event, Radiance brings strategic planning, creative energy and meticulous execution to make it a success. Let's discuss your vision and explore how we can help you create an unforgettable experience that drives results.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link href="/vibe-demo/radiance/consultation" className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              Plan your event
            </Link>
            <Link href="/vibe-demo/radiance/case-studies" className="px-6 py-3 border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 font-medium rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors">
              See our work
            </Link>
          </div>
        </div>
      </section>

      </main>

      <Footer />
    </div>
  );
}
