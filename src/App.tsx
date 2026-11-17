import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastContainer } from './components/ui/Feedback';
import { PublicLayout } from './components/layouts/PublicLayout';
import { OwnerLayout } from './components/layouts/OwnerLayout';
import { AdminLayout } from './components/layouts/AdminLayout';

// Public Website Pages (14 pages)
import { HomePage } from './pages/public/HomePage';
import { FeaturesPage, HowItWorksPage, PricingPage } from './pages/public/FeaturesHowItWorksPricingPages';
import { BookDemoPage, ContactPage, FaqPage, InteractiveDemoPage } from './pages/public/DemoAndBookingPages';
import {
  ForgotPasswordPage,
  LoginPage,
  PrivacyPage,
  ResetPasswordPage,
  SignupPage,
  TermsPage,
} from './pages/public/AuthAndLegalPages';

// Onboarding Wizard
import { OnboardingWizard } from './pages/onboarding/OnboardingWizard';

// Shop Owner Pages (17 nav sections + Call Detail)
import { OverviewPage } from './pages/owner/OverviewPage';
import { CallDetailPage, CallsPage } from './pages/owner/CallsPage';
import { AppointmentsPage } from './pages/owner/AppointmentsPage';
import { CustomersPage, VehiclesPage } from './pages/owner/CustomersVehiclesPages';
import { CallbacksPage } from './pages/owner/CallbacksPage';
import { AIReceptionistPage } from './pages/owner/AIReceptionistPage';
import { KnowledgeBasePage } from './pages/owner/KnowledgeBasePage';
import { PhoneConfigPage } from './pages/owner/PhoneConfigPage';
import { NotificationsPage } from './pages/owner/NotificationsPage';
import { AnalyticsPage, ReportsPage } from './pages/owner/AnalyticsReportsPages';
import { BillingPage, CalendarIntegrationPage, TeamPage } from './pages/owner/CalendarTeamBillingPages';
import { BusinessSettingsPage, HelpSupportPage } from './pages/owner/SettingsAndHelpPages';

// Internal Super Admin Pages (21 nav sections)
import { AdminBusinessesPage, AdminOverviewPage } from './pages/admin/AdminOverviewAndBusinesses';
import { AdminAIAgentsPage, AdminPromptsPage } from './pages/admin/AdminAgentsAndPrompts';
import {
  AdminAuditLogsPage,
  AdminPhoneCallsPage,
  AdminSystemHealthPage,
  AdminUtilityPage,
} from './pages/admin/AdminOpsAndHealth';
import { AdminRequirementsAndProposalPage } from './pages/admin/AdminRequirementsAndProposalPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* A. Public Marketing Website */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/book-demo" element={<BookDemoPage />} />
              <Route path="/demo" element={<InteractiveDemoPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
            </Route>

            {/* Onboarding Experience (17 Steps) */}
            <Route path="/onboarding" element={<OnboardingWizard />} />

            {/* B. Shop Owner / Customer Dashboard */}
            <Route path="/app" element={<OwnerLayout />}>
              <Route index element={<Navigate to="/app/overview" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="calls" element={<CallsPage />} />
              <Route path="calls/:callId" element={<CallDetailPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="vehicles" element={<VehiclesPage />} />
              <Route path="callbacks" element={<CallbacksPage />} />
              <Route path="ai-receptionist" element={<AIReceptionistPage />} />
              <Route path="knowledge-base" element={<KnowledgeBasePage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="phone-config" element={<PhoneConfigPage />} />
              <Route path="calendar-integration" element={<CalendarIntegrationPage />} />
              <Route path="team" element={<TeamPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="billing" element={<BillingPage />} />
              <Route path="settings" element={<BusinessSettingsPage />} />
              <Route path="help" element={<HelpSupportPage />} />
            </Route>

            {/* C. Internal Tunde AI Super Admin Dashboard */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/overview" replace />} />
              <Route path="overview" element={<AdminOverviewPage />} />
              <Route path="businesses" element={<AdminBusinessesPage />} />
              <Route path="users" element={<AdminUtilityPage title="Platform Users" description="Cross-tenant shop owners, service managers, advisors, and role access policies" />} />
              <Route path="locations" element={<AdminUtilityPage title="Tenant Locations" description="All automotive shop locations, bay counts, and active hours configurations" />} />
              <Route path="ai-agents" element={<AdminAIAgentsPage />} />
              <Route path="prompts" element={<AdminPromptsPage />} />
              <Route path="voices" element={<AdminUtilityPage title="Voice Configuration" description="Provider-supported voice catalogs, pronunciation dictionaries, and latency targets" />} />
              <Route path="phone-numbers" element={<AdminPhoneCallsPage />} />
              <Route path="call-monitoring" element={<AdminPhoneCallsPage />} />
              <Route path="appointments" element={<AdminUtilityPage title="Platform Appointments" description="Cross-tenant appointment verification logs and conflict prevention telemetry" />} />
              <Route path="callbacks" element={<AdminUtilityPage title="Platform Callbacks" description="Global callback SLA monitoring and urgent escalation tracking" />} />
              <Route path="subscriptions" element={<AdminUtilityPage title="Subscriptions" description="Tenant plan entitlements, trial expiration rules, and billing states" />} />
              <Route path="plans" element={<AdminUtilityPage title="Plans & Pricing" description="Manage Starter, Growth, and Multi-Shop plan limits and minute overage policies" />} />
              <Route path="usage-billing" element={<AdminUtilityPage title="Usage & Billing" description="Per-business AI voice minute metering and usage thresholds" />} />
              <Route path="integrations" element={<AdminUtilityPage title="Platform Integrations" description="Twilio telephony webhooks, Google Calendar, Outlook, and DMS connector governance" />} />
              <Route path="analytics" element={<AdminUtilityPage title="Platform Analytics" description="Aggregated platform call volume, conversion trends, and retention metrics" />} />
              <Route path="system-health" element={<AdminSystemHealthPage />} />
              <Route path="errors" element={<AdminSystemHealthPage />} />
              <Route path="support" element={<AdminUtilityPage title="Support Desk" description="Customer onboarding escalations and carrier forwarding troubleshooting queue" />} />
              <Route path="audit-logs" element={<AdminAuditLogsPage />} />
              <Route path="requirements-audit" element={<AdminRequirementsAndProposalPage />} />
              <Route path="settings" element={<AdminUtilityPage title="Admin Settings" description="Super admin RBAC policies, mandatory recording consent guardrails, and security defaults" />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
