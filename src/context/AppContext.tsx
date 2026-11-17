import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  OperationType,
  SUPER_ADMIN_EMAIL,
  auth,
  db,
  handleFirestoreError,
  signInWithGoogle,
  signOutUser,
  testFirestoreConnection,
} from '../firebase';
import {
  AIAgentConfig,
  AdminBusiness,
  Appointment,
  AuditLogEntry,
  BillingSubscription,
  BusinessLocation,
  CalendarIntegrationState,
  CallRecord,
  CallbackStatus,
  CallbackTask,
  CustomServiceCategoryConfig,
  Customer,
  KnowledgeBaseData,
  NotificationSettings,
  OnboardingState,
  PromptVersion,
  ServiceCategory,
  TeamMember,
  ThemeMode,
  ToastMessage,
  TranscriptLine,
  Vehicle,
} from '../types/tunde';
import {
  createEmptyOnboardingState,
  createStarterAgentConfig,
  createStarterBilling,
  createStarterCalendars,
  createStarterKnowledgeBase,
  createStarterLocation,
  createStarterNotifications,
} from '../data/mockData';

export interface ActiveBusinessProfile {
  id: string;
  ownerUid: string;
  name: string;
  ownerName: string;
  ownerEmail: string;
  plan: 'Starter' | 'Growth' | 'Multi-Shop';
  status: 'Active' | 'Suspended' | 'Onboarding';
  retentionDays: number;
  aroValue: number;
  onboardingCompleted: boolean;
}

interface AppContextValue {
  // Auth & Firebase Status
  authUser: User | null;
  authLoading: boolean;
  firestoreReady: boolean;
  firestoreError: string | null;
  isAdmin: boolean;
  businessId: string | null;
  businessProfile: ActiveBusinessProfile | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  aroValue: number;
  setAroValue: (val: number) => void;
  updateBusinessProfile: (patch: Partial<ActiveBusinessProfile>) => void;

  // Theme & Toasts
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Multi-location
  locations: BusinessLocation[];
  selectedLocationId: string;
  setSelectedLocationId: (id: string) => void;
  addLocation: (loc: BusinessLocation) => void;
  updateLocation: (loc: BusinessLocation) => void;

  // Shop Owner Real Data
  calls: CallRecord[];
  syncTwilioCalls: () => Promise<number>;
  deleteCallRecordData: (callId: string) => void;
  retentionDays: number;
  setRetentionDays: (days: number) => void;
  customCategories: CustomServiceCategoryConfig[];
  addCustomCategory: (cat: Omit<CustomServiceCategoryConfig, 'id'>) => void;
  removeCustomCategory: (id: string) => void;
  logSimulatedCallOutcome: (payload: {
    customerName: string;
    phoneNumber: string;
    email?: string;
    vehicleYear?: number;
    vehicleMake?: string;
    vehicleModel?: string;
    serviceCategory: ServiceCategory;
    date?: string;
    time?: string;
    outcome: 'Booked' | 'Callback Required';
    urgency?: 'Normal' | 'High' | 'Urgent';
    summary: string;
    transcript: TranscriptLine[];
    recordingUrl?: string;
  }) => void;
  appointments: Appointment[];
  addAppointment: (apt: Omit<Appointment, 'id'>) => { ok: boolean; error?: string; id?: string };
  updateAppointment: (apt: Appointment) => { ok: boolean; error?: string };
  customers: Customer[];
  addCustomer: (cust: Omit<Customer, 'id' | 'createdAt'>) => Customer;
  vehicles: Vehicle[];
  addVehicle: (veh: Omit<Vehicle, 'id'>) => Vehicle;
  callbacks: CallbackTask[];
  updateCallback: (cb: CallbackTask) => void;
  setCallbackStatus: (id: string, status: CallbackStatus) => void;
  team: TeamMember[];
  addTeamMember: (member: Omit<TeamMember, 'id'>) => void;
  updateTeamMember: (member: TeamMember) => void;
  agentConfigs: AIAgentConfig[];
  updateAgentConfig: (cfg: AIAgentConfig) => void;
  publishAgentConfig: (id: string) => void;
  knowledgeBase: KnowledgeBaseData;
  updateKnowledgeBase: (kb: KnowledgeBaseData) => void;
  notifications: NotificationSettings;
  updateNotifications: (ns: NotificationSettings) => void;
  calendars: CalendarIntegrationState[];
  updateCalendar: (cal: CalendarIntegrationState) => void;
  billing: BillingSubscription;
  updateBilling: (b: BillingSubscription) => void;

  // Onboarding
  onboarding: OnboardingState;
  setOnboarding: React.Dispatch<React.SetStateAction<OnboardingState>>;
  resetOnboarding: () => void;
  completeOnboardingToFirestore: (stateOverride?: OnboardingState) => Promise<void>;

  // Super Admin Data
  adminBusinesses: AdminBusiness[];
  updateAdminBusiness: (biz: AdminBusiness) => void;
  addAdminBusiness: (biz: Omit<AdminBusiness, 'id' | 'createdAt'>) => void;
  promptVersions: PromptVersion[];
  savePromptDraft: (version: Omit<PromptVersion, 'id' | 'createdAt'>) => void;
  publishPromptVersion: (id: string) => void;
  rollbackPromptVersion: (id: string) => void;
  auditLogs: AuditLogEntry[];
  recordAuditEvent: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = 'tunde_ai_theme_v1';

function sanitizeId(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120) || `id_${Date.now()}`;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function tsToDateStr(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString().slice(0, 10);
  if (typeof val === 'string') return val.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function tsToDateTimeStr(val: unknown): string {
  if (val instanceof Timestamp) {
    const d = val.toDate();
    return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 8)}`;
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = (mode: ThemeMode) => setThemeState(mode);
  const toggleTheme = () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);
  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Firebase Auth & Connectivity State
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [firestoreReady, setFirestoreReady] = useState(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessProfile, setBusinessProfile] = useState<ActiveBusinessProfile | null>(null);

  const isAdmin = useMemo(
    () => Boolean(authUser?.email && authUser.emailVerified && authUser.email.toLowerCase() === SUPER_ADMIN_EMAIL),
    [authUser]
  );

  // Real Firestore-backed Tenant State (starts clean empty — zero fake data)
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all');
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [callbacks, setCallbacks] = useState<CallbackTask[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [agentConfigs, setAgentConfigs] = useState<AIAgentConfig[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomServiceCategoryConfig[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBaseData>(() =>
    createStarterKnowledgeBase('loc_primary', 'My Automotive Shop', '')
  );
  const [notifications, setNotifications] = useState<NotificationSettings>(() => createStarterNotifications(''));
  const [calendars, setCalendars] = useState<CalendarIntegrationState[]>(() => createStarterCalendars());
  const [billing, setBilling] = useState<BillingSubscription>(() => createStarterBilling());
  const [onboarding, setOnboarding] = useState<OnboardingState>(() => createEmptyOnboardingState());
  const onboardingHydratedRef = React.useRef(false);

  // Super Admin State
  const [adminBusinesses, setAdminBusinesses] = useState<AdminBusiness[]>([]);
  const [promptVersions, setPromptVersions] = useState<PromptVersion[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const retentionDays = businessProfile?.retentionDays ?? 90;
  const aroValue = businessProfile?.aroValue ?? 420;

  // Test Firestore connection once on mount
  useEffect(() => {
    void (async () => {
      const probe = await testFirestoreConnection();
      setFirestoreReady(probe.ok);
      if (!probe.ok) {
        setFirestoreError(probe.error || 'Firestore connection failed.');
      }
    })();
  }, []);

  // Provision initial real account workspace in Firestore on first login
  const ensureWorkspaceProvisioned = useCallback(async (user: User): Promise<string> => {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    let resolvedBizId = `biz_${user.uid.slice(0, 12)}`;
    const displayName = user.displayName || user.email?.split('@')[0] || 'Shop Owner';
    const userEmail = user.email || 'owner@shop.com';

    if (userSnap.exists()) {
      const data = userSnap.data() as { businessId?: string };
      if (data.businessId) resolvedBizId = data.businessId;
    } else {
      await setDoc(userRef, {
        uid: user.uid,
        email: userEmail,
        displayName,
        businessId: resolvedBizId,
        role: 'owner',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const bizRef = doc(db, 'businesses', resolvedBizId);
    const bizSnap = await getDoc(bizRef);

    if (!bizSnap.exists()) {
      const starterLoc = createStarterLocation({
        id: 'loc_primary',
        businessId: resolvedBizId,
        name: `${displayName}'s Auto Shop`,
      });
      const starterAgent = createStarterAgentConfig(starterLoc.id, starterLoc.name);
      const starterKb = createStarterKnowledgeBase(starterLoc.id, starterLoc.name, userEmail);
      const starterNotif = createStarterNotifications(userEmail);
      const starterCals = createStarterCalendars();
      const starterBill = createStarterBilling();
      const starterTeam: TeamMember = {
        id: `team_${user.uid.slice(0, 8)}`,
        locationId: starterLoc.id,
        name: displayName,
        role: 'Owner',
        email: userEmail,
        phone: '',
        extension: '100',
        isTransferDestination: false,
        receivesCallbacks: true,
        availability: 'Available',
        permissions: ['Full Access', 'Billing', 'AI Config', 'Recordings'],
      };

      await setDoc(bizRef, {
        id: resolvedBizId,
        ownerUid: user.uid,
        name: starterLoc.name,
        ownerName: displayName,
        ownerEmail: userEmail,
        plan: 'Growth',
        status: 'Onboarding',
        retentionDays: 90,
        aroValue: 420,
        onboardingCompleted: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await Promise.all([
        setDoc(doc(db, 'businesses', resolvedBizId, 'locations', starterLoc.id), {
          ...starterLoc,
          ownerUid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'businesses', resolvedBizId, 'agents', starterAgent.id), {
          id: starterAgent.id,
          ownerUid: user.uid,
          payload: starterAgent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'businesses', resolvedBizId, 'knowledge', 'main'), {
          id: 'main',
          ownerUid: user.uid,
          payload: starterKb,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'businesses', resolvedBizId, 'team', starterTeam.id), {
          id: starterTeam.id,
          ownerUid: user.uid,
          payload: starterTeam,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'businesses', resolvedBizId, 'settings', 'notifications'), {
          id: 'notifications',
          ownerUid: user.uid,
          payload: starterNotif,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'businesses', resolvedBizId, 'settings', 'calendars'), {
          id: 'calendars',
          ownerUid: user.uid,
          payload: { items: starterCals },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'businesses', resolvedBizId, 'settings', 'billing'), {
          id: 'billing',
          ownerUid: user.uid,
          payload: starterBill,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, 'businesses', resolvedBizId, 'settings', 'onboarding'), {
          id: 'onboarding',
          ownerUid: user.uid,
          payload: createEmptyOnboardingState(userEmail, starterLoc.name),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
      ]);
    }

    return resolvedBizId;
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      if (!user) {
        setBusinessId(null);
        setBusinessProfile(null);
        setLocations([]);
        setCalls([]);
        setAppointments([]);
        setCustomers([]);
        setVehicles([]);
        setCallbacks([]);
        setTeam([]);
        setAgentConfigs([]);
        setCustomCategories([]);
        setAdminBusinesses([]);
        setAuditLogs([]);
        onboardingHydratedRef.current = false;
        setAuthLoading(false);
        return;
      }

      if (!user.emailVerified) {
        setFirestoreError('Google account email verification is required before writing tenant records.');
        setAuthLoading(false);
        return;
      }

      try {
        const bizId = await ensureWorkspaceProvisioned(user);
        setBusinessId(bizId);
        setFirestoreError(null);
      } catch (err) {
        setFirestoreError(err instanceof Error ? err.message : 'Unable to initialize Firestore workspace.');
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, [ensureWorkspaceProvisioned]);

  // Real-time Firestore Listeners scoped strictly to businessId + ownerUid
  useEffect(() => {
    if (!authUser || !businessId) return;
    const uid = authUser.uid;
    const unsubs: (() => void)[] = [];

    // 1. Business Doc
    unsubs.push(
      onSnapshot(
        doc(db, 'businesses', businessId),
        (snap) => {
          if (snap.exists()) {
            const d = snap.data() as ActiveBusinessProfile;
            setBusinessProfile(d);
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `businesses/${businessId}`)
      )
    );

    // 2. Locations
    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses', businessId, 'locations'), where('ownerUid', '==', uid)),
        (snap) => {
          const items = snap.docs.map((d) => {
            const data = d.data() as BusinessLocation & { ownerUid?: string };
            return {
              id: data.id,
              businessId: data.businessId,
              name: data.name,
              address: data.address,
              city: data.city,
              state: data.state,
              zip: data.zip,
              phone: data.phone,
              aiPhoneNumber: data.aiPhoneNumber,
              timezone: data.timezone,
              bayCount: data.bayCount,
              slotDurationMinutes: data.slotDurationMinutes,
              hours: data.hours || [],
              holidays: data.holidays || [],
              isActive: data.isActive,
            };
          });
          setLocations(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/locations`)
      )
    );

    // 3. Customers
    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses', businessId, 'customers'), where('ownerUid', '==', uid)),
        (snap) => {
          const items = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              id: String(data.id),
              locationId: String(data.locationId),
              name: String(data.name),
              phone: String(data.phone),
              email: String(data.email || ''),
              status: (data.status as Customer['status']) || 'New',
              preferredContact: (data.preferredContact as Customer['preferredContact']) || 'Phone',
              createdAt: tsToDateStr(data.createdAt),
              notes: String(data.notes || ''),
            };
          });
          setCustomers(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/customers`)
      )
    );

    // 4. Vehicles
    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses', businessId, 'vehicles'), where('ownerUid', '==', uid)),
        (snap) => {
          const items = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              id: String(data.id),
              customerId: String(data.customerId),
              locationId: String(data.locationId),
              year: Number(data.year || 2020),
              make: String(data.make || ''),
              model: String(data.model || ''),
              trim: String(data.trim || ''),
              mileage: Number(data.mileage || 0),
              vin: String(data.vin || ''),
              licensePlate: data.licensePlate ? String(data.licensePlate) : undefined,
              serviceHistory: Array.isArray(data.serviceHistory) ? data.serviceHistory : [],
            };
          });
          setVehicles(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/vehicles`)
      )
    );

    // 5. Appointments
    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses', businessId, 'appointments'), where('ownerUid', '==', uid)),
        (snap) => {
          const items = snap.docs.map((d) => {
            const data = d.data() as Appointment;
            return {
              id: data.id,
              locationId: data.locationId,
              customerId: data.customerId,
              customerName: data.customerName,
              customerPhone: data.customerPhone,
              vehicleId: data.vehicleId,
              vehicleLabel: data.vehicleLabel,
              category: data.category,
              date: data.date,
              time: data.time,
              durationMinutes: data.durationMinutes,
              assignedEmployeeId: data.assignedEmployeeId,
              assignedEmployeeName: data.assignedEmployeeName,
              status: data.status,
              source: data.source,
              internalNotes: data.internalNotes || '',
              estimatedValue: data.estimatedValue,
            };
          });
          setAppointments(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/appointments`)
      )
    );

    // 6. Calls
    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses', businessId, 'calls'), where('ownerUid', '==', uid)),
        (snap) => {
          const items = snap.docs.map((d) => {
            const data = d.data() as CallRecord;
            return {
              id: data.id,
              locationId: data.locationId,
              callerName: data.callerName,
              phoneNumber: data.phoneNumber,
              customerId: data.customerId,
              vehicleId: data.vehicleId,
              vehicleSummary: data.vehicleSummary,
              date: data.date,
              time: data.time,
              durationSeconds: data.durationSeconds,
              status: data.status,
              aiReceptionistName: data.aiReceptionistName,
              outcome: data.outcome,
              callbackStatus: data.callbackStatus,
              recordingAvailable: Boolean(data.recordingAvailable),
              recordingSid: data.recordingSid,
              recordingUrl: data.recordingUrl,
              recordingConsent: data.recordingConsent,
              serviceRequest: data.serviceRequest,
              aiSummary: data.aiSummary,
              transcript: Array.isArray(data.transcript) ? data.transcript : [],
              appointmentId: data.appointmentId,
              callbackId: data.callbackId,
              recoveredMissedCall: Boolean(data.recoveredMissedCall),
            };
          });
          items.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
          setCalls(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/calls`)
      )
    );

    // 7. Callbacks
    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses', businessId, 'callbacks'), where('ownerUid', '==', uid)),
        (snap) => {
          const items = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              id: String(data.id),
              locationId: String(data.locationId),
              customerId: data.customerId ? String(data.customerId) : undefined,
              customerName: String(data.customerName),
              phone: String(data.phone),
              vehicleLabel: String(data.vehicleLabel || ''),
              reason: String(data.reason),
              aiCallSummary: String(data.aiCallSummary || ''),
              urgency: (data.urgency as CallbackTask['urgency']) || 'Normal',
              status: (data.status as CallbackTask['status']) || 'Pending',
              assignedEmployeeId: String(data.assignedEmployeeId || ''),
              assignedEmployeeName: String(data.assignedEmployeeName || 'Unassigned'),
              dueDate: String(data.dueDate || ''),
              createdAt: tsToDateTimeStr(data.createdAt),
              callId: data.callId ? String(data.callId) : undefined,
            };
          });
          setCallbacks(items);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/callbacks`)
      )
    );

    // 8. Agents
    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses', businessId, 'agents'), where('ownerUid', '==', uid)),
        (snap) => {
          setAgentConfigs(snap.docs.map((d) => (d.data() as { payload: AIAgentConfig }).payload));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/agents`)
      )
    );

    // 9. Knowledge Base
    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses', businessId, 'knowledge'), where('ownerUid', '==', uid)),
        (snap) => {
          const mainDoc = snap.docs.find((d) => d.id === 'main') || snap.docs[0];
          if (mainDoc) {
            setKnowledgeBase((mainDoc.data() as { payload: KnowledgeBaseData }).payload);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/knowledge`)
      )
    );

    // 10. Team
    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses', businessId, 'team'), where('ownerUid', '==', uid)),
        (snap) => {
          setTeam(snap.docs.map((d) => (d.data() as { payload: TeamMember }).payload));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/team`)
      )
    );

    // 11. Settings (notifications, calendars, billing, customCategories, onboarding)
    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses', businessId, 'settings'), where('ownerUid', '==', uid)),
        (snap) => {
          for (const d of snap.docs) {
            const payload = (d.data() as { payload: unknown }).payload;
            if (d.id === 'notifications' && payload) setNotifications(payload as NotificationSettings);
            if (d.id === 'calendars' && payload && (payload as { items?: CalendarIntegrationState[] }).items) {
              setCalendars((payload as { items: CalendarIntegrationState[] }).items);
            }
            if (d.id === 'billing' && payload) setBilling(payload as BillingSubscription);
            if (d.id === 'customCategories' && payload && (payload as { items?: CustomServiceCategoryConfig[] }).items) {
              setCustomCategories((payload as { items: CustomServiceCategoryConfig[] }).items);
            }
            if (d.id === 'onboarding' && payload && !onboardingHydratedRef.current) {
              onboardingHydratedRef.current = true;
              setOnboarding((prev) => {
                const remote = payload as OnboardingState;
                if (prev.completedSteps.length > remote.completedSteps.length && !remote.isOperational) {
                  return prev;
                }
                return remote;
              });
            }
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/settings`)
      )
    );

    // 12. Prompts (Admin read/write, owner read)
    unsubs.push(
      onSnapshot(
        query(collection(db, 'businesses', businessId, 'prompts'), where('ownerUid', '==', uid)),
        (snap) => {
          setPromptVersions(snap.docs.map((d) => (d.data() as { payload: PromptVersion }).payload));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, `businesses/${businessId}/prompts`)
      )
    );

    // 13. Audit Logs (Super Admin gets all, owner gets actorUid == uid)
    const auditQuery = isAdmin
      ? query(collection(db, 'auditLogs'))
      : query(collection(db, 'auditLogs'), where('actorUid', '==', uid));
    unsubs.push(
      onSnapshot(
        auditQuery,
        (snap) => {
          const logs = snap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              id: String(data.id),
              actor: String(data.actor),
              actorRole: (data.actorRole as AuditLogEntry['actorRole']) || 'Shop Owner',
              action: String(data.action),
              resource: String(data.resource),
              businessName: String(data.businessName || ''),
              timestamp: tsToDateTimeStr(data.createdAt),
              accessReason: String(data.accessReason || ''),
              changesSummary: String(data.changesSummary || ''),
            };
          });
          logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          setAuditLogs(logs);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'auditLogs')
      )
    );

    // 14. Super Admin Cross-Tenant Businesses List
    if (isAdmin) {
      unsubs.push(
        onSnapshot(
          collection(db, 'businesses'),
          (snap) => {
            const rows: AdminBusiness[] = snap.docs.map((d) => {
              const data = d.data() as Record<string, unknown>;
              return {
                id: String(data.id),
                name: String(data.name || ''),
                ownerName: String(data.ownerName || ''),
                ownerEmail: String(data.ownerEmail || ''),
                plan: (data.plan as AdminBusiness['plan']) || 'Growth',
                status: (data.status as AdminBusiness['status']) || 'Active',
                locationCount: Number(data.locationCount || 1),
                activeAgents: Number(data.activeAgents || 1),
                monthlyCalls: Number(data.monthlyCalls || 0),
                monthlyMinutes: Number(data.monthlyMinutes || 0),
                createdAt: tsToDateStr(data.createdAt),
              };
            });
            setAdminBusinesses(rows);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'businesses')
        )
      );
    }

    return () => {
      unsubs.forEach((fn) => fn());
    };
  }, [authUser, businessId, isAdmin]);

  // Keep server telephony runtime synced with real Firestore shop config & bay appointments
  useEffect(() => {
    if (!businessId || locations.length === 0) return;
    const primaryLoc = locations[0];
    const primaryAgent = agentConfigs.find((a) => a.locationId === primaryLoc.id) || agentConfigs[0];
    const transferMember = team.find((m) => m.isTransferDestination && m.phone);
    const activeRulePhone = primaryAgent?.transferRules?.find((r) => r.enabled && r.destinationPhone)?.destinationPhone;

    void fetch('/api/shop/sync-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId,
        shopName: businessProfile?.name || primaryLoc.name,
        agentName: primaryAgent?.name || 'Maya',
        greetingMessage: primaryAgent?.greetingMessage || '',
        customInstructions: primaryAgent?.customInstructions || knowledgeBase.customBusinessInstructions,
        transferPhone: activeRulePhone || transferMember?.phone || '',
        locations: locations.map((l) => ({
          id: l.id,
          name: l.name,
          address: l.address,
          phone: l.phone,
          aiPhoneNumber: l.aiPhoneNumber,
          timezone: l.timezone,
          bayCount: l.bayCount,
          slotDurationMinutes: l.slotDurationMinutes,
          holidays: l.holidays,
        })),
        appointments: appointments.map((a) => ({
          id: a.id,
          locationId: a.locationId,
          date: a.date,
          time: a.time,
          status: a.status,
        })),
        knowledgeBase: {
          hoursSummary: knowledgeBase.hoursSummary,
          supportedMakes: knowledgeBase.supportedMakes,
          diagnosticFees: knowledgeBase.diagnosticFees,
          warrantyInfo: knowledgeBase.warrantyInfo,
          towingPolicy: knowledgeBase.towingPolicy,
          customBusinessInstructions: knowledgeBase.customBusinessInstructions,
        },
      }),
    }).catch(() => {
      // ignore transient offline fetch
    });
  }, [businessId, businessProfile?.name, locations, appointments, agentConfigs, knowledgeBase, team]);

  // Auth Actions
  const signIn = async () => {
    await signInWithGoogle();
  };

  const signOut = async () => {
    await signOutUser();
    addToast({ title: 'Signed out', variant: 'info' });
  };

  // Audit Log Write
  const recordAuditEvent = useCallback(
    (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
      if (!authUser || !businessId) return;
      const logId = sanitizeId(`aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
      void setDoc(doc(db, 'auditLogs', logId), {
        id: logId,
        actorUid: authUser.uid,
        actor: entry.actor || authUser.email || 'User',
        actorRole: entry.actorRole,
        action: entry.action,
        resource: entry.resource,
        businessId,
        businessName: entry.businessName || businessProfile?.name || 'Shop',
        accessReason: entry.accessReason || 'Workspace action',
        changesSummary: entry.changesSummary || '',
        createdAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `auditLogs/${logId}`));
    },
    [authUser, businessId, businessProfile?.name]
  );

  // Business Profile / Retention / ARO
  const updateBusinessProfile = (patch: Partial<ActiveBusinessProfile>) => {
    if (!authUser || !businessId) return;
    void updateDoc(doc(db, 'businesses', businessId), {
      ...stripUndefined(patch as Record<string, unknown>),
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}`));
  };

  const setRetentionDays = (days: number) => {
    updateBusinessProfile({ retentionDays: days });
  };

  const setAroValue = (val: number) => {
    const clean = Math.max(0, Math.min(100000, Math.round(val)));
    updateBusinessProfile({ aroValue: clean });
  };

  // Locations
  const addLocation = (loc: BusinessLocation) => {
    if (!authUser || !businessId) return;
    const locId = sanitizeId(loc.id || `loc_${Date.now()}`);
    void setDoc(doc(db, 'businesses', businessId, 'locations', locId), {
      ...loc,
      id: locId,
      businessId,
      ownerUid: authUser.uid,
      bayCount: Math.max(1, Math.round(Number(loc.bayCount) || 4)),
      slotDurationMinutes: Math.max(15, Math.round(Number(loc.slotDurationMinutes) || 60)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `businesses/${businessId}/locations/${locId}`));
    addToast({ title: 'Location added', description: loc.name, variant: 'success' });
  };

  const updateLocation = (loc: BusinessLocation) => {
    if (!authUser || !businessId) return;
    void updateDoc(doc(db, 'businesses', businessId, 'locations', loc.id), {
      name: loc.name,
      address: loc.address,
      city: loc.city,
      state: loc.state,
      zip: loc.zip,
      phone: loc.phone,
      aiPhoneNumber: loc.aiPhoneNumber,
      timezone: loc.timezone,
      bayCount: Math.max(1, Math.round(Number(loc.bayCount) || 4)),
      slotDurationMinutes: Math.max(15, Math.round(Number(loc.slotDurationMinutes) || 60)),
      hours: loc.hours,
      holidays: loc.holidays,
      isActive: loc.isActive,
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/locations/${loc.id}`));
    addToast({ title: 'Location updated', description: loc.name, variant: 'success' });
  };

  // Conflict check for appointments
  const checkSlotConflict = (candidate: Omit<Appointment, 'id'>, excludeId?: string): string | null => {
    if (candidate.status === 'Cancelled') return null;
    const loc = locations.find((l) => l.id === candidate.locationId);
    const sameSlot = appointments.filter(
      (a) =>
        a.id !== excludeId &&
        a.locationId === candidate.locationId &&
        a.date === candidate.date &&
        a.time === candidate.time &&
        a.status !== 'Cancelled'
    );
    const duplicateCustomer = sameSlot.find((a) => a.customerId === candidate.customerId);
    if (duplicateCustomer) {
      return `${candidate.customerName} already has an appointment at ${candidate.time} on ${candidate.date}.`;
    }
    const maxBays = loc?.bayCount ?? 4;
    if (sameSlot.length >= maxBays) {
      return `All ${maxBays} service bays at this location are occupied at ${candidate.time}. Choose another time.`;
    }
    const holiday = loc?.holidays.find((h) => h.date === candidate.date);
    if (holiday) {
      return `Shop is closed on ${candidate.date} for ${holiday.label}.`;
    }
    return null;
  };

  const addAppointment = (apt: Omit<Appointment, 'id'>) => {
    const conflict = checkSlotConflict(apt);
    if (conflict) return { ok: false, error: conflict };
    const id = sanitizeId(`apt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`);
    const created: Appointment = { ...apt, id };
    if (authUser && businessId) {
      void setDoc(
        doc(db, 'businesses', businessId, 'appointments', id),
        stripUndefined({
          ...created,
          ownerUid: authUser.uid,
          durationMinutes: Math.max(15, Math.min(480, Math.round(created.durationMinutes || 60))),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `businesses/${businessId}/appointments/${id}`));
    } else {
      setAppointments((prev) => [created, ...prev]);
    }
    addToast({
      title: 'Appointment scheduled',
      description: `${created.customerName} · ${created.date} at ${created.time}`,
      variant: 'success',
    });
    return { ok: true, id };
  };

  const updateAppointment = (apt: Appointment) => {
    const conflict = checkSlotConflict(apt, apt.id);
    if (conflict) return { ok: false, error: conflict };
    if (authUser && businessId) {
      void updateDoc(
        doc(db, 'businesses', businessId, 'appointments', apt.id),
        stripUndefined({
          locationId: apt.locationId,
          customerId: apt.customerId,
          customerName: apt.customerName,
          customerPhone: apt.customerPhone,
          vehicleId: apt.vehicleId,
          vehicleLabel: apt.vehicleLabel,
          category: apt.category,
          date: apt.date,
          time: apt.time,
          durationMinutes: Math.max(15, Math.min(480, Math.round(apt.durationMinutes || 60))),
          assignedEmployeeId: apt.assignedEmployeeId,
          assignedEmployeeName: apt.assignedEmployeeName,
          status: apt.status,
          internalNotes: apt.internalNotes || '',
          estimatedValue: apt.estimatedValue,
          updatedAt: serverTimestamp(),
        })
      ).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/appointments/${apt.id}`));
    } else {
      setAppointments((prev) => prev.map((a) => (a.id === apt.id ? apt : a)));
    }
    addToast({ title: 'Appointment updated', description: `${apt.customerName} (${apt.status})`, variant: 'success' });
    return { ok: true };
  };

  const addCustomer = (cust: Omit<Customer, 'id' | 'createdAt'>): Customer => {
    const id = sanitizeId(`cust_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`);
    const created: Customer = { ...cust, id, createdAt: new Date().toISOString().slice(0, 10) };
    if (authUser && businessId) {
      void setDoc(doc(db, 'businesses', businessId, 'customers', id), {
        id,
        ownerUid: authUser.uid,
        locationId: cust.locationId,
        name: cust.name || 'Caller',
        phone: cust.phone || 'Unknown',
        email: cust.email || '',
        status: cust.status,
        preferredContact: cust.preferredContact,
        notes: cust.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `businesses/${businessId}/customers/${id}`));
    } else {
      setCustomers((prev) => [created, ...prev]);
    }
    return created;
  };

  const addVehicle = (veh: Omit<Vehicle, 'id'>): Vehicle => {
    const id = sanitizeId(`veh_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`);
    const created: Vehicle = { ...veh, id };
    if (authUser && businessId) {
      void setDoc(
        doc(db, 'businesses', businessId, 'vehicles', id),
        stripUndefined({
          id,
          ownerUid: authUser.uid,
          customerId: veh.customerId,
          locationId: veh.locationId,
          year: Math.max(1900, Math.min(2100, Math.round(Number(veh.year) || 2020))),
          make: veh.make || 'Vehicle',
          model: veh.model || 'Model',
          trim: veh.trim || '',
          mileage: Math.max(0, Math.round(Number(veh.mileage) || 0)),
          vin: veh.vin || '',
          licensePlate: veh.licensePlate,
          serviceHistory: veh.serviceHistory || [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `businesses/${businessId}/vehicles/${id}`));
    } else {
      setVehicles((prev) => [created, ...prev]);
    }
    return created;
  };

  const updateCallback = (cb: CallbackTask) => {
    if (authUser && businessId) {
      void updateDoc(doc(db, 'businesses', businessId, 'callbacks', cb.id), {
        status: cb.status,
        urgency: cb.urgency,
        assignedEmployeeId: cb.assignedEmployeeId,
        assignedEmployeeName: cb.assignedEmployeeName,
        dueDate: cb.dueDate,
        reason: cb.reason,
        aiCallSummary: cb.aiCallSummary,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/callbacks/${cb.id}`));
    } else {
      setCallbacks((prev) => prev.map((c) => (c.id === cb.id ? cb : c)));
    }
    addToast({ title: 'Callback updated', description: `${cb.customerName} · ${cb.status}`, variant: 'success' });
  };

  const setCallbackStatus = (id: string, status: CallbackStatus) => {
    if (authUser && businessId) {
      void updateDoc(doc(db, 'businesses', businessId, 'callbacks', id), {
        status,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/callbacks/${id}`));
    } else {
      setCallbacks((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
    }
    addToast({ title: `Callback marked ${status}`, variant: 'success' });
  };

  const addTeamMember = (member: Omit<TeamMember, 'id'>) => {
    if (!authUser || !businessId) return;
    const id = sanitizeId(`team_${Date.now()}`);
    const created: TeamMember = { ...member, id };
    void setDoc(doc(db, 'businesses', businessId, 'team', id), {
      id,
      ownerUid: authUser.uid,
      payload: created,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `businesses/${businessId}/team/${id}`));
    addToast({ title: 'Team member saved', description: created.name, variant: 'success' });
  };

  const updateTeamMember = (member: TeamMember) => {
    if (!authUser || !businessId) return;
    void updateDoc(doc(db, 'businesses', businessId, 'team', member.id), {
      payload: member,
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/team/${member.id}`));
    addToast({ title: 'Team member updated', description: member.name, variant: 'success' });
  };

  const updateAgentConfig = (cfg: AIAgentConfig) => {
    const nextCfg = { ...cfg, hasUnpublishedDraft: true };
    setAgentConfigs((prev) => prev.map((c) => (c.id === cfg.id ? nextCfg : c)));
    if (authUser && businessId) {
      void updateDoc(doc(db, 'businesses', businessId, 'agents', cfg.id), {
        payload: nextCfg,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/agents/${cfg.id}`));
    }
  };

  const publishAgentConfig = (id: string) => {
    const now = `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`;
    const target = agentConfigs.find((c) => c.id === id);
    if (!target) return;
    const published = { ...target, hasUnpublishedDraft: false, publishedAt: now };
    setAgentConfigs((prev) => prev.map((c) => (c.id === id ? published : c)));
    if (authUser && businessId) {
      void updateDoc(doc(db, 'businesses', businessId, 'agents', id), {
        payload: published,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/agents/${id}`));
    }
    addToast({ title: 'AI Receptionist changes published', description: 'Live Twilio & Web AI updated.', variant: 'success' });
  };

  const updateKnowledgeBase = (kb: KnowledgeBaseData) => {
    const updated: KnowledgeBaseData = {
      ...kb,
      lastUpdated: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
    };
    setKnowledgeBase(updated);
    if (authUser && businessId) {
      void updateDoc(doc(db, 'businesses', businessId, 'knowledge', 'main'), {
        payload: updated,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/knowledge/main`));
    }
    addToast({ title: 'Knowledge base saved', variant: 'success' });
  };

  const updateNotifications = (ns: NotificationSettings) => {
    setNotifications(ns);
    if (authUser && businessId) {
      void updateDoc(doc(db, 'businesses', businessId, 'settings', 'notifications'), {
        payload: ns,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/settings/notifications`));
    }
    addToast({ title: 'Notification preferences saved', variant: 'success' });
  };

  const updateCalendar = (cal: CalendarIntegrationState) => {
    const next = calendars.map((c) => (c.provider === cal.provider ? cal : c));
    setCalendars(next);
    if (authUser && businessId) {
      void setDoc(
        doc(db, 'businesses', businessId, 'settings', 'calendars'),
        {
          id: 'calendars',
          ownerUid: authUser.uid,
          payload: { items: next },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/settings/calendars`));
    }
  };

  const updateBilling = (b: BillingSubscription) => {
    setBilling(b);
    if (authUser && businessId) {
      void updateDoc(doc(db, 'businesses', businessId, 'settings', 'billing'), {
        payload: b,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/settings/billing`));
    }
  };

  const addCustomCategory = (cat: Omit<CustomServiceCategoryConfig, 'id'>) => {
    const created: CustomServiceCategoryConfig = { ...cat, id: `ccat_${Date.now()}` };
    const next = [...customCategories, created];
    setCustomCategories(next);
    if (authUser && businessId) {
      void setDoc(
        doc(db, 'businesses', businessId, 'settings', 'customCategories'),
        {
          id: 'customCategories',
          ownerUid: authUser.uid,
          payload: { items: next },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      ).catch((err) => handleFirestoreError(err, OperationType.WRITE, `businesses/${businessId}/settings/customCategories`));
    }
    addToast({ title: 'Custom category added', description: created.name, variant: 'success' });
  };

  const removeCustomCategory = (id: string) => {
    const next = customCategories.filter((c) => c.id !== id);
    setCustomCategories(next);
    if (authUser && businessId) {
      void updateDoc(doc(db, 'businesses', businessId, 'settings', 'customCategories'), {
        payload: { items: next },
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/settings/customCategories`));
    }
    addToast({ title: 'Custom category removed', variant: 'info' });
  };

  const deleteCallRecordData = (callId: string) => {
    const target = calls.find((c) => c.id === callId);
    const purgedTranscript = [{ speaker: 'AI' as const, timestamp: '00:00', text: '[Transcript purged per shop data retention request]' }];

    if (authUser && businessId) {
      void updateDoc(doc(db, 'businesses', businessId, 'calls', callId), {
        recordingAvailable: false,
        recordingUrl: '',
        recordingSid: '',
        recordingConsent: 'Recording Disabled',
        transcript: purgedTranscript,
        updatedAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/calls/${callId}`));
    }

    // Also purge from server Twilio runtime & Twilio API
    void fetch(`/api/twilio/calls/${encodeURIComponent(callId)}`, { method: 'DELETE' }).catch(() => {});

    recordAuditEvent({
      actor: authUser?.displayName || authUser?.email || 'Shop Owner',
      actorRole: 'Shop Owner',
      action: 'Deleted Call Recording & Transcript',
      resource: callId,
      businessName: businessProfile?.name || 'Shop',
      accessReason: 'Customer privacy / retention deletion request',
      changesSummary: `Purged audio & transcript for ${target?.callerName || callId}.`,
    });
    addToast({ title: 'Recording & transcript purged', description: 'Deletion logged in Audit Trail.', variant: 'warning' });
  };

  // Pull real recorded Twilio calls from Express runtime into Firestore
  const syncTwilioCalls = useCallback(async (): Promise<number> => {
    if (!authUser || !businessId) return 0;
    try {
      const res = await fetch('/api/twilio/calls');
      if (!res.ok) return 0;
      const data = (await res.json()) as {
        calls: {
          callSid: string;
          locationId: string;
          callerName: string;
          phoneNumber: string;
          vehicleSummary?: string;
          vehicleYear?: number;
          vehicleMake?: string;
          vehicleModel?: string;
          date: string;
          time: string;
          durationSeconds: number;
          status: CallRecord['status'];
          aiReceptionistName: string;
          outcome: CallRecord['outcome'];
          callbackStatus: CallRecord['callbackStatus'];
          recordingAvailable: boolean;
          recordingSid?: string;
          recordingUrl?: string;
          recordingConsent: CallRecord['recordingConsent'];
          serviceRequest: string;
          aiSummary: string;
          transcript: TranscriptLine[];
          bookedAppointment?: { date: string; time: string; category: string; estimatedValue: number };
          callbackUrgency?: 'Normal' | 'High' | 'Urgent';
          recoveredMissedCall: boolean;
          syncedToFirestore: boolean;
        }[];
      };

      const unsynced = (data.calls || []).filter((c) => !c.syncedToFirestore);
      if (unsynced.length === 0) return 0;

      const defaultLocId = locations[0]?.id || 'loc_primary';
      const defaultStaff = team[0] || { id: authUser.uid, name: authUser.displayName || 'Shop Owner' };
      let syncedCount = 0;

      for (const sc of unsynced) {
        const callId = sanitizeId(sc.callSid);
        const custId = sanitizeId(`cust_${callId}`);
        const vehId = sanitizeId(`veh_${callId}`);
        const locId = locations.some((l) => l.id === sc.locationId) ? sc.locationId : defaultLocId;

        await setDoc(doc(db, 'businesses', businessId, 'customers', custId), {
          id: custId,
          ownerUid: authUser.uid,
          locationId: locId,
          name: sc.callerName || 'Inbound Caller',
          phone: sc.phoneNumber || 'Unknown',
          email: '',
          status: 'New',
          preferredContact: 'Phone',
          notes: `Synced from live Twilio call ${sc.callSid}`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        await setDoc(doc(db, 'businesses', businessId, 'vehicles', vehId), {
          id: vehId,
          ownerUid: authUser.uid,
          customerId: custId,
          locationId: locId,
          year: Math.max(1900, Math.min(2100, Math.round(Number(sc.vehicleYear) || 2020))),
          make: sc.vehicleMake || 'Vehicle',
          model: sc.vehicleModel || 'Caller Vehicle',
          trim: '',
          mileage: 0,
          vin: '',
          serviceHistory: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        let aptId: string | undefined;
        let cbId: string | undefined;

        if (sc.outcome === 'Booked' && sc.bookedAppointment?.date && sc.bookedAppointment?.time) {
          aptId = sanitizeId(`apt_${callId}`);
          await setDoc(doc(db, 'businesses', businessId, 'appointments', aptId), {
            id: aptId,
            ownerUid: authUser.uid,
            locationId: locId,
            customerId: custId,
            customerName: sc.callerName || 'Inbound Caller',
            customerPhone: sc.phoneNumber || 'Unknown',
            vehicleId: vehId,
            vehicleLabel: sc.vehicleSummary || 'Caller Vehicle',
            category: sc.bookedAppointment.category || 'General Diagnostics',
            date: sc.bookedAppointment.date.slice(0, 10),
            time: sc.bookedAppointment.time.slice(0, 5),
            durationMinutes: 60,
            assignedEmployeeId: defaultStaff.id,
            assignedEmployeeName: defaultStaff.name,
            status: 'Confirmed',
            source: 'AI',
            internalNotes: `Booked via live Twilio voice call (${sc.callSid}).`,
            estimatedValue: sc.bookedAppointment.estimatedValue || 320,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        if (sc.outcome === 'Callback Required') {
          cbId = sanitizeId(`cb_${callId}`);
          await setDoc(doc(db, 'businesses', businessId, 'callbacks', cbId), {
            id: cbId,
            ownerUid: authUser.uid,
            locationId: locId,
            customerId: custId,
            customerName: sc.callerName || 'Inbound Caller',
            phone: sc.phoneNumber || 'Unknown',
            vehicleLabel: sc.vehicleSummary || 'Unconfirmed Vehicle',
            reason: sc.serviceRequest || 'Phone Call Follow-up',
            aiCallSummary: sc.aiSummary || 'Follow-up requested from Twilio phone call.',
            urgency: sc.callbackUrgency || 'High',
            status: 'Pending',
            assignedEmployeeId: defaultStaff.id,
            assignedEmployeeName: defaultStaff.name,
            dueDate: `${sc.date} 12:00`,
            callId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }

        await setDoc(
          doc(db, 'businesses', businessId, 'calls', callId),
          stripUndefined({
            id: callId,
            ownerUid: authUser.uid,
            locationId: locId,
            callerName: sc.callerName || 'Inbound Caller',
            phoneNumber: sc.phoneNumber || 'Unknown',
            customerId: custId,
            vehicleId: vehId,
            vehicleSummary: sc.vehicleSummary || '',
            date: sc.date.slice(0, 10),
            time: sc.time.slice(0, 5),
            durationSeconds: Math.max(0, Math.round(sc.durationSeconds || 0)),
            status: sc.status,
            aiReceptionistName: sc.aiReceptionistName,
            outcome: sc.outcome,
            callbackStatus: sc.callbackStatus,
            recordingAvailable: Boolean(sc.recordingAvailable),
            recordingSid: sc.recordingSid,
            recordingUrl: sc.recordingUrl,
            recordingConsent: sc.recordingConsent,
            serviceRequest: sc.serviceRequest || 'Phone Call',
            aiSummary: sc.aiSummary || 'Twilio voice call logged.',
            transcript: sc.transcript || [],
            appointmentId: aptId,
            callbackId: cbId,
            recoveredMissedCall: Boolean(sc.recoveredMissedCall),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })
        );

        await fetch(`/api/twilio/calls/${encodeURIComponent(sc.callSid)}/mark-synced`, { method: 'POST' });
        syncedCount += 1;
      }

      if (syncedCount > 0) {
        addToast({
          title: `Synced ${syncedCount} Twilio call${syncedCount > 1 ? 's' : ''}`,
          description: 'Recordings, transcripts, customers & appointments saved to Firestore.',
          variant: 'success',
        });
      }
      return syncedCount;
    } catch (err) {
      console.warn('[syncTwilioCalls] error:', err);
      return 0;
    }
  }, [authUser, businessId, locations, team, addToast]);

  // Automatically sync live Twilio calls once auth & locations are ready
  useEffect(() => {
    if (!authUser || !businessId || locations.length === 0) return;
    void syncTwilioCalls();
  }, [authUser, businessId, locations.length, syncTwilioCalls]);

  // Log Call Outcome (from InteractiveCallSimulator / Web Mic Session) directly to Firestore
  const logSimulatedCallOutcome: AppContextValue['logSimulatedCallOutcome'] = (payload) => {
    const locId = selectedLocationId === 'all' ? locations[0]?.id || 'loc_primary' : selectedLocationId;
    const cust = addCustomer({
      locationId: locId,
      name: payload.customerName,
      phone: payload.phoneNumber,
      email: payload.email || '',
      status: 'New',
      preferredContact: payload.email ? 'Email' : 'SMS',
      notes: `Captured during AI Receptionist session: ${payload.summary}`,
    });
    const veh = addVehicle({
      customerId: cust.id,
      locationId: locId,
      year: payload.vehicleYear || 2020,
      make: payload.vehicleMake || 'Vehicle',
      model: payload.vehicleModel || 'Model',
      trim: '',
      mileage: 0,
      vin: '',
      serviceHistory: [],
    });

    const callId = sanitizeId(`call_${Date.now()}`);
    const defaultStaff = team[0] || { id: authUser?.uid || 'owner', name: authUser?.displayName || 'Shop Owner' };
    let aptId: string | undefined;
    let cbId: string | undefined;

    if (payload.outcome === 'Booked' && payload.date && payload.time) {
      const res = addAppointment({
        locationId: locId,
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        vehicleId: veh.id,
        vehicleLabel: `${veh.year} ${veh.make} ${veh.model}`,
        category: payload.serviceCategory,
        date: payload.date,
        time: payload.time,
        durationMinutes: 60,
        assignedEmployeeId: defaultStaff.id,
        assignedEmployeeName: defaultStaff.name,
        status: 'Confirmed',
        source: 'AI',
        internalNotes: `Booked via AI Receptionist. ${payload.summary}`,
        estimatedValue: 320,
      });
      if (res.ok && res.id) aptId = res.id;
    }

    if (payload.outcome === 'Callback Required') {
      cbId = sanitizeId(`cb_${Date.now()}`);
      const cbData = {
        id: cbId,
        locationId: locId,
        customerId: cust.id,
        customerName: cust.name,
        phone: cust.phone,
        vehicleLabel: `${veh.year} ${veh.make} ${veh.model}`,
        reason: payload.summary,
        aiCallSummary: payload.summary,
        urgency: payload.urgency || 'High',
        status: 'Pending' as const,
        assignedEmployeeId: defaultStaff.id,
        assignedEmployeeName: defaultStaff.name,
        dueDate: `${new Date().toISOString().slice(0, 10)} 12:00`,
        callId,
      };
      if (authUser && businessId) {
        void setDoc(doc(db, 'businesses', businessId, 'callbacks', cbId), {
          ...cbData,
          ownerUid: authUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `businesses/${businessId}/callbacks/${cbId}`));
      } else {
        setCallbacks((prev) => [{ ...cbData, createdAt: new Date().toISOString().slice(0, 16) }, ...prev]);
      }
      addToast({ title: 'Callback task created', description: `${cust.name} (${payload.urgency || 'High'})`, variant: 'warning' });
    }

    const hasAudio = Boolean(payload.recordingUrl);
    const callDoc: CallRecord = {
      id: callId,
      locationId: locId,
      callerName: cust.name,
      phoneNumber: cust.phone,
      customerId: cust.id,
      vehicleId: veh.id,
      vehicleSummary: `${veh.year} ${veh.make} ${veh.model}`,
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      durationSeconds: Math.max(25, payload.transcript.length * 14),
      status: 'Answered',
      aiReceptionistName: `${agentConfigs[0]?.name || 'Maya'} (Tunde AI)`,
      outcome: payload.outcome,
      callbackStatus: payload.outcome === 'Callback Required' ? 'Pending' : 'None',
      recordingAvailable: hasAudio,
      recordingUrl: payload.recordingUrl,
      recordingConsent: 'Disclosed & Consented',
      serviceRequest: payload.serviceCategory,
      aiSummary: payload.summary,
      transcript: payload.transcript,
      appointmentId: aptId,
      callbackId: cbId,
      recoveredMissedCall: true,
    };

    if (authUser && businessId) {
      void setDoc(
        doc(db, 'businesses', businessId, 'calls', callId),
        stripUndefined({
          ...callDoc,
          ownerUid: authUser.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `businesses/${businessId}/calls/${callId}`));
    } else {
      setCalls((prev) => [callDoc, ...prev]);
    }
  };

  // Onboarding Sync to Firestore (uses updateDoc to preserve existing createdAt per firestore.rules)
  useEffect(() => {
    if (!authUser || !businessId) return;
    const timer = setTimeout(() => {
      const obRef = doc(db, 'businesses', businessId, 'settings', 'onboarding');
      void updateDoc(obRef, {
        payload: onboarding,
        updatedAt: serverTimestamp(),
      }).catch(async () => {
        try {
          const snap = await getDoc(obRef);
          if (!snap.exists()) {
            await setDoc(obRef, {
              id: 'onboarding',
              ownerUid: authUser.uid,
              payload: onboarding,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch {
          // silent background draft sync
        }
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [onboarding, authUser, businessId]);

  const resetOnboarding = () => {
    setOnboarding(createEmptyOnboardingState(authUser?.email || '', businessProfile?.name || ''));
  };

  const completeOnboardingToFirestore = async (stateOverride?: OnboardingState) => {
    const ob = stateOverride || onboarding;
    const activeUser = authUser || auth.currentUser;
    if (!activeUser) return;

    const persistWrites = async () => {
      const activeBizId = businessId || (await ensureWorkspaceProvisioned(activeUser));
      if (!businessId) setBusinessId(activeBizId);

      const safeBizName = (ob.businessName || businessProfile?.name || 'My Auto Shop').trim().slice(0, 160) || 'My Auto Shop';
      const primaryLoc = locations[0];
      const primaryLocId = primaryLoc?.id || 'loc_primary';
      const primaryAgent = agentConfigs[0];
      const primaryAgentId = primaryAgent?.id || `agent_${primaryLocId}`;

      await updateDoc(doc(db, 'businesses', activeBizId), {
        name: safeBizName,
        status: 'Active',
        onboardingCompleted: true,
        updatedAt: serverTimestamp(),
      });

      const secondaryWrites: Promise<unknown>[] = [
        updateDoc(doc(db, 'businesses', activeBizId, 'settings', 'onboarding'), {
          payload: ob,
          updatedAt: serverTimestamp(),
        }).catch(() => undefined),
        updateDoc(doc(db, 'businesses', activeBizId, 'locations', primaryLocId), {
          name: (ob.locationName || ob.businessName || primaryLoc?.name || 'Primary Service Location').trim().slice(0, 160),
          address: (ob.address || primaryLoc?.address || '').trim().slice(0, 240),
          phone: (ob.phone || primaryLoc?.phone || '').trim().slice(0, 40),
          timezone: ob.timezone || primaryLoc?.timezone || 'America/New_York',
          bayCount: Math.max(1, Math.round(Number(ob.bayCount) || primaryLoc?.bayCount || 4)),
          slotDurationMinutes: Math.max(15, Math.round(Number(ob.slotDuration) || primaryLoc?.slotDurationMinutes || 60)),
          updatedAt: serverTimestamp(),
        }),
      ];

      if (primaryAgent) {
        const publishedAgent: AIAgentConfig = {
          ...primaryAgent,
          name: ob.agentName || 'Maya',
          voiceId: ob.voiceId || primaryAgent.voiceId,
          greetingMessage: ob.greeting || primaryAgent.greetingMessage,
          answeringMode: ob.answeringMode,
          hasUnpublishedDraft: false,
          publishedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          schedulingRules: {
            ...primaryAgent.schedulingRules,
            supportedCategories: ob.selectedServices,
          },
        };
        setAgentConfigs((prev) => prev.map((c) => (c.id === primaryAgentId ? publishedAgent : c)));
        secondaryWrites.push(
          updateDoc(doc(db, 'businesses', activeBizId, 'agents', primaryAgentId), {
            payload: publishedAgent,
            updatedAt: serverTimestamp(),
          })
        );
      }

      const updatedKb: KnowledgeBaseData = {
        ...knowledgeBase,
        businessName: safeBizName,
        address: ob.address || knowledgeBase.address,
        phone: ob.phone || knowledgeBase.phone,
        warrantyInfo: ob.warrantyNote || knowledgeBase.warrantyInfo,
        lastUpdated: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
      };
      setKnowledgeBase(updatedKb);
      secondaryWrites.push(
        updateDoc(doc(db, 'businesses', activeBizId, 'knowledge', 'main'), {
          payload: updatedKb,
          updatedAt: serverTimestamp(),
        })
      );

      await Promise.allSettled(secondaryWrites);
    };

    // Bound Firestore server ACK wait so slow WebChannel never locks the Step 17 button spinner
    await Promise.race([
      persistWrites(),
      new Promise<void>((resolve) => setTimeout(resolve, 6000)),
    ]);
  };

  // Super Admin Operations
  const updateAdminBusiness = (biz: AdminBusiness) => {
    if (!authUser || !isAdmin) return;
    void updateDoc(doc(db, 'businesses', biz.id), {
      status: biz.status,
      plan: biz.plan,
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${biz.id}`));

    recordAuditEvent({
      actor: authUser.email || 'Super Admin',
      actorRole: 'Super Admin',
      action: `Updated Business Status (${biz.status})`,
      resource: biz.id,
      businessName: biz.name,
      accessReason: 'Account status governance action',
      changesSummary: `Status set to ${biz.status}, Plan ${biz.plan}.`,
    });
  };

  const addAdminBusiness = (biz: Omit<AdminBusiness, 'id' | 'createdAt'>) => {
    if (!authUser || !isAdmin) return;
    const id = sanitizeId(`biz_${Date.now()}`);
    void setDoc(doc(db, 'businesses', id), {
      id,
      ownerUid: authUser.uid,
      name: biz.name,
      ownerName: biz.ownerName,
      ownerEmail: biz.ownerEmail,
      plan: biz.plan,
      status: biz.status,
      retentionDays: 90,
      aroValue: 420,
      onboardingCompleted: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `businesses/${id}`));

    recordAuditEvent({
      actor: authUser.email || 'Super Admin',
      actorRole: 'Super Admin',
      action: 'Created Business Tenant',
      resource: id,
      businessName: biz.name,
      accessReason: 'Manual tenant provisioning',
      changesSummary: `Provisioned ${biz.plan} plan for ${biz.ownerEmail}.`,
    });
    addToast({ title: 'Business provisioned in Firestore', description: biz.name, variant: 'success' });
  };

  const savePromptDraft = (version: Omit<PromptVersion, 'id' | 'createdAt'>) => {
    if (!authUser || !isAdmin || !businessId) return;
    const id = sanitizeId(`pv_${Date.now()}`);
    const created: PromptVersion = {
      ...version,
      id,
      createdAt: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 5)}`,
    };
    void setDoc(doc(db, 'businesses', businessId, 'prompts', id), {
      id,
      ownerUid: authUser.uid,
      payload: created,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `businesses/${businessId}/prompts/${id}`));

    recordAuditEvent({
      actor: authUser.email || version.author,
      actorRole: 'Super Admin',
      action: `Saved Prompt Draft ${version.version}`,
      resource: id,
      businessName: version.businessName,
      accessReason: version.changeNote || 'Prompt configuration draft',
      changesSummary: 'Saved draft prompt & workflow rules.',
    });
    addToast({ title: `Draft ${version.version} saved`, variant: 'info' });
  };

  const publishPromptVersion = (id: string) => {
    if (!authUser || !isAdmin || !businessId) return;
    const target = promptVersions.find((p) => p.id === id);
    if (!target) return;
    for (const p of promptVersions) {
      if (p.businessId !== target.businessId) continue;
      if (p.id === id) {
        void updateDoc(doc(db, 'businesses', businessId, 'prompts', p.id), {
          payload: { ...p, status: 'Published' },
          updatedAt: serverTimestamp(),
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/prompts/${p.id}`));
      } else if (p.status === 'Published') {
        void updateDoc(doc(db, 'businesses', businessId, 'prompts', p.id), {
          payload: { ...p, status: 'Archived' },
          updatedAt: serverTimestamp(),
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `businesses/${businessId}/prompts/${p.id}`));
      }
    }
    recordAuditEvent({
      actor: authUser.email || 'Super Admin',
      actorRole: 'Super Admin',
      action: `Published Prompt ${target.version}`,
      resource: target.id,
      businessName: target.businessName,
      accessReason: target.changeNote || 'Production prompt release',
      changesSummary: `Activated ${target.version} as live prompt.`,
    });
    addToast({ title: `Prompt ${target.version} published`, variant: 'success' });
  };

  const rollbackPromptVersion = (id: string) => {
    publishPromptVersion(id);
    addToast({ title: 'Prompt rolled back', description: 'Selected version restored as Published.', variant: 'warning' });
  };

  return (
    <AppContext.Provider
      value={{
        authUser,
        authLoading,
        firestoreReady,
        firestoreError,
        isAdmin,
        businessId,
        businessProfile,
        signIn,
        signOut,
        aroValue,
        setAroValue,
        updateBusinessProfile,
        theme,
        toggleTheme,
        setTheme,
        toasts,
        addToast,
        dismissToast,
        locations,
        selectedLocationId,
        setSelectedLocationId,
        addLocation,
        updateLocation,
        calls,
        syncTwilioCalls,
        deleteCallRecordData,
        retentionDays,
        setRetentionDays,
        customCategories,
        addCustomCategory,
        removeCustomCategory,
        logSimulatedCallOutcome,
        appointments,
        addAppointment,
        updateAppointment,
        customers,
        addCustomer,
        vehicles,
        addVehicle,
        callbacks,
        updateCallback,
        setCallbackStatus,
        team,
        addTeamMember,
        updateTeamMember,
        agentConfigs,
        updateAgentConfig,
        publishAgentConfig,
        knowledgeBase,
        updateKnowledgeBase,
        notifications,
        updateNotifications,
        calendars,
        updateCalendar,
        billing,
        updateBilling,
        onboarding,
        setOnboarding,
        resetOnboarding,
        completeOnboardingToFirestore,
        adminBusinesses,
        updateAdminBusiness,
        addAdminBusiness,
        promptVersions,
        savePromptDraft,
        publishPromptVersion,
        rollbackPromptVersion,
        auditLogs,
        recordAuditEvent,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
