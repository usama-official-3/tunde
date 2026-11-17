export type ThemeMode = 'light' | 'dark';

export type ServiceCategory =
  | 'Oil Change'
  | 'Brake Inspection'
  | 'Check Engine Diagnostics'
  | 'General Diagnostics'
  | 'Tire Services'
  | 'Collision Estimate'
  | 'Air Conditioning'
  | 'Scheduled Maintenance'
  | 'Custom Services'
  | (string & {});

export interface CustomServiceCategoryConfig {
  id: string;
  name: string;
  defaultDurationMinutes: number;
  maxPerSlot: number;
  notes: string;
}

export type CallStatus = 'Answered' | 'Missed' | 'Transferred' | 'Failed';
export type AppointmentOutcome = 'Booked' | 'Rescheduled' | 'Cancelled' | 'Inquiry Only' | 'Callback Required';
export type CallbackStatus = 'Pending' | 'In Progress' | 'Completed';
export type CallbackUrgency = 'Normal' | 'High' | 'Urgent';
export type AppointmentStatus = 'Scheduled' | 'Confirmed' | 'In Bay' | 'Completed' | 'Cancelled' | 'Rescheduled';

export interface BusinessLocation {
  id: string;
  businessId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  aiPhoneNumber: string;
  timezone: string;
  bayCount: number;
  slotDurationMinutes: number;
  hours: {
    day: string;
    open: string;
    close: string;
    closed: boolean;
  }[];
  holidays: { date: string; label: string }[];
  isActive: boolean;
}

export interface Customer {
  id: string;
  locationId: string;
  name: string;
  phone: string;
  email: string;
  status: 'New' | 'Returning';
  preferredContact: 'SMS' | 'Email' | 'Phone';
  createdAt: string;
  notes: string;
}

export interface Vehicle {
  id: string;
  customerId: string;
  locationId: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  mileage: number;
  vin: string;
  licensePlate?: string;
  serviceHistory: {
    date: string;
    service: string;
    mileage: number;
    notes: string;
  }[];
}

export interface TranscriptLine {
  speaker: 'AI' | 'Caller';
  timestamp: string;
  text: string;
}

export interface CallRecord {
  id: string;
  locationId: string;
  callerName: string;
  phoneNumber: string;
  customerId?: string;
  vehicleId?: string;
  vehicleSummary?: string;
  date: string;
  time: string;
  durationSeconds: number;
  status: CallStatus;
  aiReceptionistName: string;
  outcome: AppointmentOutcome;
  callbackStatus: CallbackStatus | 'None';
  recordingAvailable: boolean;
  recordingSid?: string;
  recordingUrl?: string;
  recordingConsent: 'Disclosed & Consented' | 'Two-Party State Notice Played' | 'Recording Disabled';
  serviceRequest: string;
  aiSummary: string;
  transcript: TranscriptLine[];
  appointmentId?: string;
  callbackId?: string;
  recoveredMissedCall: boolean;
}

export interface Appointment {
  id: string;
  locationId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  vehicleId: string;
  vehicleLabel: string;
  category: ServiceCategory;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  status: AppointmentStatus;
  source: 'AI' | 'Manual';
  internalNotes: string;
  estimatedValue?: number;
}

export interface CallbackTask {
  id: string;
  locationId: string;
  customerId?: string;
  customerName: string;
  phone: string;
  vehicleLabel: string;
  reason: string;
  aiCallSummary: string;
  urgency: CallbackUrgency;
  status: CallbackStatus;
  assignedEmployeeId: string;
  assignedEmployeeName: string;
  dueDate: string;
  createdAt: string;
  callId?: string;
}

export interface TeamMember {
  id: string;
  locationId: string;
  name: string;
  role: 'Owner' | 'Service Manager' | 'Service Advisor' | 'Lead Technician';
  email: string;
  phone: string;
  extension: string;
  isTransferDestination: boolean;
  receivesCallbacks: boolean;
  availability: 'Available' | 'On Call' | 'Off Duty';
  permissions: string[];
}

export type AnsweringMode =
  | 'never'
  | 'after_missed'
  | 'when_busy'
  | 'after_hours'
  | '24_7'
  | 'dedicated_number';

export interface AIAgentConfig {
  id: string;
  locationId: string;
  name: string;
  avatarUrl: string;
  voiceId: string;
  voiceGender: 'Female' | 'Male';
  tone: 'Warm & Professional' | 'Direct & Efficient' | 'Friendly Neighborhood';
  speakingStyle: 'Conversational' | 'Concise' | 'Detailed Advisor';
  greetingMessage: string;
  answeringMode: AnsweringMode;
  ringsBeforePickup: number;
  transferRules: {
    id: string;
    trigger: string;
    destinationMemberId: string;
    destinationPhone: string;
    enabled: boolean;
  }[];
  schedulingRules: {
    maxDailyBookings: number;
    bufferMinutes: number;
    requireVinForDiagnostics: boolean;
    allowSameDayBooking: boolean;
    supportedCategories: ServiceCategory[];
  };
  customInstructions: string;
  isActive: boolean;
  publishedAt: string;
  hasUnpublishedDraft: boolean;
}

export interface KnowledgeBaseData {
  locationId: string;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  hoursSummary: string;
  holidayHours: string;
  servicesOffered: string[];
  servicesNotOffered: string[];
  supportedMakes: string[];
  warrantyInfo: string;
  diagnosticFees: string;
  inspectionPolicies: string;
  paymentMethods: string[];
  financingInfo: string;
  towingPolicy: string;
  faqs: { id: string; question: string; answer: string }[];
  customBusinessInstructions: string;
  lastUpdated: string;
}

export interface NotificationSettings {
  emailConfirmations: boolean;
  smsConfirmations: boolean;
  reminder24h: boolean;
  reminderSameDay: boolean;
  cancellationAlerts: boolean;
  rescheduleAlerts: boolean;
  callbackAlerts: boolean;
  urgentRequestAlerts: boolean;
  alertRecipientPhone: string;
  alertRecipientEmail: string;
}

export interface CalendarIntegrationState {
  provider: 'Internal Tunde Calendar' | 'Google Calendar' | 'Microsoft Outlook';
  connected: boolean;
  accountEmail?: string;
  syncStatus: 'Synced' | 'Syncing' | 'Error' | 'Not Connected';
  lastSyncAt?: string;
  errorMessage?: string;
}

export interface BillingSubscription {
  planId: 'starter' | 'growth' | 'multi_shop';
  planName: string;
  monthlyPrice: number;
  billingCycle: 'Monthly' | 'Annual';
  status: 'Prototype Trial' | 'Active (Placeholder)' | 'Past Due';
  minutesIncluded: number;
  minutesUsed: number;
  locationsIncluded: number;
  paymentMethodLast4: string;
  paymentBrand: string;
  nextBillingDate: string;
  invoices: {
    id: string;
    date: string;
    amount: number;
    status: 'Paid' | 'Pending';
    description: string;
  }[];
}

export interface AdminBusiness {
  id: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  plan: 'Starter' | 'Growth' | 'Multi-Shop';
  status: 'Active' | 'Suspended' | 'Onboarding';
  locationCount: number;
  activeAgents: number;
  monthlyCalls: number;
  monthlyMinutes: number;
  createdAt: string;
}

export interface PromptVersion {
  id: string;
  version: string;
  businessId: string;
  businessName: string;
  author: string;
  createdAt: string;
  status: 'Published' | 'Draft' | 'Archived';
  systemPrompt: string;
  customInstructions: string;
  requiredQuestions: string[];
  workflowSteps?: string[];
  fallbackResponse: string;
  changeNote: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  actorRole: 'Super Admin' | 'Shop Owner' | 'Service Manager';
  action: string;
  resource: string;
  businessName: string;
  timestamp: string;
  accessReason: string;
  changesSummary: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'info' | 'warning' | 'error';
}

export interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  accountEmail: string;
  businessName: string;
  shopType: string;
  locationName: string;
  address: string;
  phone: string;
  timezone: string;
  openTime: string;
  closeTime: string;
  selectedServices: ServiceCategory[];
  agentName: string;
  voiceId: string;
  greeting: string;
  answeringMode: AnsweringMode;
  transferPhone: string;
  slotDuration: number;
  bayCount: number;
  warrantyNote: string;
  phoneVerified: boolean;
  notificationsEnabled: boolean;
  testCallCompleted: boolean;
  isOperational: boolean;
}
