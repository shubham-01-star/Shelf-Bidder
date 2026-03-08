# Brand Dashboard Components

This directory contains reusable components for the brand dashboard redesign.

## DashboardHeader

A header component for the brand dashboard with time-based greeting, brand name display, and profile avatar.

### Features

- **Time-based Greeting**: Displays "Good Morning" (0-11), "Good Afternoon" (12-16), or "Good Evening" (17-23)
- **Brand Name Display**: Shows the brand name from localStorage
- **Profile Avatar**: Displays the first letter of the brand name in a circular avatar
- **Navigation**: Clicking the avatar navigates to the login page
- **Warm Color Theme**: Uses #f8f5f5 background and #ff5c61 accent colors

### Usage

```tsx
import DashboardHeader from '@/components/brand/DashboardHeader';

export default function MyPage() {
  return (
    <div className="min-h-screen bg-[#f8f5f5]">
      <DashboardHeader />
      {/* Your page content */}
    </div>
  );
}
```

### Props

- `className` (optional): Additional CSS classes to apply to the header

### Requirements

This component implements requirements:
- 9N.2: Time-based greeting display
- 9N.3: Brand name display from localStorage
- 9N.4: Profile avatar with first letter
- 9N.5: Navigation to login on avatar click

### Testing

The component includes unit tests for the greeting logic:

```bash
npm test -- src/components/brand/__tests__/DashboardHeader.test.ts
```

### Demo

Visit `/brand/dashboard-redesign` to see the component in action with the full warm light theme.

---

## MetricsCard

A reusable card component for displaying dashboard metrics with icon, label, and value. Supports gradient styling for special cards (e.g., wallet balance) and includes loading state skeletons.

### Features

- **Flexible Display**: Shows icon, label, and numeric/string values
- **Currency Formatting**: Automatically formats numeric values as Indian Rupees (₹) with thousand separators
- **Gradient Styling**: Optional purple-to-blue gradient for wallet balance card
- **Loading States**: Built-in skeleton loader for data fetching
- **Soft Shadows**: Elevated card design with soft shadows (0 4px 20px rgba(0,0,0,0.05))
- **Rounded Corners**: 1.5rem border radius for modern look
- **Responsive**: Works seamlessly across all screen sizes

### Usage

```tsx
import { MetricsCard } from '@/components/brand/MetricsCard';

// Basic metrics card
<MetricsCard
  icon={<CampaignIcon />}
  label="Active Campaigns"
  value={5}
/>

// Wallet balance with gradient
<MetricsCard
  icon={<WalletIcon />}
  label="Wallet Balance"
  value={50000}
  isGradient={true}
/>

// Loading state
<MetricsCard
  icon={<CampaignIcon />}
  label="Active Campaigns"
  value={0}
  isLoading={true}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `React.ReactNode` | required | Icon to display at the top of the card |
| `label` | `string` | required | Label text describing the metric |
| `value` | `string \| number` | required | The metric value (numbers are auto-formatted as currency) |
| `isLoading` | `boolean` | `false` | Shows skeleton loader when true |
| `isGradient` | `boolean` | `false` | Applies purple-to-blue gradient styling |
| `className` | `string` | `''` | Additional CSS classes |

### Currency Formatting Utility

The component exports a `formatCurrency` utility function:

```tsx
import { formatCurrency } from '@/components/brand/MetricsCard';

formatCurrency(12500);    // "₹12,500"
formatCurrency(1000000);  // "₹10,00,000"
formatCurrency(50000);    // "₹50,000"
```

### Complete Example

See `MetricsCard.example.tsx` for comprehensive usage examples including:
- Basic metrics cards
- Gradient wallet balance card
- Loading states
- String values (non-currency)
- Complete dashboard metrics grid
- Custom styling

### Requirements

This component implements requirements:
- 1.3: White card surfaces with soft shadows
- 1.6: Rounded corners (1.5rem)
- 1.7: Soft shadow effects
- 3.3: Gradient styling for wallet balance
- 3.7: Purple-600 to blue-600 gradient
- 6.4: Metric cards with icon, label, and value
- 6.6: Loading state skeletons

### Testing

The component includes comprehensive unit tests for the currency formatting utility:

```bash
npm test -- src/components/brand/__tests__/MetricsCard.test.ts
```

Tests cover:
- Currency formatting with ₹ symbol and thousand separators
- Indian numbering system (lakhs and crores)
- Edge cases (zero, boundaries, large numbers)
- Typical wallet amounts

### Styling Details

- **Default Card**: White background (`bg-white`), soft shadow (`shadow-soft-shadow`)
- **Gradient Card**: Purple-to-blue gradient (`bg-gradient-to-br from-purple-600 to-blue-600`), white text
- **Border Radius**: 1.5rem (`rounded-3xl`)
- **Padding**: 1.5rem (`p-6`)
- **Icon Color**: Brand accent (`#ff5c61`) for default, white for gradient
- **Label Color**: Subdued text (`#64748b`) for default, white/80 for gradient
- **Value Size**: 3xl font size, bold weight
