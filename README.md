# Fan AlFaisal Recruitment Portal (شركة فن الفيصل للإستقدام)

Modern recruitment management and candidate onboarding portal integrated with Musaned standards and Neon Serverless PostgreSQL.

## Features

- **Candidate Management & CV Generator**: Official printable A4 candidate CV layout with export to PDF.
- **Passport Auto-Detection (OCR & MRZ)**: Automatic passport scanning and ICAO Doc 9303 MRZ parsing (compatible with both old `P<ETH` and new `PPETH` biometric passports).
- **Musaned Standards Compliance**: Up-to-date statutory bilateral pricing and recruitment quotas.
- **Role-Based Access Control (RBAC)**: Super Admin, Admin Operations, and Sponsor/Employer portals.
- **Neon Serverless PostgreSQL Database**: Fast, reliable serverless database with optimistic UI updates.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Neon Serverless PostgreSQL
- **UI & Styling**: Tailwind CSS, Lucide React
- **OCR Engine**: Tesseract.js with canvas pre-processing
- **PDF Generation**: html2canvas & jsPDF (A4 100% scale)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/redmanm/fan-faisal.git
   cd fan-faisal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` and add your Neon connection string:
   ```bash
   cp .env.example .env
   ```

4. Initialize database schema and seeds (if needed):
   ```bash
   node scripts/setup-neon-db.mjs
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.
