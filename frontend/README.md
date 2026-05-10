# Vision Monitor Frontend

A minimal SaaS frontend for the Vision + LLM Monitoring System built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **Zustand** - Lightweight state management
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **Recharts** - Charting library (to be installed)
- **Sonner** - Toast notifications

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

Build for production:
```bash
npm run build
```

Start production server:
```bash
npm start
```

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/           # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── dashboard/        # Dashboard pages
│   │   ├── layout.tsx    # Dashboard layout with navigation
│   │   ├── page.tsx      # Main dashboard
│   │   ├── runs/         # Inference runs page
│   │   ├── metrics/      # Metrics visualization
│   │   ├── alerts/       # Alerts management
│   │   ├── settings/     # Organization settings
│   │   └── profile/      # User profile
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home redirect
│   └── providers.tsx     # React Query and Toast providers
├── components/           # Reusable components (to be added)
├── lib/
│   ├── api/              # API client and endpoints
│   │   ├── client.ts     # Axios client with auth
│   │   └── auth.ts       # Authentication API
│   ├── store/            # State management
│   │   └── auth.ts       # Auth store (Zustand)
│   └── utils.ts          # Utility functions
├── public/               # Static assets
├── .env.example          # Environment variables template
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind CSS config
├── postcss.config.js     # PostCSS config
└── next.config.js        # Next.js config
```

## Features

### Authentication
- User registration
- User login with JWT
- Protected routes
- Auto logout on token expiration

### Dashboard
- Metrics overview cards
- Recent inference runs table
- Real-time data fetching

### Inference Runs
- Paginated list of inference runs
- Filtering by model, input type, and status
- Detailed run information

### Metrics
- Time-series data visualization
- Metric selection (latency, tokens, cost, hallucination)
- Model comparison
- Time range selection

### Alerts
- Create alert rules
- List active rules
- Delete alert rules
- View recent alert events
- Webhook integration

### Settings & Profile
- Organization information
- User profile details
- (Future: User management, API keys, billing)

## API Integration

The frontend integrates with the backend API at `/api/v1`:

- Authentication: `/api/v1/auth/*`
- Inference: `/api/v1/inference/*`
- Metrics: `/api/v1/metrics/*`
- Alerts: `/api/v1/alerts/*`
- Health: `/api/v1/health`

## State Management

State is managed using:
- **Zustand** for authentication state
- **React Query** for server state caching
- Local component state for UI

## Styling

- Tailwind CSS for utility classes
- Dark mode support (configured but not fully implemented)
- Responsive design

## Future Enhancements

- [ ] Install and integrate Recharts for metrics visualization
- [ ] Implement dark mode toggle
- [ ] Add responsive mobile menu
- [ ] Create reusable UI components with shadcn/ui
- [ ] Add loading skeletons
- [ ] Implement error boundaries
- [ ] Add search functionality
- [ ] Implement data export (CSV/JSON)
- [ ] Add user management for admins
- [ ] Implement API key management
- [ ] Add billing information page
- [ ] Add notification preferences
- [ ] Implement real-time updates with WebSocket
- [ ] Add unit and integration tests
- [ ] Add E2E tests with Playwright

## Deployment

Recommended deployment platforms:
- Vercel (recommended for Next.js)
- Netlify
- AWS Amplify
- Docker container

## Notes

- The lint errors shown in the IDE are expected until dependencies are installed with `npm install`
- The backend API must be running at the configured URL
- JWT tokens are stored in localStorage
- Token expiration is 30 minutes
