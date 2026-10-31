# 🎨 Design System — Amazon India E-Commerce UI

> **Aesthetic:** Amazon.in-inspired — clean, white-background storefront with the signature dark navbar, orange CTAs, and structured product grids. Familiar, trustworthy, conversion-optimized.

---

## 1. Color Palette

### Brand Colors
```
--color-amazon-orange:     #FF9900       ← Primary CTA, active states, highlights
--color-amazon-orange-hover: #E68A00     ← Button hover
--color-amazon-dark:       #131921       ← Top navbar background
--color-amazon-dark-alt:   #232F3E       ← Sub-navigation, footer background
--color-amazon-blue:       #007185       ← Links, secondary actions
--color-amazon-blue-hover: #C7511F       ← Link hover (Amazon signature)
```

### Neutral Palette
```
--color-white:             #FFFFFF       ← Page background, card background
--color-gray-50:           #F5F5F5       ← Section backgrounds (e.g., deals strip)
--color-gray-100:          #EDEDED       ← Card borders, dividers
--color-gray-200:          #D5D9D9       ← Input borders
--color-gray-300:          #BBBFBF       ← Disabled text
--color-gray-500:          #565959       ← Secondary text, descriptions
--color-gray-700:          #333333       ← Body text
--color-gray-900:          #0F1111       ← Primary text, headings
```

### Semantic Colors
```
--color-success:           #067D62       ← In stock, delivered, success toasts
--color-success-bg:        #E6F5F0       ← Success banner background
--color-warning:           #B7791F       ← Low stock, processing
--color-warning-bg:        #FFF8E1       ← Warning banner background
--color-error:             #CC0C39       ← Out of stock, errors, cancel
--color-error-bg:          #FFF0F0       ← Error banner background
--color-info:              #007185       ← Info badges, links
```

### Star Rating Colors
```
--color-star-filled:       #FFA41C       ← Filled star (Amazon gold)
--color-star-empty:        #D5D9D9       ← Empty star outline
```

---

## 2. Typography

### Font Stack
```css
/* Primary — Product titles, body text */
font-family: "Amazon Ember", "Arial", sans-serif;

/* Since Amazon Ember is proprietary, use this fallback: */
font-family: "Inter", "Segoe UI", "Arial", sans-serif;
```

**Google Fonts import:**
```
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
```

### Type Scale

| Token | Size | Weight | Usage |
|---|---|---|---|
| `text-xs` | 12px | 400 | Helper text, timestamps, "X items in stock" |
| `text-sm` | 13px | 400 | Product card descriptions, breadcrumbs |
| `text-base` | 14px | 400 | Body text (Amazon uses 14px as base!) |
| `text-md` | 15px | 500 | Navigation links, form labels |
| `text-lg` | 18px | 600 | Section headings ("Trending Products") |
| `text-xl` | 20px | 700 | Page titles |
| `text-2xl` | 24px | 700 | Hero headings |
| `text-3xl` | 28px | 800 | Product price (large display) |
| `text-price` | 28px | 400 | Product page price (Amazon uses light weight for price) |
| `text-price-symbol` | 14px | 400 | ₹ symbol (smaller than price digits) |
| `text-price-mrp` | 14px | 400 line-through | Original MRP strikethrough |

### Price Display Convention
```
₹1,299  ₹1,999  (35% off)
│        │        │
│        │        └── text-success, text-sm, font-semibold
│        └────────── text-gray-500, text-sm, line-through
└─────────────────── text-gray-900, text-2xl (symbol smaller: text-sm)
```

---

## 3. Spacing System

Use Tailwind's default 4px-based scale. Key usage:

| Token | Value | Usage |
|---|---|---|
| `p-1` | 4px | Tight icon padding |
| `p-2` | 8px | Badge padding, small gaps |
| `p-3` | 12px | Card internal padding (mobile) |
| `p-4` | 16px | Card internal padding, section gaps |
| `p-6` | 24px | Section padding |
| `p-8` | 32px | Page section spacing |
| `gap-2` | 8px | Icon + label gap |
| `gap-3` | 12px | Product card grid gap (mobile) |
| `gap-4` | 16px | Product card grid gap (desktop) |
| `gap-6` | 24px | Layout section gaps |

### Page Container
```css
max-width: 1500px;   /* Amazon uses ~1500px max */
margin: 0 auto;
padding: 0 16px;     /* Side padding on mobile */
```

---

## 4. Component Styles

### Navbar (Amazon-style)
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]   [  Search bar (full width)  🔍]   👤 Account   🛒 Cart │  ← bg-amazon-dark (#131921)
├─────────────────────────────────────────────────────────────────┤
│  All  │ Today's Deals │ Electronics │ Fashion │ Home │ ...     │  ← bg-amazon-dark-alt (#232F3E)
└─────────────────────────────────────────────────────────────────┘
```

- **Height**: Top bar 60px, Sub-nav 40px
- **Search bar**: Rounded corners, category dropdown on left, search icon on right (orange background)
- **Cart badge**: Orange circle with white count text
- **Text**: White, hover: white with underline

### Product Cards
```
┌──────────────────────┐
│                      │
│    [Product Image]   │  ← aspect-ratio: 1/1, object-fit: contain, bg-white
│                      │
├──────────────────────┤
│  Product Title...    │  ← text-sm, line-clamp-2, text-gray-900
│  ★★★★☆ (1,234)      │  ← star-gold + text-blue link
│  ₹1,299  ₹1,999     │  ← price display convention
│  [Add to Cart]       │  ← bg-amazon-orange, rounded-full, text-sm
└──────────────────────┘
```

- **Border**: 1px solid gray-100
- **Hover**: subtle box-shadow elevation + slight scale (transform: scale(1.01))
- **Border radius**: 8px
- **Padding**: 12px

### Buttons

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| Primary | `#FF9900` → `#E68A00` hover | `#0F1111` | none | Add to Cart, Proceed, Place Order |
| Secondary | `#FFFFFF` | `#0F1111` | 1px `#D5D9D9` | Quantity controls, filters |
| Buy Now | `#FFD814` → `#F7CA00` hover | `#0F1111` | none | Buy Now button (Amazon yellow) |
| Link | transparent | `#007185` → `#C7511F` hover | none | Inline actions, breadcrumbs |
| Danger | `#CC0C39` | `#FFFFFF` | none | Cancel Order, Delete |
| Ghost | transparent | `#565959` | none | Secondary actions |

**All buttons**: `border-radius: 8px`, `padding: 8px 16px`, `font-weight: 500`, `cursor: pointer`

### Form Inputs
- **Border**: 1px solid `#D5D9D9`
- **Border radius**: 4px (Amazon uses subtle rounding)
- **Focus**: 3px orange outline (`box-shadow: 0 0 0 3px rgba(255,153,0,0.3)`)
- **Height**: 40px
- **Font size**: 14px
- **Placeholder**: `#BBBFBF`

### Status Badges (Orders)

| Status | Background | Text Color | Icon |
|---|---|---|---|
| PENDING | `#FFF8E1` | `#B7791F` | Clock |
| CONFIRMED | `#E3F2FD` | `#1565C0` | CheckCircle |
| PROCESSING | `#F3E5F5` | `#7B1FA2` | Package |
| SHIPPED | `#E8F5E9` | `#2E7D32` | Truck |
| DELIVERED | `#E6F5F0` | `#067D62` | CheckCircle2 |
| CANCELLED | `#FFF0F0` | `#CC0C39` | XCircle |

---

## 5. Shadows & Elevation

| Level | Shadow | Usage |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Default cards |
| `shadow-card` | `0 2px 5px rgba(0,0,0,0.1)` | Product cards on hover |
| `shadow-dropdown` | `0 2px 10px rgba(0,0,0,0.15)` | Dropdown menus, search suggestions |
| `shadow-modal` | `0 4px 20px rgba(0,0,0,0.25)` | Modals, dialogs |
| `shadow-navbar` | `0 2px 4px rgba(0,0,0,0.1)` | Sticky navbar bottom edge |

---

## 6. Responsive Grid System

### Product Grid

| Breakpoint | Columns | Gap | Card Width |
|---|---|---|---|
| Mobile (<640px) | 2 | 8px | ~47% |
| sm (≥640px) | 2 | 12px | ~48% |
| md (≥768px) | 3 | 16px | ~31% |
| lg (≥1024px) | 4 | 16px | ~23% |
| xl (≥1280px) | 5 | 16px | ~18% |

### Layout Patterns

**Products page (desktop):**
```
┌──────────┬─────────────────────────────────────┐
│          │  Sort: [Dropdown]          Showing   │
│ Filters  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│ Sidebar  │  │Card│ │Card│ │Card│ │Card│ │Card││
│ (240px)  │  └────┘ └────┘ └────┘ └────┘ └────┘│
│          │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│          │  │Card│ │Card│ │Card│ │Card│ │Card││
│          │  └────┘ └────┘ └────┘ └────┘ └────┘│
│          │            [1] [2] [3] [→]          │
└──────────┴─────────────────────────────────────┘
```

**Products page (mobile):**
```
┌─────────────────────────┐
│  [Filters ▼] [Sort ▼]  │   ← Collapsed to dropdowns
│  ┌──────┐  ┌──────┐    │
│  │ Card │  │ Card │    │
│  └──────┘  └──────┘    │
│  ┌──────┐  ┌──────┐    │
│  │ Card │  │ Card │    │
│  └──────┘  └──────┘    │
│       [Load More]       │
└─────────────────────────┘
```

---

## 7. Animations & Transitions

### Micro-Animations
| Animation | Duration | Easing | Trigger |
|---|---|---|---|
| Card hover lift | 200ms | ease-out | Mouse enter on product card |
| Button press | 100ms | ease-in | Click/active state |
| Cart badge bounce | 300ms | ease-out | Item added to cart |
| Drawer slide-in | 300ms | cubic-bezier(0.4, 0, 0.2, 1) | Cart drawer open |
| Skeleton pulse | 1.5s | infinite ease-in-out | Loading state |
| Toast slide-up | 200ms | ease-out | Notification appear |
| Page transition | 150ms | ease-in-out | Route change |
| Dropdown expand | 150ms | ease-out | Menu open |

### Page Loading
- **Skeleton screens** for product grids (not spinners) — Amazon pattern
- **Shimmer gradient** animation on skeleton blocks
- **Progressive image loading**: Low-res blur → full-res on load

---

## 8. Icons (Lucide React)

| Context | Icon | Usage |
|---|---|---|
| Search | `Search` | Navbar search bar |
| Cart | `ShoppingCart` | Navbar + cart pages |
| User | `User` | Account menu |
| Heart | `Heart` / `HeartOff` | Wishlist toggle |
| Star | `Star` | Rating display |
| Plus/Minus | `Plus` / `Minus` | Quantity selector |
| Trash | `Trash2` | Remove item |
| Package | `Package` | Order tracking |
| Truck | `Truck` | Shipped status |
| Check | `CheckCircle` | Success, delivered |
| X | `XCircle` | Cancel, error |
| Menu | `Menu` | Mobile hamburger |
| ChevronDown | `ChevronDown` | Dropdowns |
| ArrowLeft | `ArrowLeft` | Back navigation |
| Filter | `SlidersHorizontal` | Filter toggle |
| Edit | `Pencil` | Edit actions |
| MapPin | `MapPin` | Address |
| CreditCard | `CreditCard` | Payment |
| LayoutDashboard | `LayoutDashboard` | Admin dashboard |
| Users | `Users` | Admin user management |
| BarChart3 | `BarChart3` | Admin stats |
| AlertTriangle | `AlertTriangle` | Low stock warning |

---

## 9. Accessibility Rules

### Required
1. **All interactive elements** must have visible focus rings (orange outline)
2. **Images** must have `alt` text — product name for product images
3. **Form fields** must have associated `<label>` elements
4. **Buttons** must have descriptive text or `aria-label`
5. **Color contrast** must meet WCAG 2.1 AA (4.5:1 for text, 3:1 for large text)
6. **Keyboard navigation** must work for all interactive elements (Tab, Enter, Escape)
7. **Screen reader announcements** for cart count changes, form errors, toast notifications
8. **Modals** must trap focus and close on Escape

### Radix UI Handles
- Dialog focus trapping ✓
- Dropdown keyboard navigation ✓
- Sheet overlay click-to-close ✓
- Tooltip positioning ✓

---

## 10. Dark Mode (Future Enhancement)

Not in initial scope. The Amazon.in storefront is traditionally light-themed. Dark mode can be added later as an account preference, toggling CSS custom properties via Tailwind's `dark:` variant.

---

## 11. Tailwind Configuration Extensions

```js
// tailwind.config.js key extensions
{
  theme: {
    extend: {
      colors: {
        amazon: {
          orange: '#FF9900',
          'orange-hover': '#E68A00',
          yellow: '#FFD814',
          'yellow-hover': '#F7CA00',
          dark: '#131921',
          'dark-alt': '#232F3E',
          blue: '#007185',
          'blue-hover': '#C7511F',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      maxWidth: {
        'container': '1500px',
      },
      fontSize: {
        'base': '14px',  // Amazon's default
      }
    }
  }
}
```
