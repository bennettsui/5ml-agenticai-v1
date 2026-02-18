# Radiance PR & Martech Website

Official website for Radiance PR & Martech Limited - Hong Kong-based PR, events, and digital marketing agency.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Runtime**: Node.js

## Getting Started

### Prerequisites
- Node.js 18+
- npm (not yarn or bun)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site in your browser.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
radiance-website/
├── app/
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Homepage
│   └── globals.css     # Global styles
├── components/         # Reusable components (future)
├── public/            # Static assets
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

## Pages

- **Homepage** (`/`): Full marketing site with all sections
  - Hero section with main CTA
  - Credibility strip with client types
  - Services overview (5 service cards)
  - Featured case studies (3 teasers)
  - Why Radiance section
  - Process section (Discover, Design, Deliver)
  - Contact CTA section
  - Traditional Chinese summary

## Styling Notes

- Uses Tailwind CSS for utility-first styling
- Color scheme: Blue (#0066cc) as primary accent
- Responsive design with mobile-first approach
- Clean, professional aesthetic suitable for B2B agency

## Deployment

Build the project:
```bash
npm run build
```

Deploy the `.next` directory to your hosting provider.

## License

© 2026 Radiance PR & Martech Limited. All rights reserved.
