'use client';

export default function CreativeProductionPage() {
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
            Creative & Production
          </h1>
          <p className="text-xl text-gray-600 mb-6 leading-relaxed max-w-2xl">
            Bring your ideas to life with professional design, video production, photography, and motion graphics—created in-house to ensure consistency, speed, and creative excellence.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
            Great campaigns need great creative. At Radiance, we produce design, video, photography, and motion graphics in-house—bringing ideas from concept to finished asset in weeks, not months. We handle everything from brand identity and event collateral to social media assets and professional documentary-style videos. By owning the production process, we ensure visual consistency across channels and deliver creative excellence that amplifies your PR, events, and social campaigns.
          </p>
        </div>
      </section>

      {/* Why This Service Matters */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Why Creative & Production Matters</h2>
          <p className="text-lg text-gray-700 mb-8 leading-relaxed">
            In a visual-first world, professional creative is non-negotiable. Beautiful design, polished video, and striking photography stop scrolls, convey professionalism, and make your brand memorable. In-house production means you move faster, maintain visual consistency, and get creative partners who understand your brand context. Rather than outsourcing design to agencies that don't know your campaigns, you get a team that's embedded in your strategy.
          </p>
          <ul className="space-y-4">
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Brand Consistency:</strong> In-house creative ensures every asset—from social posts to event signage to videos—reflects your brand identity and messaging.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Speed to Market:</strong> In-house production means rapid turnarounds—concepts can become finished assets in days, not weeks, allowing you to capitalize on trends and opportunities.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Content Multiplication:</strong> Professional video and photography create assets that feed PR, social media, events, and website—multiplying value across channels.</span>
            </li>
            <li className="flex gap-4">
              <span className="text-blue-600 font-bold text-xl">●</span>
              <span className="text-gray-700"><strong>Strategic Advantage:</strong> Creative teams embedded in campaign strategy can innovate and suggest concepts that non-contextual agencies miss.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Our Approach to Creative & Production</h2>
          <p className="text-lg text-gray-700 mb-12 leading-relaxed">
            We start with strategy—understanding your brand, campaigns, audience, and goals. We then ideate concepts rooted in your narrative, not just aesthetics for aesthetics' sake. We produce with excellence—from composition and lighting in photography to sound design and color grading in video. Every asset is created with intention: it moves your campaign forward and reinforces your brand identity.
          </p>

          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-bold mb-3">Strategic Creative Concept Development</h3>
              <p className="text-gray-700 leading-relaxed">
                We don't just make things pretty—we create visuals that tell your story. We work closely with your PR and marketing teams to understand campaign themes, key messages, and audience insights. We then develop creative concepts that amplify these messages—whether it's a social campaign, event collateral, or video documentary. Concept comes first; execution follows.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Professional Photography & Styling</h3>
              <p className="text-gray-700 leading-relaxed">
                We produce professional photography for product showcases, team portraits, event coverage, and lifestyle shoots. We handle all aspects: shot direction, styling, location scouting, lighting, and post-production editing. Each photo is composed to tell a story and designed for both print and digital use—ensuring clarity and impact whether displayed large on a poster or small on social media.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Video Production Across Formats</h3>
              <p className="text-gray-700 leading-relaxed">
                From documentary-style long-form content to snappy short-form social videos, we produce video that engages. We handle all production phases: creative development, location scouting, shooting, color grading, sound design, and final editing. We produce for different platforms—YouTube videos, Instagram Reels, TikToks, LinkedIn content—optimizing format, aspect ratio, and pacing for each audience.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Graphic Design & Visual Identity</h3>
              <p className="text-gray-700 leading-relaxed">
                We design brand collateral, social media graphics, infographics, event signage, and digital assets. We work from your brand guidelines to create cohesive visual language across all touchpoints. Design isn't just decoration—it's functional communication. Every graphic is designed to draw attention, communicate clearly, and guide action.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-3">Motion Graphics & Animation</h3>
              <p className="text-gray-700 leading-relaxed">
                Motion grabs attention. We create animated explainers, motion graphics for social media, animated infographics, and video introductions. Animation allows us to simplify complex concepts, add personality to brand content, and create assets optimized for social platforms where movement drives engagement.
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
              <h3 className="text-xl font-bold mb-4 text-blue-600">Brand Identity & Design</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Logo design and brand identity development</li>
                <li className="text-gray-700">• Brand guidelines and style guide creation</li>
                <li className="text-gray-700">• Visual identity system development (color, typography, imagery)</li>
                <li className="text-gray-700">• Brand collateral design (business cards, letterheads, folders)</li>
                <li className="text-gray-700">• Website design and user experience (UX/UI)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Photography Services</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Professional event photography (press events, launches, activations)</li>
                <li className="text-gray-700">• Product photography and styling</li>
                <li className="text-gray-700">• Team and executive portrait photography</li>
                <li className="text-gray-700">• Lifestyle and lifestyle brand photography</li>
                <li className="text-gray-700">• Location scouting and shoot management</li>
                <li className="text-gray-700">• Photo editing and post-production</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Video Production</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Long-form video production (10–30 minutes: documentaries, interviews, features)</li>
                <li className="text-gray-700">• Mid-form video (3–5 minutes: product demos, educational, storytelling)</li>
                <li className="text-gray-700">• Short-form video (15–60 seconds: social media, Reels, Shorts, TikToks)</li>
                <li className="text-gray-700">• Video scripting and storyboarding</li>
                <li className="text-gray-700">• On-location shooting with professional equipment</li>
                <li className="text-gray-700">• Color grading, sound design, and post-production</li>
                <li className="text-gray-700">• Animation and motion graphics integration</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Graphic Design & Digital Assets</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Social media graphics and post templates</li>
                <li className="text-gray-700">• Infographics and data visualization</li>
                <li className="text-gray-700">• Event collateral (signage, programs, promotional materials)</li>
                <li className="text-gray-700">• Presentation design (PowerPoint, Keynote)</li>
                <li className="text-gray-700">• Print design (brochures, posters, banners)</li>
                <li className="text-gray-700">• Animated GIFs and social stickers</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Motion Graphics & Animation</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Animated explainers and educational videos</li>
                <li className="text-gray-700">• Motion graphics for social media content</li>
                <li className="text-gray-700">• Animated infographics and data visualization</li>
                <li className="text-gray-700">• Video introductions and title sequences</li>
                <li className="text-gray-700">• 2D and 3D animation</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-600">Creative Direction & Strategy</h3>
              <ul className="space-y-2 ml-4">
                <li className="text-gray-700">• Creative strategy development aligned with brand and campaigns</li>
                <li className="text-gray-700">• Art direction for shoots and productions</li>
                <li className="text-gray-700">• Concept ideation and creative development workshops</li>
                <li className="text-gray-700">• Brand voice and visual tone development</li>
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
            Radiance has created comprehensive creative campaigns for consumer brands, tech startups, NGOs, and cultural institutions—from brand identity design to documentary videos to integrated social media campaigns. Here's how we turn creative concepts into finished assets that amplify your campaigns.
          </p>

          <div className="space-y-8">
            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Tech Startup Building Brand Identity & Launch Video</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                An AI fintech startup needed a complete brand identity and launch campaign assets. We developed a modern brand identity with logo, color palette, and typography. We then produced a 4-minute brand documentary explaining the founding story and product innovation, plus 6 short-form social videos explaining key features. We designed event signage, social graphics, and presentation templates. All assets reinforced a consistent visual language conveying innovation and accessibility.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> Brand identity launched with cohesive visual presence across web, social, and events. Documentary video generated 50K views and positioned founder as thought leader. Social videos averaged 6% engagement rate. Design consistency created professional impression with investors and customers.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">Consumer Brand Product Launch Campaign</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                A beauty brand launching a new skincare line needed integrated creative support. We conceptualized a campaign theme "Skin Stories," then produced a library of assets: lifestyle photography of real customers, 3-minute product demo video, TikTok-style ingredient breakdown videos, and social media templates. We created infographics explaining the science behind new formulations, event signage for pop-up stores, and packaging design mockups. All assets centered on authentic storytelling while showcasing product benefits.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> Campaign assets used across Instagram, TikTok, YouTube, and in-store displays. Product demo video reached 200K views. User-generated content campaign (using provided graphics templates) generated 500+ submissions. Consistent visual language increased brand recall 40% in post-campaign survey.
                </p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-8 bg-white">
              <h3 className="text-xl font-bold mb-4 text-blue-600">NGO Creating Impact Documentation</h3>
              <p className="text-gray-700 mb-4 leading-relaxed">
                A health-focused NGO wanted to document their community program impact for fundraising and advocacy. We produced a 12-minute documentary following beneficiaries through the program, highlighting personal transformations. We created supporting short videos for social media, design infographics showing program metrics, and photography for annual reports and website. The documentary conveyed emotional impact while data visualization proved efficacy to potential donors.
              </p>
              <div className="border-l-4 border-blue-600 pl-4">
                <p className="text-gray-700 italic">
                  <strong className="text-blue-600">Result:</strong> Documentary screened at fundraising events; used in pitch meetings with major donor prospects. Short-form videos generated 75K social media views and 12% engagement rate. Updated branding and design materials increased professional perception. Documented impact contributed to 3 major grant wins totaling $500K.
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
              <h3 className="text-2xl font-bold mb-3">Discovery & Creative Brief</h3>
              <p className="text-gray-700 leading-relaxed">
                We begin by understanding your brand, campaign goals, target audiences, and brand guidelines. We review existing assets and competitive work. We then develop a creative brief defining the concept, visual direction, key messages, and deliverables. You approve the brief before we move to production.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">02</div>
              <h3 className="text-2xl font-bold mb-3">Concept Development & Approval</h3>
              <p className="text-gray-700 leading-relaxed">
                For design projects, we create initial concepts (2–3 design directions). For video/photo, we develop scripts and shot lists. We present concepts for your feedback and refine based on your direction. This iterative process ensures alignment before production begins.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">03</div>
              <h3 className="text-2xl font-bold mb-3">Production & Execution</h3>
              <p className="text-gray-700 leading-relaxed">
                We manage all production logistics: studio booking, lighting setup, shot direction (for video/photo), editing and post-production, color grading, sound design, and final asset delivery. For design, we refine based on feedback until assets are complete. You receive regular production updates and can flag adjustments as needed.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 border border-gray-200">
              <div className="text-4xl font-bold text-blue-600 mb-4 opacity-20">04</div>
              <h3 className="text-2xl font-bold mb-3">Delivery & Asset Management</h3>
              <p className="text-gray-700 leading-relaxed">
                We deliver finished assets in all required formats—high-res for print, compressed for web, optimized aspect ratios for each platform. We create asset libraries and usage guidelines so your team can implement consistently. We're available for revisions and format adjustments as you repurpose assets across channels.
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
                q: "How much does video production cost?",
                a: "It depends on scope. A 2-minute product demo video might run $8K–15K (including scripting, shooting, and editing). A 10-minute documentary could be $25K–50K depending on location complexity and crew needs. A campaign with multiple short-form videos might be $5K–30K depending on quantity and complexity. We'll provide detailed quotes after understanding your needs."
              },
              {
                q: "What's the production timeline for a video project?",
                a: "A simple product video (2–3 minutes) typically takes 6–8 weeks from concept to final delivery. A documentary (10+ minutes) usually takes 10–14 weeks. Short-form social videos can be turned around in 3–4 weeks if concept is pre-approved. We can sometimes accelerate for rush projects, but we recommend adequate lead time for quality results."
              },
              {
                q: "Can you help with ideas or do you just execute?",
                a: "We do both. We start with creative discovery and concept development, not just execution. We'll brainstorm ideas with you, develop creative briefs, and refine concepts before production. Creative excellence starts with great ideas; we partner with you to generate them."
              },
              {
                q: "What if we need just design, not video production?",
                a: "Absolutely. We offer standalone design services—social graphics, brand identity, event collateral, infographics, web design. You can work with our design team without video production. Or you can mix: design for everyday assets, video for major campaigns."
              },
              {
                q: "Can you deliver assets in multiple formats for different platforms?",
                a: "Yes. We deliver assets optimized for all platforms: YouTube videos, Instagram Reels, TikTok, LinkedIn, email, web, print, events. We handle format conversion, aspect ratio optimization, file compression, and platform-specific requirements. One production can feed multiple channels efficiently."
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
          <h2 className="text-3xl font-bold mb-6">Ready to Create Compelling Brand Assets?</h2>
          <p className="text-lg mb-8 leading-relaxed opacity-95">
            Whether you need a complete brand identity refresh, professional video production, or integrated creative campaigns, Radiance can help you bring your vision to life. Let's work together to create assets that amplify your brand and campaigns.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition">
              Plan a Creative Project
            </button>
            <button className="px-8 py-3 border-2 border-white text-white font-medium rounded-lg hover:bg-white/10 transition">
              Speak with Our Team
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
                <li><a href="/vibe-demo/radiance/public-relations" className="hover:text-white transition">Public Relations</a></li>
                <li><a href="/vibe-demo/radiance/events" className="hover:text-white transition">Events & Experiences</a></li>
                <li><a href="/vibe-demo/radiance/social-content" className="hover:text-white transition">Social Media & Content</a></li>
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
