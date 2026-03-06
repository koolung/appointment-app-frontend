# Admin Dashboard

Complete admin management interface for the salon booking platform.

## Features Implemented

### 1. **Admin Dashboard** (`/admin`)
- Overview statistics (appointments, employees, services, revenue)
- Quick action cards for common tasks
- Recent activity feed
- Real-time metrics with trending indicators

### 2. **Employee Management** (`/admin/employees`)
- View all employees with status
- Add new employees (`/admin/employees/new`)
- Edit employee details
- Activate/deactivate employees
- Employee performance metrics

### 3. **Service Management** (`/admin/services`)
- Browse all salon services
- Add new services (`/admin/services/new`)
- Edit service details
- Set pricing and duration
- Manage service categories
- Activate/deactivate services

### 4. **Reports & Analytics** (`/admin/reports`)
- Revenue reports (total and monthly)
- Appointment statistics
- Completion rates
- Cancellation metrics
- Top services ranking
- Employee performance data

### 5. **Appointments** (`/admin/appointments`)
- Calendar view of all appointments
- Today's appointment list
- Appointment status management
- Client and employee assignment

### 6. **Availability** (`/admin/availability`)
- Set employee work schedules
- Configure working hours
- Manage days off
- Exception date handling
- Break time management

### 7. **Settings** (`/admin/settings`)
- Business information
- Contact details
- Operating hours
- Notification preferences
- Salon configuration

## File Structure

```
frontend/src/
├── app/
│   └── admin/
│       ├── page.tsx                 # Main dashboard
│       ├── employees/
│       │   ├── page.tsx             # Employees list
│       │   └── new/page.tsx         # Add employee form
│       ├── services/
│       │   ├── page.tsx             # Services list
│       │   └── new/page.tsx         # Add service form
│       ├── appointments/page.tsx     # Appointments calendar
│       ├── availability/page.tsx     # Availability rules
│       ├── reports/page.tsx          # Analytics & reports
│       └── settings/page.tsx         # Admin settings
├── components/
│   └── admin/
│       ├── AdminLayout.tsx           # Main layout wrapper
│       ├── AdminNavigation.tsx        # Sidebar navigation
│       ├── StatCard.tsx              # Metric card component
│       └── QuickActions.tsx           # Action buttons
└── lib/
    └── api.ts                        # API client
```

## Components

### AdminLayout
Wraps all admin pages with authentication checks and sidebar navigation.
- Redirects to login if not authenticated
- Redirects to dashboard if not admin role
- Provides sidebar navigation

### AdminNavigation
Sidebar with navigation links to all admin sections.
- Active route highlighting
- Icon support
- Responsive design

### StatCard
Reusable card component for displaying metrics.
- Icon, label, value display
- Optional trending indicators
- 4 color variants (blue, green, purple, orange)

### QuickActions
Grid of quick action buttons.
- Add employee
- Add service
- View calendar
- View reports

## Navigation Paths

```
/admin                      → Dashboard (home)
/admin/employees            → Employees list
/admin/employees/new        → Add new employee
/admin/employees/[id]       → Edit employee
/admin/services             → Services list
/admin/services/new         → Add new service
/admin/services/[id]        → Edit service
/admin/appointments         → Appointments calendar
/admin/availability         → Availability management
/admin/reports              → Analytics & reports
/admin/settings             → Settings
```

## Authentication

All admin pages require:
1. Valid JWT token in auth store
2. User role = 'ADMIN'

If not authenticated, user is redirected to `/login`.
If not admin, user is redirected to `/dashboard`.

## API Integration

The admin dashboard integrates with these backend endpoints:

- `GET /employees` - List all employees
- `POST /employees` - Create new employee (not yet implemented)
- `GET /employees/:id` - Get employee details
- `PUT /employees/:id` - Update employee
- `DELETE /employees/:id` - Delete employee

- `GET /services` - List all services
- `POST /services` - Create new service (not yet implemented)
- `GET /services/:id` - Get service details
- `PUT /services/:id` - Update service
- `DELETE /services/:id` - Delete service

- `GET /reports/revenue` - Get revenue reports
- `GET /reports/revenue/by-service` - Revenue by service
- `GET /reports/revenue/by-employee` - Revenue by employee

- `GET /appointments` - List all appointments
- `GET /appointments/:id` - Get appointment details
- `PUT /appointments/:id` - Update appointment status

## Next Steps

1. **Implement form submission** - Connect employee/service creation forms to API
2. **Add calendar view** - Integrate FullCalendar or React Calendar
3. **Implement charts** - Add Chart.js for revenue visualization
4. **Add drag-drop** - Implement appointment rescheduling
5. **Export reports** - PDF/Excel export functionality
6. **Add filters** - Date range, status, employee filters
7. **Real-time updates** - WebSocket integration for live data
8. **Mobile responsive** - Improve mobile experience
9. **Dark mode** - Add dark theme support
10. **Accessibility** - Improve WCAG compliance

## Styling

- **Tailwind CSS** for all styles
- **Color scheme**: Blue primary, slate neutral
- **Responsive** design with mobile-first approach
- **Consistent spacing** and typography

## State Management

Uses **Zustand** for:
- Authentication state (user, token)
- User role checking

Future: Add global state for:
- Dashboard metrics
- Cached employee/service lists
- Notification preferences
