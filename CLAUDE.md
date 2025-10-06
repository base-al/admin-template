# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🏗️ PROJECT ARCHITECTURE

**Negenet ISP Admin Portal** - Nuxt.js 3 frontend for ISP billing management system with dual customer support (residential prepaid + business postpaid).

### **Core Architecture Patterns**
- **Order-Centric Billing**: All billing flows through orders with separate residential/business logic
- **Dual Customer System**: Separate `Customer` (prepaid) and `BusinessCustomer` (postpaid) entities
- **Component Separation**: Dedicated components for residential vs business customer workflows
- **Pinia Store Pattern**: All pages use Pinia stores instead of direct API calls
- **Type-Safe Development**: Comprehensive TypeScript interfaces for all entities

### **Key Business Logic Differences**
- **Residential Customers**: Prepaid monthly orders, service extends from payment date, grace periods supported
- **Business Customers**: Postpaid with calendar month cycles (1st to end-of-month), Net 30 payment terms, no grace periods
- **Order Stacking**: Sequential orders without gaps or overlaps, handled by backend date calculation

## 🔧 DEVELOPMENT COMMANDS

### **Core Development**
```bash
# Start development server (localhost:3030)
bun dev

# Build for production
bun build

# Lint and fix TypeScript/Vue errors
bun lint

# Generate static site
bun generate

# Preview production build
bun preview
```

### **Backend Integration**
- **API Base**: http://localhost:8100/api (Base Framework Go API)
- **Development Proxy**: `/api` routes proxied to backend during development
- **Authentication**: JWT tokens with API keys stored in cookies

### **Quality Assurance**
```bash
# Run all linting checks
bun lint

# Check specific file types
bun x eslint app/components/**/*.vue
bun x eslint app/stores/**/*.ts
```

## 📁 CODE ARCHITECTURE

### **Component Architecture**
```
app/components/
├── customers/           # Residential customer components (prepaid)
│   ├── Plan.vue        # Shows current plan + upcoming plans
│   ├── Orders.vue      # Order history and actions
├── business-customers/  # Business customer components (postpaid)  
│   ├── Plan.vue        # Same interface but different billing logic
├── order/              # Order creation and management
│   ├── QuickRenewalModal.vue         # Residential renewals only
│   ├── BusinessQuickRenewalModal.vue # Business renewals (calendar month)
│   ├── ResidentialOrderCreationModal.vue  # Residential order wizard
│   ├── BusinessOrderCreationModal.vue     # Business order wizard
│   └── steps/          # Shared order creation steps
```

### **Store Architecture**
```
app/stores/
├── customers.ts         # Residential customer CRUD operations
├── business-customers.ts # Business customer CRUD operations  
├── orders.ts           # Order management with dual endpoints
├── plans.ts            # Service plan management
├── auth.ts             # Authentication and session management
├── settings.ts         # System configuration (key-value store)
└── [invoices|payments|grace-periods|authorization|employees].ts # Additional billing modules
```

### **Type System**
```
app/types/
├── index.ts            # Main export hub
├── customer.ts         # Residential customer interface
├── business-customer.ts # Business customer interface  
├── order.ts            # Order system with OrderType enum
├── plan.ts             # Service plan interface
└── common.ts           # Shared interfaces (filters, pagination)
```

### **Critical Type Differences**
```typescript
// Residential order creation
const residentialOrderData = {
  customer_id: number,
  status: 'paid',           // Prepaid
  order_type: 'regular'
}

// Business order creation  
const businessOrderData = {
  business_customer_id: number,
  status: 'pending',        // Postpaid (Net 30)
  order_type: 'prorated' | 'regular'  // Prorated for initial signup
}
```

## 🔄 BILLING WORKFLOW PATTERNS

### **Order Creation Endpoints**
- **Residential**: `POST /api/orders/residential` - Prepaid orders with immediate payment
- **Business**: `POST /api/orders/business` - Postpaid orders with prorated first month

### **Date Calculation Logic**
- **Empty `period_start/period_end`**: Backend calculates proper stacked dates
- **Residential**: Service extends from current end date for exact plan duration  
- **Business**: Calendar month cycles (always end-of-month) with prorated first month

### **Plan Renewal Differences**
- **Residential**: `QuickRenewalModal.vue` - Simple month extension from service end
- **Business**: `BusinessQuickRenewalModal.vue` - Calendar month billing (Oct 1 → Oct 31)

## ⚙️ CONFIGURATION

### **API Configuration**
- **Development**: API proxied through Nitro to `localhost:8100`
- **Production**: Direct API calls to configured `API_BASE_URL`
- **Authentication**: JWT tokens stored in secure cookies with API key headers

### **ESLint Configuration**
- **@nuxt/eslint**: Official Nuxt ESLint module with Vue 3 + TypeScript rules
- **Type Files Exception**: `app/types/**/*.ts` files allow `any` types for flexible interfaces
- **No Deprecated Filters**: Vue filters flagged as deprecated

### **Internationalization**
- **Languages**: English (default), Albanian (sq), Serbian (sr)
- **Strategy**: Prefix except default (`/en/page`, `/sq/page`, `/page`)
- **Detection**: Browser language with cookie persistence

## 🛠️ COMPONENT DEVELOPMENT PATTERNS

### **Modal Pattern**
```vue
<script setup lang="ts">
// Always use computed for v-model binding
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Emit structured data for parent handling
emit('orderCreated', {
  planId: number,
  extendMonths: number,
  startDate: string,
  order?: Order
})
</script>
```

### **Store Usage Pattern**
```typescript
// Always use stores instead of direct API calls
const customersStore = useCustomersStore()
const ordersStore = useOrdersStore()

// Load data in components, not pages
await customersStore.fetchCustomers()
await ordersStore.fetchCustomerOrders(customerId)
```

### **Date Handling**
- **Backend Dates**: Always ISO format (`2025-10-01`)  
- **Display Dates**: Use `useDateFormat()` composable for user-friendly format (`1 October 2025`)
- **Type Assertions**: Use `as string` for date operations to prevent TypeScript undefined errors

## 🚨 CRITICAL DEVELOPMENT NOTES

### **Customer Type Separation**
- **Never mix residential and business logic** in the same component
- **Use separate modals** for order creation and renewal
- **Different endpoints** for residential vs business operations
- **Validate customer type** before API calls

### **Order System Architecture**
- **Backend calculates dates** when `period_start/period_end` are empty strings
- **Frontend displays estimated dates** for UI only
- **Order stacking** handled entirely by backend to prevent gaps/overlaps
- **Always pass empty date strings** for renewal orders to trigger backend calculation

### **TypeScript Considerations**  
- **Type definitions allow `any`** in `app/types/` files for flexibility
- **Component props require default values** to eliminate Vue warnings
- **Order interfaces differ** between residential and business customers
- **Use type assertions carefully** for date string operations