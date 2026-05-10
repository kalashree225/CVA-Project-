# Vision Monitor Frontend Plan

## Tech Stack Selection

**Chosen Stack:** Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui + Recharts

### Rationale:
- **Next.js 14**: Modern React framework with App Router, SSR, API routes, and excellent performance
- **TypeScript**: Type safety and better developer experience
- **Tailwind CSS**: Utility-first CSS for rapid UI development
- **shadcn/ui**: Beautiful, accessible component library built on Radix UI
- **Recharts**: Declarative charting library for metrics visualization
- **Zustand**: Lightweight state management
- **React Query**: Data fetching and caching
- **Axios**: HTTP client with interceptors

## Backend API Analysis

### Authentication Endpoints
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token
- `GET /api/v1/auth/me` - Get current user info
- `POST /api/v1/auth/organizations` - Create organization (admin only)

### Inference Endpoints
- `POST /api/v1/inference/run` - Run inference
- `GET /api/v1/inference/runs` - List runs with pagination and filters
- `GET /api/v1/inference/runs/{run_id}` - Get run details

### Metrics Endpoints
- `GET /api/v1/metrics/summary` - Get metrics summary (last N hours)
- `GET /api/v1/metrics/timeseries` - Get time-series data for specific metric

### Alerts Endpoints
- `POST /api/v1/alerts/rules` - Create alert rule
- `GET /api/v1/alerts/rules` - List alert rules
- `DELETE /api/v1/alerts/rules/{rule_id}` - Delete alert rule
- `GET /api/v1/alerts/events` - List recent alert events

### Health Endpoints
- `GET /api/v1/health` - Health status of all services
- `WS /api/v1/health/stream` - Real-time health updates

## Frontend Architecture

### Page Structure
```
/app
├── (auth)
│   ├── login/page.tsx
│   └── register/page.tsx
├── dashboard
│   ├── page.tsx (main dashboard)
│   ├── runs/page.tsx (inference runs)
│   ├── metrics/page.tsx (metrics visualization)
│   ├── alerts/page.tsx (alerts management)
│   ├── settings/page.tsx (organization settings)
│   └── profile/page.tsx (user profile)
└── layout.tsx (root layout with providers)
```

### Component Structure
```
/components
├── ui (shadcn components)
├── layout
│   ├── Sidebar.tsx
│   ├── Header.tsx
│   └── Footer.tsx
├── dashboard
│   ├── MetricCard.tsx
│   ├── RecentRuns.tsx
│   └── HealthStatus.tsx
├── runs
│   ├── RunList.tsx
│   ├── RunDetail.tsx
│   └── RunFilters.tsx
├── metrics
│   ├── MetricsChart.tsx
│   ├── TimeSeriesChart.tsx
│   └── MetricsFilters.tsx
├── alerts
│   ├── AlertRules.tsx
│   ├── AlertEvents.tsx
│   └── CreateAlertDialog.tsx
└── auth
    ├── LoginForm.tsx
    └── RegisterForm.tsx
```

### Services Structure
```
/lib
├── api
│   ├── client.ts (axios instance with auth)
│   ├── auth.ts (auth API calls)
│   ├── inference.ts (inference API calls)
│   ├── metrics.ts (metrics API calls)
│   ├── alerts.ts (alerts API calls)
│   └── health.ts (health API calls)
├── store
│   ├── auth.ts (auth state)
│   └── ui.ts (UI state)
├── hooks
│   ├── useAuth.ts
│   ├── useInference.ts
│   └── useMetrics.ts
└── utils
    ├── formatters.ts
    └── validators.ts
```

## Implementation Order

### Phase 1: Setup & Authentication (High Priority)
1. Create Next.js project with TypeScript
2. Install dependencies (shadcn/ui, recharts, zustand, react-query, axios)
3. Set up Tailwind CSS
4. Create API client with axios and auth interceptors
5. Set up Zustand auth store
6. Build login page
7. Build register page
8. Add protected route middleware

### Phase 2: Core Layout & Dashboard (High Priority)
9. Create root layout with providers
10. Build sidebar navigation
11. Build header with user menu
12. Create main dashboard page
13. Add metric cards (total requests, avg latency, error rate)
14. Add recent runs table
15. Add health status indicator

### Phase 3: Inference Runs (High Priority)
16. Build runs list page with pagination
17. Add filters (model, input type, status, date range)
18. Build run detail page
19. Add export functionality

### Phase 4: Metrics Visualization (High Priority)
20. Build metrics dashboard page
21. Add line charts for latency over time
22. Add bar charts for model comparison
23. Add time-series chart component
24. Add metric selector and time range filter

### Phase 5: Alerts Management (Medium Priority)
25. Build alerts rules page
26. Add create alert dialog
27. Add delete alert functionality
28. Build alert events page
29. Add event filtering

### Phase 6: Settings & Profile (Medium Priority)
30. Build organization settings page
31. Add data retention settings
32. Build user profile page
33. Add user management (for admins)

### Phase 7: Polish & UX (Medium/Low Priority)
34. Add loading states to all pages
35. Add error boundaries and error handling
36. Add toast notifications
37. Implement dark mode
38. Add responsive design for mobile
39. Add keyboard shortcuts
40. Add search functionality

## Key Features to Implement

### Authentication
- JWT token storage (localStorage/cookies)
- Automatic token refresh
- Protected routes
- Logout functionality
- Remember me option

### Dashboard
- Real-time metrics cards
- Recent activity feed
- Quick actions (new inference, create alert)
- Health status indicator
- Organization info display

### Inference Runs
- Paginated list with filters
- Status badges (pending, completed, failed)
- Sortable columns
- Detail view with full information
- Export to CSV/JSON

### Metrics
- Interactive charts with zoom/pan
- Multiple chart types (line, bar, area)
- Time range selector (1h, 6h, 24h, 7d, 30d)
- Model comparison
- Metric selector (latency, tokens, cost, hallucination)

### Alerts
- Create/edit/delete alert rules
- Real-time alert events feed
- Alert history
- Webhook configuration
- Alert notification settings

### Settings
- Organization profile
- Data retention policy
- User management (admin)
- API key management
- Billing information (placeholder)

## Design System

### Color Palette
- Primary: Blue (#3b82f6)
- Secondary: Purple (#8b5cf6)
- Success: Green (#10b981)
- Warning: Yellow (#f59e0b)
- Error: Red (#ef4444)
- Neutral: Gray (#6b7280)

### Typography
- Headings: Inter, 700
- Body: Inter, 400
- Code: JetBrains Mono, 400

### Spacing
- Base: 4px
- Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96

### Components
- Cards with subtle shadows
- Rounded corners (8px)
- Hover states for interactive elements
- Loading spinners
- Toast notifications
- Modal dialogs
- Dropdown menus

## Performance Considerations

- Use React Query for data caching
- Implement pagination for large lists
- Lazy load charts
- Debounce search inputs
- Optimize images
- Use Next.js Image component
- Implement code splitting
- Use React.memo for expensive components

## Security Considerations

- Secure storage of JWT tokens
- CSRF protection
- XSS prevention
- Input validation
- Rate limiting on API calls
- Secure HTTP headers
- Content Security Policy

## Accessibility

- ARIA labels
- Keyboard navigation
- Focus management
- Screen reader support
- Color contrast compliance
- Semantic HTML
- Alt text for images

## Testing Strategy

- Unit tests with Jest
- Component tests with React Testing Library
- E2E tests with Playwright
- API mocking with MSW
- Visual regression tests

## Deployment

- Vercel hosting (recommended for Next.js)
- Environment variables configuration
- CI/CD pipeline
- Performance monitoring
- Error tracking (Sentry)
- Analytics (Vercel Analytics)
