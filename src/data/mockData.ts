import {
  AIAgentConfig,
  BillingSubscription,
  BusinessLocation,
  CalendarIntegrationState,
  KnowledgeBaseData,
  NotificationSettings,
  OnboardingState,
  ServiceCategory,
} from '../types/tunde';

export const ASSETS = {
  heroShop: '/src/assets/images/hero_auto_shop_1794910253303.jpg',
  serviceAdvisor: '/src/assets/images/feature_service_advisor_1794910254079.jpg',
  agentAvatar: '/src/assets/images/avatar_agent_tunde_1794910255525.jpg',
  ownerAvatar: '/src/assets/images/avatar_shop_owner_1794910254964.jpg',
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  'Oil Change',
  'Brake Inspection',
  'Check Engine Diagnostics',
  'General Diagnostics',
  'Tire Services',
  'Collision Estimate',
  'Air Conditioning',
  'Scheduled Maintenance',
  'Custom Services',
];

export const DEFAULT_SHOP_HOURS: BusinessLocation['hours'] = [
  { day: 'Monday', open: '08:00', close: '18:00', closed: false },
  { day: 'Tuesday', open: '08:00', close: '18:00', closed: false },
  { day: 'Wednesday', open: '08:00', close: '18:00', closed: false },
  { day: 'Thursday', open: '08:00', close: '18:00', closed: false },
  { day: 'Friday', open: '08:00', close: '17:30', closed: false },
  { day: 'Saturday', open: '08:30', close: '13:00', closed: false },
  { day: 'Sunday', open: '00:00', close: '00:00', closed: true },
];

export function createStarterLocation(params: {
  id?: string;
  businessId: string;
  name?: string;
  phone?: string;
  aiPhoneNumber?: string;
}): BusinessLocation {
  return {
    id: params.id || 'loc_primary',
    businessId: params.businessId,
    name: params.name || 'Primary Service Location',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: params.phone || '',
    aiPhoneNumber: params.aiPhoneNumber || '',
    timezone: 'America/New_York',
    bayCount: 4,
    slotDurationMinutes: 60,
    hours: DEFAULT_SHOP_HOURS.map((h) => ({ ...h })),
    holidays: [],
    isActive: true,
  };
}

export function createStarterAgentConfig(locationId: string, shopName: string): AIAgentConfig {
  return {
    id: `agent_${locationId}`,
    locationId,
    name: 'Maya',
    avatarUrl: ASSETS.agentAvatar,
    voiceId: 'voice-nova-en-us',
    voiceGender: 'Female',
    tone: 'Warm & Professional',
    speakingStyle: 'Conversational',
    greetingMessage: `Thank you for calling ${shopName || 'our auto repair shop'}. This call may be recorded for quality and scheduling accuracy. My name is Maya, your service receptionist. How can I help with your vehicle today?`,
    answeringMode: 'after_missed',
    ringsBeforePickup: 3,
    transferRules: [],
    schedulingRules: {
      maxDailyBookings: 12,
      bufferMinutes: 15,
      requireVinForDiagnostics: false,
      allowSameDayBooking: true,
      supportedCategories: [
        'Oil Change',
        'Brake Inspection',
        'Check Engine Diagnostics',
        'General Diagnostics',
        'Tire Services',
        'Scheduled Maintenance',
      ],
    },
    customInstructions:
      'Always ask whether a Check Engine Light is solid or flashing before quoting availability. Never guess repair totals without a physical inspection.',
    isActive: true,
    publishedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    hasUnpublishedDraft: false,
  };
}

export function createStarterKnowledgeBase(locationId: string, shopName: string, email: string): KnowledgeBaseData {
  return {
    locationId,
    businessName: shopName || 'My Automotive Shop',
    address: '',
    phone: '',
    email: email || '',
    website: '',
    hoursSummary: 'Mon–Fri 8:00 AM – 6:00 PM · Sat 8:30 AM – 1:00 PM · Closed Sun',
    holidayHours: 'Closed major holidays.',
    servicesOffered: [
      'Synthetic Oil & Filter Service',
      'Brake Pads, Rotors & Inspection',
      'Check Engine & Electrical Diagnostics',
      'Tire Services & Alignment',
    ],
    servicesNotOffered: [],
    supportedMakes: ['Ford', 'Chevrolet', 'Honda', 'Toyota', 'BMW', 'Subaru', 'Nissan'],
    warrantyInfo: 'Standard parts & labor warranty provided on completed repairs.',
    diagnosticFees: 'Diagnostic evaluation applies toward approved repairs.',
    inspectionPolicies: 'Customer approval is required before any repair work begins.',
    paymentMethods: ['Visa', 'Mastercard', 'Amex', 'Debit', 'Apple Pay'],
    financingInfo: '',
    towingPolicy: 'Contact shop desk for local tow partner details.',
    faqs: [],
    customBusinessInstructions: 'Confirm vehicle year, make, and model before checking bay openings.',
    lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
}

export function createStarterNotifications(email: string): NotificationSettings {
  return {
    emailConfirmations: true,
    smsConfirmations: true,
    reminder24h: true,
    reminderSameDay: true,
    cancellationAlerts: true,
    rescheduleAlerts: true,
    callbackAlerts: true,
    urgentRequestAlerts: true,
    alertRecipientPhone: '',
    alertRecipientEmail: email || '',
  };
}

export function createStarterCalendars(): CalendarIntegrationState[] {
  return [
    {
      provider: 'Internal Tunde Calendar',
      connected: true,
      syncStatus: 'Synced',
      lastSyncAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    },
    {
      provider: 'Google Calendar',
      connected: false,
      syncStatus: 'Not Connected',
    },
    {
      provider: 'Microsoft Outlook',
      connected: false,
      syncStatus: 'Not Connected',
    },
  ];
}

export function createStarterBilling(): BillingSubscription {
  return {
    planId: 'growth',
    planName: 'Growth Shop',
    monthlyPrice: 349,
    billingCycle: 'Monthly',
    status: 'Prototype Trial',
    minutesIncluded: 1500,
    minutesUsed: 0,
    locationsIncluded: 3,
    paymentMethodLast4: '----',
    paymentBrand: 'No card on file',
    nextBillingDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    invoices: [],
  };
}

export function createEmptyOnboardingState(email = '', businessName = ''): OnboardingState {
  return {
    currentStep: 1,
    completedSteps: [],
    accountEmail: email,
    businessName,
    shopType: 'General Mechanical & Diagnostics',
    locationName: '',
    address: '',
    phone: '',
    timezone: 'America/New_York',
    openTime: '08:00',
    closeTime: '18:00',
    selectedServices: ['Oil Change', 'Brake Inspection', 'Check Engine Diagnostics', 'Tire Services'],
    agentName: 'Maya',
    voiceId: 'voice-nova-en-us',
    greeting:
      'Thank you for calling. This call may be recorded for quality and scheduling accuracy. My name is Maya, your service receptionist. How can I help with your vehicle today?',
    answeringMode: 'after_missed',
    transferPhone: '',
    slotDuration: 60,
    bayCount: 4,
    warrantyNote: '24-month / 24,000-mile parts and labor warranty.',
    phoneVerified: false,
    notificationsEnabled: true,
    testCallCompleted: false,
    isOperational: false,
  };
}
