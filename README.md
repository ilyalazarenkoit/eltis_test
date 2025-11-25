# 🎓 ELTIS Test Platform

> A modern, production-ready English language assessment platform designed for JAMM School's student recruitment funnel. This interactive test helps evaluate English proficiency for students aspiring to study in the United States.

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)

🌐 **Live Demo**: [eltis-test.vercel.app](https://eltis-test.vercel.app/)

---

## ✨ Overview

ELTIS Test Platform is a comprehensive web application that delivers an engaging English language proficiency assessment experience. Built as a key component of JAMM School's sales funnel, it captures student information, administers listening and reading comprehension tests, and seamlessly integrates results into the school's CRM workflow.

### 🎯 Key Features

- **📝 Interactive Test Interface**: Smooth, user-friendly testing experience with real-time progress tracking
- **🎧 Multi-Modal Questions**: Supports both listening (with audio) and reading comprehension questions
- **📊 Real-Time Scoring**: Instant calculation and display of reading, listening, and overall scores
- **🔒 Secure Session Management**: Cookie-based participant tracking with UUID validation
- **⚡ Rate Limiting**: Built-in protection against abuse with configurable rate limits
- **📈 Google Sheets Integration**: Automatic data export for CRM and analytics
- **✅ Input Validation**: Comprehensive client and server-side validation with sanitization
- **📱 Responsive Design**: Fully responsive UI optimized for all device sizes
- **🔄 Progress Persistence**: Resume test sessions with state management
- **🎨 Modern UI/UX**: Clean, professional interface built with Tailwind CSS

---

## 🏗️ Architecture

### Tech Stack

**Frontend:**

- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling

**Backend:**

- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - PostgreSQL database with real-time capabilities
- **Middleware** - Request interception and rate limiting

**Integrations:**

- **Google Sheets API** - Automated data export
- **Cookie-based Auth** - Secure session management

### System Flow

```
User Registration → Test Start → Question Navigation → Answer Submission → Results Display
       ↓                ↓              ↓                    ↓                  ↓
   Supabase      localStorage    Progress Bar      Score Calculation    Google Sheets
   Database      Questions Cache  Tracking         Real-time Update     Export
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Supabase** account and project
- **Google Sheets** API credentials (optional, for data export)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd eltis_test
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Google Sheets Integration (Optional)
   GOOGLE_URL=your_google_sheets_webhook_url
   GOOGLE_SECRET=your_google_sheets_secret
   ```

4. **Set up database**

   Configure your Supabase database with tables for storing participant data and test questions. The database schema includes tables for user registration, test questions, and answer tracking.

   > **Note**: Database schema details are available in the project documentation for authorized developers.

5. **Run the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
eltis_test/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── answer/           # Answer submission endpoint
│   │   ├── google-sheets/    # Google Sheets integration
│   │   ├── participant/      # Participant management
│   │   └── user/             # User registration
│   ├── result/               # Results page
│   ├── test/                 # Test interface
│   │   └── start/            # Test start page
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Landing/registration page
├── components/               # React components
│   ├── Test.tsx              # Main test component
│   ├── Spinner.tsx           # Loading spinner
│   └── ClearCookieButton.tsx # Session management
├── constants/                # Application constants
│   └── testParts.ts          # Test structure definitions
├── lib/                      # Utility libraries
│   ├── validation.ts         # Input validation & sanitization
│   ├── rateLimit.ts          # Rate limiting logic
│   └── validateUUID.ts       # UUID validation
├── middleware.ts             # Next.js middleware
├── public/                   # Static assets
└── package.json              # Dependencies
```

---

## 🔐 Security Features

### Input Validation & Sanitization

- **Client-side validation** for immediate feedback
- **Server-side validation** for security
- **Sanitization** of all user inputs to prevent XSS
- **Field length limits** to prevent DoS attacks

### Rate Limiting

- Configurable rate limits on all API endpoints
- Protection against abuse and DoS attacks
- Automatic retry-after headers
- Implemented via Next.js middleware

### Session Security

- **HttpOnly cookies** to prevent XSS attacks
- **Secure flag** for HTTPS-only transmission
- **SameSite: strict** to prevent CSRF
- **UUID validation** for participant IDs

### Data Protection

- **Environment variables** for all sensitive credentials
- **No sensitive data** exposed in client-side code
- **Parameterized queries** via Supabase client (prevents SQL injection)
- **Secure cookie handling** with proper flags and expiration

---

## 🎨 User Experience

### Test Flow

1. **Registration Page** (`/`)

   - Clean, professional form design
   - Real-time validation feedback
   - Rate limit handling with countdown timer

2. **Test Start Page** (`/test/start`)

   - Instructions and test overview
   - Session state management

3. **Test Interface** (`/test`)

   - Progress bar with percentage
   - Part-based question grouping
   - Audio controls for listening questions
   - Image support for visual questions
   - Smooth navigation between questions

4. **Results Page** (`/result`)
   - Comprehensive score breakdown
   - Reading and listening scores
   - Overall percentage
   - Thank you message with contact information

### Responsive Design

- Mobile-first approach
- Optimized for tablets and desktops
- Touch-friendly interface elements
- Accessible form controls

---

## 🔧 API Endpoints

The application exposes RESTful API endpoints for user registration, test management, and result tracking. All endpoints include:

- Input validation and sanitization
- Rate limiting protection
- Secure session management
- Error handling

### Main Endpoints

- **`POST /api/user`** - User registration and test initialization
- **`POST /api/answer`** - Submit test answers
- **`GET /api/participant`** - Retrieve participant status
- **`POST /api/google-sheets`** - Data export integration (internal)

> **Note**: Detailed API documentation with request/response schemas is available in the internal project documentation.

---

## 📊 Performance Optimizations

- **Server-side rendering** for initial page loads (Next.js App Router)
- **Client-side caching** of questions in localStorage to reduce API calls
- **Optimized images** with Next.js Image component
- **Efficient state management** with React hooks (useState, useEffect)
- **Memoization** with useMemo for calculated values (progress tracking)

---

## 🧪 Testing Structure

The test is divided into two main sections:

### Listening Section

- **Part 1**: Picture-based directions (2 questions)
- **Part 2**: Math word problems (2 questions)
- **Part 3**: Short conversations (1 question)
- **Part 4**: Teacher-student conversations (3 questions)
- **Part 5**: Teacher lectures (3 questions)

### Reading Section

- **Part 1**: Sentence completion (4 questions)
- **Part 2**: Sentence completion (4 questions)
- **Part 3**: Passage reading (5 questions)

---

## 🚢 Deployment

### Production Deployment

The application is currently deployed on **Vercel** and accessible at:
**🔗 [https://eltis-test.vercel.app/](https://eltis-test.vercel.app/)**

### Vercel Deployment (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

The application can be deployed to any platform supporting Next.js:

- **Netlify**
- **AWS Amplify**
- **Railway**
- **DigitalOcean App Platform**

---

## 🤝 Contributing

This project was developed for JAMM School. For contributions or questions, please contact the project maintainers.

---

## 📝 License

This project is proprietary software developed for JAMM School.

---

## 🎯 Business Value

### For JAMM School

- **Lead Generation**: Captures student contact information
- **Qualification**: Assesses English proficiency before enrollment
- **Automation**: Seamless integration with CRM via Google Sheets
- **Professional Image**: Modern, polished user experience
- **Data Collection**: Comprehensive analytics on student performance

### For Students

- **Convenience**: Take the test from anywhere, anytime
- **Immediate Feedback**: Instant results after completion
- **User-Friendly**: Intuitive interface with clear instructions
- **Mobile-Friendly**: Accessible on all devices

---

## 🛠️ Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

### Code Quality

- **TypeScript** for type safety
- **ESLint** for code quality
- **Consistent code style** throughout the project

---

## 📞 Support

For technical support or questions about this project, please reach out to the development team.

---

**Built with ❤️ for JAMM School**
