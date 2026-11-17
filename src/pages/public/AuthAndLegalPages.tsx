import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, LogOut, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormControls';
import { useApp } from '../../context/AppContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { authUser, authLoading, businessProfile, isAdmin, signIn, signOut, addToast } = useApp();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    setSigningIn(true);
    try {
      await signIn();
      addToast({
        title: 'Signed in with Google',
        description: 'Loaded your isolated Firestore automotive workspace.',
        variant: 'success',
      });
      navigate('/app/overview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google Sign-In was cancelled or failed.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white dark:bg-[#172337] rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Sign in to Tunde AI</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Secured with Firebase Authentication & Cloud Firestore tenant isolation.
          </p>
        </div>

        {authLoading ? (
          <p className="text-xs text-slate-500">Checking authentication session...</p>
        ) : authUser ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#16A36A]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Signed in as {authUser.displayName || authUser.email}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-mono">{authUser.email}</p>
              {businessProfile && <p className="text-slate-600 dark:text-slate-300">Shop: {businessProfile.name}</p>}
            </div>

            <div className="space-y-2">
              <Button className="w-full" onClick={() => navigate('/app/overview')}>
                Open Shop Owner Dashboard
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate('/onboarding')}>
                Open 17-Step Setup Wizard
              </Button>
              {isAdmin && (
                <Button variant="secondary" className="w-full" onClick={() => navigate('/admin/overview')}>
                  Open Super Admin Console
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full"
                iconLeft={<LogOut className="w-4 h-4" />}
                onClick={() => void signOut()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              type="button"
              className="w-full"
              size="lg"
              loading={signingIn}
              onClick={handleGoogleSignIn}
              iconLeft={<ShieldCheck className="w-4 h-4" />}
            >
              Continue with Google
            </Button>

            {error && (
              <p role="alert" className="text-xs text-[#DC4C4C]">
                {error}
              </p>
            )}

            <div className="p-3.5 rounded-lg bg-[#F5F7FB] dark:bg-[#101827] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-[#101827] dark:text-white">Real Tenant Persistence</p>
              <p>
                Signing in creates your private Firestore shop database so every call, recording, customer, vehicle, and appointment stays saved across sessions.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-2">
              <Link to="/signup" className="text-[#3978F6] hover:underline">New shop setup guide</Link>
              <Link to="/demo" className="text-slate-600 dark:text-slate-300 hover:underline">Try public AI demo</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { authUser, setOnboarding, signIn, addToast } = useApp();
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim()) {
      setErr('Enter your automotive shop name before continuing.');
      return;
    }
    setErr('');
    setLoading(true);
    try {
      if (!authUser) {
        await signIn();
      }
      setOnboarding((prev) => ({
        ...prev,
        businessName: businessName.trim(),
        currentStep: 2,
        completedSteps: [1],
      }));
      addToast({ title: 'Shop workspace ready', description: 'Continuing to 17-step setup wizard.', variant: 'success' });
      navigate('/onboarding');
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : 'Unable to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white dark:bg-[#172337] rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Create your shop account</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authenticate with Google to provision your dedicated Firestore workspace and begin the 17-step setup wizard.
          </p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <Input
            label="Automotive Shop Name"
            required
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="Riverfront Auto Service"
          />
          {err && <p className="text-xs text-[#DC4C4C]">{err}</p>}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            {authUser ? 'Continue to Shop Setup' : 'Sign In with Google & Start Setup'}
          </Button>
        </form>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          By continuing, you agree to our <Link to="/terms" className="text-[#3978F6] hover:underline">Terms</Link> and{' '}
          <Link to="/privacy" className="text-[#3978F6] hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white dark:bg-[#172337] rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5">
        <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Account Access Recovery</h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Tunde AI uses verified Google Authentication via Firebase Auth, so passwords and 2-step recovery are managed directly through your Google Account security settings.
        </p>
        <Link to="/login">
          <Button className="w-full">Return to Sign In</Button>
        </Link>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <div className="bg-white dark:bg-[#172337] rounded-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5">
        <h1 className="font-display text-2xl font-bold text-[#101827] dark:text-white">Google Account Authentication</h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Password management is handled by Google Identity Services. Use Sign in with Google to access your shop portal.
        </p>
        <Link to="/login">
          <Button className="w-full">Open Sign In Page</Button>
        </Link>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-6">
      <h1 className="font-display text-3xl font-bold text-[#101827] dark:text-white">Terms and Conditions</h1>
      <p className="text-xs text-slate-500">Version 1.0</p>
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#172337] p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <p><strong>1. Service Scope:</strong> Tunde AI provides automated call answering, vehicle intake, and scheduling assistance for automotive service facilities. Shop owners remain responsible for verifying shop policies, bay hours, and technician estimates.</p>
        <p><strong>2. Call Recording Compliance:</strong> Customers must maintain accurate jurisdiction settings (one-party or two-party consent notices). Platform recording consent safeguards cannot be bypassed via custom prompts.</p>
        <p><strong>3. Telephony & Availability:</strong> Conditional forwarding and dedicated telephone numbers depend on underlying carrier routing rules and verification.</p>
      </div>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-6">
      <h1 className="font-display text-3xl font-bold text-[#101827] dark:text-white">Privacy Policy</h1>
      <p className="text-xs text-slate-500">Version 1.0</p>
      <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-[#172337] p-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 dark:bg-[#101827] border border-slate-200 dark:border-slate-700">
          <ShieldAlert className="w-4 h-4 text-[#3978F6] mt-0.5 shrink-0" />
          <p className="text-xs">All call recordings and transcripts accessed by shop staff or Tunde AI platform administrators are logged with an explicit access reason in the Audit Log.</p>
        </div>
        <p><strong>1. Data Collected:</strong> Caller name, phone number, vehicle year/make/model/VIN (when supplied), call transcripts, and appointment records.</p>
        <p><strong>2. Tenant Isolation:</strong> Shop customer records and vehicles are strictly scoped to their respective business accounts via Firestore Security Rules (`ownerUid == request.auth.uid`).</p>
      </div>
    </div>
  );
}
