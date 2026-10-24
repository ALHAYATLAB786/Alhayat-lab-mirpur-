import React, {useCallback, useEffect, useState} from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileCheck2,
  FlaskConical,
  KeyRound,
  Laptop,
  LayoutDashboard,
  Lock,
  LogOut,
  MessageCircle,
  Package,
  Plus,
  QrCode,
  Receipt,
  Search,
  Settings,
  ShieldAlert,
  Star,
  Trash2,
} from 'lucide-react';
import {AlHayatLogo} from './AlHayatLogo';
import {PWAInstallButton} from './PWAInstallControl';
import {WhatsAppIcon} from './WhatsAppIcon';
import type {
  BookingRecord,
  BookingStatus,
  DepartmentType,
  HealthPackage,
  LabSettings,
  LabTest,
  Language,
  PaymentStatus,
  ReportParameter,
  ReviewRecord,
} from '../types';
import {
  buildWhatsAppBookingUrl,
  downloadInvoicePdf,
  downloadLabReportPdf,
  generateQrDataUrl,
} from '../utils/pdfAndQr';

interface AdminPortalProps {
  onExitAdmin: () => void;
  onDataMutated: () => void;
  onOpenQrHub: () => void;
  lang: Language;
  onToggleLang: () => void;
}

type AdminTab =
  | 'overview'
  | 'bookings'
  | 'reports'
  | 'tests'
  | 'packages'
  | 'reviews'
  | 'settings';

const DEPARTMENTS: DepartmentType[] = [
  'Haematology',
  'Biochemistry',
  'Microbiology',
  'Immunology',
  'Histopathology',
  'Clinical Pathology',
  'Cytology',
  'Hormone',
  'Procedures & X-Ray',
];

const REPORT_TEMPLATES: Record<string, ReportParameter[]> = {
  CBC: [
    {parameter: 'Haemoglobin (Hb)', result: '', unit: 'g/dL', referenceRange: '13.0 – 17.0', flag: 'Normal'},
    {parameter: 'Total Leucocyte Count (TLC)', result: '', unit: '/cmm', referenceRange: '4,000 – 11,000', flag: 'Normal'},
    {parameter: 'RBC Count', result: '', unit: 'million/cmm', referenceRange: '4.5 – 5.9', flag: 'Normal'},
    {parameter: 'Hematocrit (PCV)', result: '', unit: '%', referenceRange: '40 – 52', flag: 'Normal'},
    {parameter: 'Platelet Count', result: '', unit: '/cmm', referenceRange: '150,000 – 450,000', flag: 'Normal'},
  ],
  LFT: [
    {parameter: 'Bilirubin Total', result: '', unit: 'mg/dL', referenceRange: '0.2 – 1.2', flag: 'Normal'},
    {parameter: 'ALT (SGPT)', result: '', unit: 'U/L', referenceRange: '10 – 45', flag: 'Normal'},
    {parameter: 'AST (SGOT)', result: '', unit: 'U/L', referenceRange: '10 – 40', flag: 'Normal'},
    {parameter: 'Alkaline Phosphatase (ALP)', result: '', unit: 'U/L', referenceRange: '44 – 147', flag: 'Normal'},
    {parameter: 'Serum Albumin', result: '', unit: 'g/dL', referenceRange: '3.5 – 5.2', flag: 'Normal'},
  ],
  RFT: [
    {parameter: 'Blood Urea', result: '', unit: 'mg/dL', referenceRange: '15 – 45', flag: 'Normal'},
    {parameter: 'Serum Creatinine', result: '', unit: 'mg/dL', referenceRange: '0.6 – 1.2', flag: 'Normal'},
    {parameter: 'Serum Uric Acid', result: '', unit: 'mg/dL', referenceRange: '3.5 – 7.2', flag: 'Normal'},
  ],
  Lipid: [
    {parameter: 'Total Cholesterol', result: '', unit: 'mg/dL', referenceRange: '< 200', flag: 'Normal'},
    {parameter: 'Triglycerides', result: '', unit: 'mg/dL', referenceRange: '< 150', flag: 'Normal'},
    {parameter: 'HDL Cholesterol', result: '', unit: 'mg/dL', referenceRange: '> 40', flag: 'Normal'},
    {parameter: 'LDL Cholesterol', result: '', unit: 'mg/dL', referenceRange: '< 130', flag: 'Normal'},
  ],
  Thyroid: [
    {parameter: 'Free T3', result: '', unit: 'pg/mL', referenceRange: '2.0 – 4.4', flag: 'Normal'},
    {parameter: 'Free T4', result: '', unit: 'ng/dL', referenceRange: '0.93 – 1.70', flag: 'Normal'},
    {parameter: 'TSH (Ultra-Sensitive)', result: '', unit: 'uIU/mL', referenceRange: '0.27 – 4.20', flag: 'Normal'},
  ],
};

const SESSION_STORAGE_KEY = 'ahl_admin_bearer';

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onExitAdmin,
  onDataMutated,
  onOpenQrHub,
  lang,
  onToggleLang,
}) => {
  const [token, setToken] = useState<string>(() => sessionStorage.getItem(SESSION_STORAGE_KEY) || '');
  const [authChecking, setAuthChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [siteQrDataUrl, setSiteQrDataUrl] = useState('');
  const [copiedSiteUrl, setCopiedSiteUrl] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    generateQrDataUrl(window.location.origin).then((url) => setSiteQrDataUrl(url));
  }, []);

  // Login inputs
  const [loginUser, setLoginUser] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Password Change inputs
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{type: 'ok' | 'err'; text: string} | null>(null);

  // Dashboard Data
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loadingData, setLoadingData] = useState(false);
  const [settings, setSettings] = useState<LabSettings | null>(null);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Sub-views state
  const [bookingFilter, setBookingFilter] = useState<string>('ALL');
  const [bookingSearch, setBookingSearch] = useState('');
  const [showWalkInCreator, setShowWalkInCreator] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInAge, setWalkInAge] = useState('');
  const [walkInGender, setWalkInGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [walkInDiscount, setWalkInDiscount] = useState('0');
  const [walkInTestQuery, setWalkInTestQuery] = useState('');
  const [walkInSelected, setWalkInSelected] = useState<Array<{id: string; type: 'test' | 'package'; name: string; price: number}>>([]);

  // Report Builder state
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [reportRows, setReportRows] = useState<ReportParameter[]>([]);
  const [reportRemarks, setReportRemarks] = useState('');
  const [reportVerifiedBy, setReportVerifiedBy] = useState('Toseef Gulistan (M.D — Al-Hayat Lab Mirpur)');

  // Test & Pricing Management state
  const [testSearch, setTestSearch] = useState('');
  const [testDeptFilter, setTestDeptFilter] = useState<string>('ALL');
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [bulkDept, setBulkDept] = useState<string>('ALL');
  const [bulkPercent, setBulkPercent] = useState<string>('0');
  const [showNewTestForm, setShowNewTestForm] = useState(false);
  const [newTestName, setNewTestName] = useState('');
  const [newTestDept, setNewTestDept] = useState<DepartmentType>('Biochemistry');
  const [newTestPrice, setNewTestPrice] = useState('600');
  const [newTestSample, setNewTestSample] = useState('Blood (Serum)');
  const [newTestTurnaround, setNewTestTurnaround] = useState('Same Day (4–6 Hrs)');

  // New Package state
  const [showNewPkgForm, setShowNewPkgForm] = useState(false);
  const [pkgName, setPkgName] = useState('');
  const [pkgOrigPrice, setPkgOrigPrice] = useState('4000');
  const [pkgPrice, setPkgPrice] = useState('2900');
  const [pkgTestsCsv, setPkgTestsCsv] = useState('');

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const apiFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers || {});
      headers.set('Content-Type', 'application/json');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return fetch(url, {...init, headers});
    },
    [token]
  );

  const loadAdminOverview = useCallback(async () => {
    setLoadingData(true);
    try {
      const resp = await apiFetch('/api/admin/overview');
      if (resp.status === 403) {
        setMustChangePassword(true);
        return;
      }
      if (!resp.ok) return;
      const data = await resp.json();
      setSettings(data.settings);
      setTests(data.tests);
      setPackages(data.packages);
      setBookings(data.bookings);
      setReviews(data.reviews);
      if (data.bookings.length > 0 && !selectedBookingId) {
        const first = data.bookings[0] as BookingRecord;
        setSelectedBookingId(first.id);
        setReportRows(
          first.reportResults.length > 0
            ? first.reportResults
            : [{parameter: '', result: '', unit: '', referenceRange: '', flag: 'Normal'}]
        );
        setReportRemarks(first.reportRemarks || '');
      }
    } finally {
      setLoadingData(false);
    }
  }, [apiFetch, selectedBookingId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const resp = await apiFetch('/api/admin/session');
        const data = await resp.json();
        if (!active) return;
        setAuthenticated(Boolean(data.authenticated));
        setMustChangePassword(Boolean(data.mustChangePassword));
        if (data.authenticated && !data.mustChangePassword) {
          loadAdminOverview();
        }
      } finally {
        if (active) setAuthChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [apiFetch, loadAdminOverview]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthBusy(true);
    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: loginUser, password: loginPassword}),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setAuthError(data.message || 'Invalid credentials.');
        return;
      }
      if (data.token) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, data.token);
        setToken(data.token);
      }
      setAuthenticated(true);
      setMustChangePassword(Boolean(data.mustChangePassword));
      if (data.mustChangePassword) {
        setCurrentPassword(loginPassword);
      }
      setLoginPassword('');
    } catch {
      setAuthError('Server connection error.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    await apiFetch('/api/admin/logout', {method: 'POST'});
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setToken('');
    setAuthenticated(false);
    setMustChangePassword(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);
    if (newPassword.length < 8) {
      setPwdMsg({type: 'err', text: 'New password must be at least 8 characters long.'});
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({type: 'err', text: 'New password and confirmation do not match.'});
      return;
    }

    setAuthBusy(true);
    try {
      const resp = await apiFetch('/api/admin/change-password', {
        method: 'POST',
        body: JSON.stringify({currentPassword, newPassword}),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setPwdMsg({type: 'err', text: data.message || 'Password update failed.'});
        return;
      }
      setMustChangePassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPwdMsg({type: 'ok', text: 'Password updated securely. Admin workspace unlocked.'});
      loadAdminOverview();
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSelectBookingForReport = (booking: BookingRecord) => {
    setSelectedBookingId(booking.id);
    setReportRows(
      booking.reportResults.length > 0
        ? booking.reportResults
        : [{parameter: '', result: '', unit: '', referenceRange: '', flag: 'Normal'}]
    );
    setReportRemarks(booking.reportRemarks || '');
    setReportVerifiedBy(booking.verifiedBy || 'Toseef Gulistan (M.D — Al-Hayat Lab Mirpur)');
    setActiveTab('reports');
  };

  const handleSaveBookingStatus = async (
    id: string,
    patch: {status?: BookingStatus; paymentStatus?: PaymentStatus}
  ) => {
    const resp = await apiFetch(`/api/admin/bookings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    if (resp.ok) {
      const {booking} = await resp.json();
      setBookings((prev) => prev.map((b) => (b.id === id ? booking : b)));
      onDataMutated();
      showNotice(`Updated ${id}`);
    }
  };

  const handleCreateWalkInInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim() || !walkInPhone.trim() || walkInSelected.length === 0) return;
    const resp = await apiFetch('/api/admin/bookings', {
      method: 'POST',
      body: JSON.stringify({
        patientName: walkInName,
        patientPhone: walkInPhone,
        patientAge: walkInAge,
        patientGender: walkInGender,
        collectionType: 'lab_visit',
        discount: Number(walkInDiscount) || 0,
        paymentStatus: 'Paid',
        status: 'Sample Collected',
        itemIds: walkInSelected.map((s) => ({id: s.id, type: s.type})),
      }),
    });
    if (resp.ok) {
      const {booking} = await resp.json();
      setBookings((prev) => [booking, ...prev]);
      setWalkInName('');
      setWalkInPhone('');
      setWalkInAge('');
      setWalkInDiscount('0');
      setWalkInSelected([]);
      setShowWalkInCreator(false);
      onDataMutated();
      showNotice(`Invoice ${booking.id} created`);
      if (settings) {
        downloadInvoicePdf(booking, settings);
      }
    }
  };

  const handleSaveReport = async (publish: boolean) => {
    if (!selectedBookingId) return;
    const cleanRows = reportRows.filter((r) => r.parameter.trim() !== '');
    const resp = await apiFetch(`/api/admin/bookings/${selectedBookingId}/report`, {
      method: 'PUT',
      body: JSON.stringify({
        reportResults: cleanRows,
        reportRemarks,
        verifiedBy: reportVerifiedBy,
        reportPublished: publish,
      }),
    });
    if (resp.ok) {
      const {booking} = await resp.json();
      setBookings((prev) => prev.map((b) => (b.id === booking.id ? booking : b)));
      onDataMutated();
      showNotice(
        publish
          ? `Report ${booking.id} verified & published to Patient Portal!`
          : `Draft saved for ${booking.id}`
      );
    }
  };

  const handleUpdateTestPrice = async (test: LabTest) => {
    const rawVal = priceDrafts[test.id];
    const nextPrice = rawVal !== undefined ? Number(rawVal) : test.price;
    const resp = await apiFetch(`/api/admin/tests/${test.id}`, {
      method: 'PATCH',
      body: JSON.stringify({price: nextPrice}),
    });
    if (resp.ok) {
      const {test: updated} = await resp.json();
      setTests((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      onDataMutated();
      showNotice(`Updated ${updated.name} to Rs. ${updated.price}`);
    }
  };

  const handleToggleTestFlag = async (test: LabTest, field: 'active' | 'popular') => {
    const resp = await apiFetch(`/api/admin/tests/${test.id}`, {
      method: 'PATCH',
      body: JSON.stringify({[field]: !test[field]}),
    });
    if (resp.ok) {
      const {test: updated} = await resp.json();
      setTests((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      onDataMutated();
    }
  };

  const handleAddNewTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestName.trim()) return;
    const resp = await apiFetch('/api/admin/tests', {
      method: 'POST',
      body: JSON.stringify({
        name: newTestName,
        department: newTestDept,
        price: Number(newTestPrice) || 500,
        sampleType: newTestSample,
        turnaround: newTestTurnaround,
      }),
    });
    if (resp.ok) {
      const {test: created} = await resp.json();
      setTests((prev) => [created, ...prev]);
      setNewTestName('');
      setShowNewTestForm(false);
      onDataMutated();
      showNotice(`Added test: ${created.name}`);
    }
  };

  const handleBulkPriceAdjust = async () => {
    const pct = Number(bulkPercent);
    if (!pct) return;
    const resp = await apiFetch('/api/admin/tests/bulk-price', {
      method: 'POST',
      body: JSON.stringify({department: bulkDept, percentChange: pct}),
    });
    if (resp.ok) {
      const data = await resp.json();
      setTests(data.tests);
      setPriceDrafts({});
      setBulkPercent('0');
      onDataMutated();
      showNotice(`Adjusted ${data.updatedCount} tests by ${pct}%`);
    }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgName.trim()) return;
    const resp = await apiFetch('/api/admin/packages', {
      method: 'POST',
      body: JSON.stringify({
        name: pkgName,
        originalPrice: Number(pkgOrigPrice) || 4000,
        packagePrice: Number(pkgPrice) || 2900,
        includedTests: pkgTestsCsv
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        homeCollectionFree: true,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      setPackages((prev) => [...prev, data.package]);
      setPkgName('');
      setPkgTestsCsv('');
      setShowNewPkgForm(false);
      onDataMutated();
      showNotice('Health package created');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    const resp = await apiFetch('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    if (resp.ok) {
      onDataMutated();
      showNotice('Lab profile & contact settings saved');
    }
  };

  // ==========================================================================
  // VIEW 1: LOADING
  // ==========================================================================
  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-sm text-slate-600">Verifying secure lab session...</p>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: SECURE STAFF LOGIN (Zero Credentials Exposed in Frontend)
  // ==========================================================================
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
          <div className="flex items-center justify-between pb-5 border-b border-slate-200">
            <AlHayatLogo size="sm" />
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Public Site</span>
            </button>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2 text-slate-900 font-semibold text-base">
              <Lock className="h-4 w-4 text-[#26318C]" />
              <h1>
                {lang === 'ur'
                  ? 'الحیات لیب — ایڈمن پورٹل لاگ اِن'
                  : 'Private Admin & Reception App Login'}
              </h1>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {lang === 'ur'
                ? 'صرف ایم ڈی توصیف گلستان اور مجاز لیب اسٹاف کے استعمال کے لیے۔'
                : 'Restricted to M.D Toseef Gulistan and authorized Al-Hayat Lab Mirpur staff.'}
            </p>
          </div>

          <form onSubmit={handleLogin} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Admin Username / Registered Phone
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin or 0342-0806062"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Administrator Password
              </label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Enter server password"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
              />
            </div>

            {authError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authBusy}
              className="w-full rounded-lg bg-[#26318C] px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-950 disabled:opacity-50 transition-colors cursor-pointer"
            >
              {authBusy ? 'Authenticating...' : 'Sign In to Lab Workspace'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Protected by salted scrypt &amp; rate limiting</span>
            <span>Owner Access Only</span>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 3: MANDATORY FIRST-LOGIN PASSWORD CHANGE GATE
  // ==========================================================================
  if (mustChangePassword) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md rounded-xl border border-amber-300 bg-white p-7 shadow-sm">
          <div className="flex items-start gap-3 pb-4 border-b border-slate-200">
            <ShieldAlert className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h1 className="text-base font-semibold text-slate-900">
                Mandatory First-Login Password Update
              </h1>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                For lab security, the temporary initial credential must be replaced immediately with a private password (minimum 8 characters) before accessing patient data or pricing controls.
              </p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Current Temporary Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                New Private Password (Min. 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a strong private password"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
              />
            </div>

            {pwdMsg && (
              <div
                className={`rounded-lg border px-3.5 py-2.5 text-xs font-medium ${
                  pwdMsg.type === 'ok'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-700'
                }`}
              >
                {pwdMsg.text}
              </div>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Sign Out
              </button>
              <button
                type="submit"
                disabled={authBusy}
                className="rounded-lg bg-[#26318C] px-5 py-2.5 text-xs font-medium text-white hover:bg-indigo-950 disabled:opacity-50 cursor-pointer"
              >
                {authBusy ? 'Saving...' : 'Update Password & Unlock Portal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 4: FULL SAAS ADMIN PORTAL & PRIVATE MOBILE/LAPTOP WORKSPACE
  // ==========================================================================
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilter !== 'ALL' && b.status !== bookingFilter) return false;
    if (!bookingSearch.trim()) return true;
    const q = bookingSearch.toLowerCase();
    return (
      b.id.toLowerCase().includes(q) ||
      b.patientName.toLowerCase().includes(q) ||
      b.patientPhone.toLowerCase().includes(q)
    );
  });

  const filteredTests = tests.filter((tItem) => {
    if (testDeptFilter !== 'ALL' && tItem.department !== testDeptFilter) return false;
    if (!testSearch.trim()) return true;
    const q = testSearch.toLowerCase();
    return tItem.name.toLowerCase().includes(q) || tItem.code.toLowerCase().includes(q);
  });

  const activeBookingForReport = bookings.find((b) => b.id === selectedBookingId) || null;
  const totalRevenue = bookings
    .filter((b) => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + b.totalAmount, 0);
  const pendingHomeCount = bookings.filter(
    (b) => b.collectionType === 'home_collection' && (b.status === 'Pending' || b.status === 'Confirmed')
  ).length;
  const readyReportsCount = bookings.filter((b) => b.reportPublished).length;

  const walkInMatches =
    walkInTestQuery.trim().length >= 2
      ? tests
          .filter(
            (tItem) =>
              tItem.name.toLowerCase().includes(walkInTestQuery.toLowerCase()) ||
              tItem.code.toLowerCase().includes(walkInTestQuery.toLowerCase())
          )
          .slice(0, 6)
      : [];

  const navItems: Array<{id: AdminTab; label: string; icon: React.ReactNode}> = [
    {id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" />},
    {id: 'bookings', label: 'Bookings & Invoices', icon: <Receipt className="h-4 w-4" />},
    {id: 'reports', label: 'Lab Reports', icon: <FileCheck2 className="h-4 w-4" />},
    {id: 'tests', label: 'Tests & Pricing', icon: <FlaskConical className="h-4 w-4" />},
    {id: 'packages', label: 'Packages', icon: <Package className="h-4 w-4" />},
    {id: 'reviews', label: 'Reviews', icon: <Star className="h-4 w-4" />},
    {id: 'settings', label: 'Settings & Security', icon: <Settings className="h-4 w-4" />},
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row" dir="ltr">
      {/* Sidebar Navigation (260px on Desktop, scrollable bar on Mobile) */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white flex flex-col justify-between">
        <div>
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <span className="font-display text-base font-bold tracking-tight text-[#26318C]">
              Al-Hayat Lab App
            </span>
            <button
              type="button"
              onClick={onExitAdmin}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              Public Site
            </button>
          </div>

          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible p-2 gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#26318C] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="hidden lg:flex flex-col gap-2 p-4 border-t border-slate-200 text-xs text-slate-500">
          <p className="font-medium text-slate-800">M.D Toseef Gulistan</p>
          <p>Opp. DHQ Hospital Mirpur</p>
          <div className="pt-2 flex items-center gap-2">
            <PWAInstallButton lang={lang} />
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Contextual SaaS Top Bar */}
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3.5">
          <div className="text-xs text-slate-500 truncate">
            <span>Workspace</span>
            <span className="mx-2">/</span>
            <span className="font-semibold text-slate-900 capitalize">{activeTab}</span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="lg:hidden">
              <PWAInstallButton lang={lang} />
            </div>
            <button
              type="button"
              onClick={onOpenQrHub}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap cursor-pointer"
            >
              <QrCode className="h-3.5 w-3.5 text-[#26318C]" />
              <span>QR &amp; URL Hub</span>
            </button>
            <button
              type="button"
              onClick={onToggleLang}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap cursor-pointer"
            >
              {lang === 'en' ? 'اردو' : 'EN'}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('bookings');
                setShowWalkInCreator(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#26318C] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-950 whitespace-nowrap cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Walk-In Invoice</span>
            </button>
          </div>
        </header>

        {toast && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-medium text-white shadow-lg">
            <Check className="h-4 w-4 text-emerald-400" />
            <span>{toast}</span>
          </div>
        )}

        <main className="p-6 space-y-6 max-w-7xl w-full">
          {loadingData && (
            <p className="text-xs text-slate-500">Syncing laboratory database...</p>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs text-slate-500">Total Patient Bookings</p>
                  <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-slate-900">
                    {bookings.length}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Online &amp; Walk-in combined</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs text-slate-500">Pending Home Collections</p>
                  <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-amber-600">
                    {pendingHomeCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Mirpur sectors dispatch queue</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs text-slate-500">Verified Reports Published</p>
                  <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-emerald-700">
                    {readyReportsCount}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Live on Patient QR Portal</p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs text-slate-500">Active Billed Volume (PKR)</p>
                  <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#26318C]">
                    Rs. {totalRevenue.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Catalog size: {tests.length} active tests
                  </p>
                </div>
              </div>

              {/* OWNER-ONLY PRIVATE APP INSTALL + PUBLIC WEBSITE QR & URL SHARE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left 5 Cols: Private Laptop / Phone App (Exclusive to Logged-In Admin) */}
                <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#26318C]">
                      <Laptop className="h-4 w-4 shrink-0" />
                      <span>Private Owner App (Laptop &amp; Phone Only)</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      Download Private Lab App on Your Device
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      App installation is completely hidden from the public website so patients only open your URL in Chrome to book tests. Only you (logged into Admin) can install this private web-based app onto your laptop or phone.
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-2.5">
                    <PWAInstallButton lang={lang} variant="primary" showInstalledState />
                  </div>
                </div>

                {/* Right 7 Cols: Official Website QR Code + Explicit URL Underneath */}
                <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 flex flex-col sm:flex-row items-center gap-5">
                  <div className="flex flex-col items-center text-center rounded-lg border border-slate-200 bg-slate-50 p-3.5 shrink-0 max-w-[210px]">
                    {siteQrDataUrl && (
                      <img
                        src={siteQrDataUrl}
                        alt="Public Patient Website QR Code"
                        referrerPolicy="no-referrer"
                        className="h-28 w-28 rounded-md border border-slate-200 bg-white p-1.5"
                      />
                    )}
                    <p className="mt-2 text-[10px] font-medium text-slate-500">
                      Website URL (Opens in Chrome)
                    </p>
                    <a
                      href={typeof window !== 'undefined' ? window.location.origin : '/'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 font-mono text-[10px] font-medium text-[#26318C] hover:underline break-all select-all"
                    >
                      <span>{typeof window !== 'undefined' ? window.location.origin : ''}</span>
                      <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                    </a>
                  </div>

                  <div className="flex-1 space-y-3 min-w-0">
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">
                        Public Patient Website Link &amp; QR Code
                      </p>
                      <h3 className="mt-0.5 text-base font-bold text-slate-900">
                        Forward Website URL to Patients on WhatsApp
                      </h3>
                      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                        Send this URL or print the QR code for patients. When patients click the link, it opens your public website in Chrome for test booking and report tracking (without showing any app download).
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (typeof window === 'undefined') return;
                          try {
                            await navigator.clipboard.writeText(window.location.origin);
                            setCopiedSiteUrl(true);
                            setTimeout(() => setCopiedSiteUrl(false), 2200);
                          } catch {
                            // Ignore clipboard block
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#26318C] px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-950 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {copiedSiteUrl ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>URL Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Website URL</span>
                          </>
                        )}
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          `${settings?.labName || 'Al-Hayat Lab Mirpur'} — Online Test Booking & Report Website:\n${
                            typeof window !== 'undefined' ? window.location.origin : ''
                          }`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-800 transition-colors whitespace-nowrap"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" />
                        <span>Forward on WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={onOpenQrHub}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <QrCode className="h-3.5 w-3.5 text-[#26318C]" />
                        <span>All QR Codes</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Bookings Quick Queue */}
              <div className="rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                  <h2 className="text-sm font-semibold text-slate-900">
                    Recent Patient Bookings &amp; Reception Queue
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab('bookings')}
                    className="text-xs font-medium text-[#26318C] hover:underline cursor-pointer"
                  >
                    View All Bookings →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                        <th className="py-2.5 px-4 font-medium">Booking ID</th>
                        <th className="py-2.5 px-4 font-medium">Patient</th>
                        <th className="py-2.5 px-4 font-medium">Mode</th>
                        <th className="py-2.5 px-4 font-medium">Status</th>
                        <th className="py-2.5 px-4 text-right font-medium">Total (PKR)</th>
                        <th className="py-2.5 px-4 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.slice(0, 8).map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-4 font-mono tabular-nums font-semibold text-[#26318C]">
                            {b.id}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-medium text-slate-900">{b.patientName}</span>
                            <span className="text-slate-500 font-mono tabular-nums">
                              {' '}
                              · {b.patientPhone}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">
                            {b.collectionType === 'home_collection' ? 'Home Sample' : 'Lab Visit'}
                          </td>
                          <td className="py-2.5 px-4 font-medium text-slate-800">{b.status}</td>
                          <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                            Rs. {b.totalAmount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-right space-x-2 whitespace-nowrap">
                            {settings && (
                              <button
                                type="button"
                                onClick={() => downloadInvoicePdf(b, settings)}
                                className="text-[#26318C] hover:underline font-medium cursor-pointer"
                              >
                                Invoice PDF
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSelectBookingForReport(b)}
                              className="text-emerald-700 hover:underline font-medium cursor-pointer"
                            >
                              Enter Report
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BOOKINGS & WALK-IN INVOICES */}
          {activeTab === 'bookings' && (
            <div className="space-y-5">
              {showWalkInCreator && (
                <form
                  onSubmit={handleCreateWalkInInvoice}
                  className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Reception Walk-In Patient Invoice &amp; QR Generator
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowWalkInCreator(false)}
                      className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      required
                      value={walkInName}
                      onChange={(e) => setWalkInName(e.target.value)}
                      placeholder="Patient Full Name *"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="tel"
                      required
                      value={walkInPhone}
                      onChange={(e) => setWalkInPhone(e.target.value)}
                      placeholder="Mobile Number *"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                    />
                    <input
                      type="text"
                      value={walkInAge}
                      onChange={(e) => setWalkInAge(e.target.value)}
                      placeholder="Age (e.g. 40)"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <select
                      value={walkInGender}
                      onChange={(e) =>
                        setWalkInGender(e.target.value as 'Male' | 'Female' | 'Other')
                      }
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={walkInTestQuery}
                      onChange={(e) => setWalkInTestQuery(e.target.value)}
                      placeholder="Search test to add to bill (e.g. CP, LFT, TSH, Glucose)..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    {walkInMatches.length > 0 && (
                      <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 divide-y divide-slate-200">
                        {walkInMatches.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between px-3 py-1.5 text-xs"
                          >
                            <span>
                              {m.name} ({m.code})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (!walkInSelected.some((x) => x.id === m.id)) {
                                  setWalkInSelected((prev) => [
                                    ...prev,
                                    {id: m.id, type: 'test', name: m.name, price: m.price},
                                  ]);
                                }
                                setWalkInTestQuery('');
                              }}
                              className="rounded bg-[#26318C] px-2 py-0.5 text-white cursor-pointer"
                            >
                              + Rs. {m.price}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {walkInSelected.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {walkInSelected.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1.5 border border-slate-200 rounded-md px-2.5 py-1 bg-slate-50"
                        >
                          <span>
                            {item.name} — Rs. {item.price}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setWalkInSelected((prev) => prev.filter((x) => x.id !== item.id))
                            }
                            className="text-red-600 cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-xs">
                      <label className="text-slate-600">Discount (PKR):</label>
                      <input
                        type="number"
                        min="0"
                        value={walkInDiscount}
                        onChange={(e) => setWalkInDiscount(e.target.value)}
                        className="w-24 rounded border border-slate-300 px-2 py-1 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg bg-[#26318C] px-4 py-2 text-xs font-medium text-white hover:bg-indigo-950 cursor-pointer"
                    >
                      Save Paid Invoice &amp; Download PDF
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    placeholder="Filter by Booking ID, Patient Name, or Phone..."
                    className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-200/70 p-1">
                  {['ALL', 'Pending', 'Sample Collected', 'Processing', 'Report Ready'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setBookingFilter(st)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap cursor-pointer ${
                        bookingFilter === st
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                      <th className="py-3 px-4 font-medium">ID / Date</th>
                      <th className="py-3 px-4 font-medium">Patient &amp; Contact</th>
                      <th className="py-3 px-4 font-medium">Tests</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Payment</th>
                      <th className="py-3 px-4 text-right font-medium">Net PKR</th>
                      <th className="py-3 px-4 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-mono tabular-nums font-semibold text-[#26318C]">
                            {b.id}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {b.preferredDate} · PIN {b.verificationPin}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{b.patientName}</div>
                          <div className="text-[11px] text-slate-500">
                            {b.patientPhone} ·{' '}
                            {b.collectionType === 'home_collection' ? 'Home' : 'Lab'}
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                          {b.items.map((i) => i.name).join(', ')}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={b.status}
                            onChange={(e) =>
                              handleSaveBookingStatus(b.id, {
                                status: e.target.value as BookingStatus,
                              })
                            }
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Sample Collected">Sample Collected</option>
                            <option value="Processing">Processing</option>
                            <option value="Report Ready">Report Ready</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={b.paymentStatus}
                            onChange={(e) =>
                              handleSaveBookingStatus(b.id, {
                                paymentStatus: e.target.value as PaymentStatus,
                              })
                            }
                            className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                          >
                            <option value="Unpaid">Unpaid</option>
                            <option value="Paid">Paid</option>
                            <option value="Partial">Partial</option>
                          </select>
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900">
                          Rs. {b.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          {settings && (
                            <>
                              {b.prescriptionImage && (
                                <a
                                  href={b.prescriptionImage}
                                  download={b.prescriptionFileName || `${b.id}-prescription.jpg`}
                                  className="text-amber-700 hover:underline font-medium"
                                  title="Download Uploaded Prescription / Invoice"
                                >
                                  Rx Slip
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => downloadInvoicePdf(b, settings)}
                                className="inline-flex items-center gap-1 text-[#26318C] hover:underline font-medium cursor-pointer"
                                title="Download PDF Invoice"
                              >
                                <Download className="h-3.5 w-3.5" />
                                <span>PDF</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSelectBookingForReport(b)}
                                className="text-emerald-700 hover:underline font-medium cursor-pointer"
                              >
                                Report
                              </button>
                              <a
                                href={buildWhatsAppBookingUrl(b, settings, 'en')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-emerald-600 hover:text-emerald-800"
                                title="Send WhatsApp Alert"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                              </a>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: LAB REPORT BUILDER & PUBLISHER */}
          {activeTab === 'reports' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Clinical Diagnostic Report Publisher
                    </h2>
                    <p className="text-xs text-slate-500">
                      Enter parameter values, reference ranges, and publish QR-verifiable PDF reports to the Patient Portal.
                    </p>
                  </div>

                  <select
                    value={selectedBookingId}
                    onChange={(e) => {
                      const found = bookings.find((b) => b.id === e.target.value);
                      if (found) handleSelectBookingForReport(found);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono"
                  >
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.id} — {b.patientName} ({b.status})
                      </option>
                    ))}
                  </select>
                </div>

                {activeBookingForReport && (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50 rounded-lg p-3.5 border border-slate-200">
                      <div>
                        <strong>Patient:</strong> {activeBookingForReport.patientName} (
                        {activeBookingForReport.patientAge} / {activeBookingForReport.patientGender}
                        ) · <strong>Ordered:</strong>{' '}
                        {activeBookingForReport.items.map((i) => i.name).join(', ')}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-slate-500">Quick Template:</span>
                        {Object.keys(REPORT_TEMPLATES).map((tplKey) => (
                          <button
                            key={tplKey}
                            type="button"
                            onClick={() =>
                              setReportRows((prev) => [
                                ...prev.filter((r) => r.parameter.trim() !== ''),
                                ...REPORT_TEMPLATES[tplKey],
                              ])
                            }
                            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs font-medium hover:bg-slate-100 cursor-pointer"
                          >
                            + {tplKey}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="py-2 pr-2 font-medium">Test Parameter</th>
                            <th className="py-2 pr-2 font-medium">Result Value</th>
                            <th className="py-2 pr-2 font-medium">Units</th>
                            <th className="py-2 pr-2 font-medium">Reference Interval</th>
                            <th className="py-2 pr-2 font-medium">Flag</th>
                            <th className="py-2"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reportRows.map((row, idx) => (
                            <tr key={idx}>
                              <td className="py-1.5 pr-2">
                                <input
                                  type="text"
                                  value={row.parameter}
                                  onChange={(e) => {
                                    const next = [...reportRows];
                                    next[idx] = {...next[idx], parameter: e.target.value};
                                    setReportRows(next);
                                  }}
                                  placeholder="e.g. Haemoglobin"
                                  className="w-full rounded border border-slate-300 px-2.5 py-1.5"
                                />
                              </td>
                              <td className="py-1.5 pr-2">
                                <input
                                  type="text"
                                  value={row.result}
                                  onChange={(e) => {
                                    const next = [...reportRows];
                                    next[idx] = {...next[idx], result: e.target.value};
                                    setReportRows(next);
                                  }}
                                  placeholder="14.2"
                                  className="w-28 rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                                />
                              </td>
                              <td className="py-1.5 pr-2">
                                <input
                                  type="text"
                                  value={row.unit}
                                  onChange={(e) => {
                                    const next = [...reportRows];
                                    next[idx] = {...next[idx], unit: e.target.value};
                                    setReportRows(next);
                                  }}
                                  placeholder="g/dL"
                                  className="w-24 rounded border border-slate-300 px-2.5 py-1.5"
                                />
                              </td>
                              <td className="py-1.5 pr-2">
                                <input
                                  type="text"
                                  value={row.referenceRange}
                                  onChange={(e) => {
                                    const next = [...reportRows];
                                    next[idx] = {...next[idx], referenceRange: e.target.value};
                                    setReportRows(next);
                                  }}
                                  placeholder="13.5 – 17.5"
                                  className="w-40 rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                                />
                              </td>
                              <td className="py-1.5 pr-2">
                                <select
                                  value={row.flag}
                                  onChange={(e) => {
                                    const next = [...reportRows];
                                    next[idx] = {
                                      ...next[idx],
                                      flag: e.target.value as ReportParameter['flag'],
                                    };
                                    setReportRows(next);
                                  }}
                                  className="rounded border border-slate-300 bg-white px-2 py-1.5"
                                >
                                  <option value="Normal">Normal</option>
                                  <option value="High">High</option>
                                  <option value="Low">Low</option>
                                  <option value="Positive">Positive</option>
                                  <option value="Negative">Negative</option>
                                </select>
                              </td>
                              <td className="py-1.5 text-right">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReportRows((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="text-slate-400 hover:text-red-600 cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setReportRows((prev) => [
                          ...prev,
                          {parameter: '', result: '', unit: '', referenceRange: '', flag: 'Normal'},
                        ])
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Parameter Row</span>
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Clinical / Pathologist Remarks
                        </label>
                        <input
                          type="text"
                          value={reportRemarks}
                          onChange={(e) => setReportRemarks(e.target.value)}
                          placeholder="All parameters correlated clinically."
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">
                          Verified By Signatory
                        </label>
                        <input
                          type="text"
                          value={reportVerifiedBy}
                          onChange={(e) => setReportVerifiedBy(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleSaveReport(false)}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Save Draft
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveReport(true)}
                        className="rounded-lg bg-emerald-700 px-5 py-2 text-xs font-medium text-white hover:bg-emerald-800 cursor-pointer"
                      >
                        Verify &amp; Publish Report Online
                      </button>
                      {settings && activeBookingForReport.reportResults.length > 0 && (
                        <button
                          type="button"
                          onClick={() => downloadLabReportPdf(activeBookingForReport, settings)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#26318C] px-4 py-2 text-xs font-medium text-white hover:bg-indigo-950 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download Report PDF</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: TEST CATALOG & PRICING MANAGEMENT (515+ TESTS) */}
          {activeTab === 'tests' && (
            <div className="space-y-5">
              {/* Bulk Pricing & Add Test Toolbar */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">
                      Test Directory &amp; Live PKR Pricing Management ({tests.length} Tests)
                    </h2>
                    <p className="text-xs text-slate-500">
                      Loaded from Al-Hayat Lab Mirpur official test list PDF. Edit individual rates or adjust department pricing in bulk.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewTestForm((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#26318C] px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-950 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New Test</span>
                  </button>
                </div>

                {showNewTestForm && (
                  <form
                    onSubmit={handleAddNewTest}
                    className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-3 border-t border-slate-200"
                  >
                    <input
                      type="text"
                      required
                      value={newTestName}
                      onChange={(e) => setNewTestName(e.target.value)}
                      placeholder="New Test Name *"
                      className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <select
                      value={newTestDept}
                      onChange={(e) => setNewTestDept(e.target.value as DepartmentType)}
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      required
                      value={newTestPrice}
                      onChange={(e) => setNewTestPrice(e.target.value)}
                      placeholder="Price PKR"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800 cursor-pointer"
                    >
                      Save Test
                    </button>
                    <input
                      type="text"
                      value={newTestSample}
                      onChange={(e) => setNewTestSample(e.target.value)}
                      placeholder="Sample Type"
                      className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      value={newTestTurnaround}
                      onChange={(e) => setNewTestTurnaround(e.target.value)}
                      placeholder="Turnaround (e.g. Same Day or 3–8 Days)"
                      className="sm:col-span-3 rounded-lg border border-slate-300 px-3 py-2 text-xs"
                    />
                  </form>
                )}

                {/* Bulk Price Adjuster */}
                <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs">
                  <span className="font-medium text-slate-700">Bulk Price Adjustment:</span>
                  <select
                    value={bulkDept}
                    onChange={(e) => setBulkDept(e.target.value)}
                    className="rounded border border-slate-300 bg-white px-2.5 py-1.5"
                  >
                    <option value="ALL">All Departments</option>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={bulkPercent}
                    onChange={(e) => setBulkPercent(e.target.value)}
                    placeholder="% e.g. 10 or -5"
                    className="w-24 rounded border border-slate-300 px-2.5 py-1.5 font-mono"
                  />
                  <span className="text-slate-500">%</span>
                  <button
                    type="button"
                    onClick={handleBulkPriceAdjust}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-100 cursor-pointer"
                  >
                    Apply % Adjustment
                  </button>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    placeholder="Search any of the 515+ tests to edit price or status..."
                    className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-xs"
                  />
                </div>
                <select
                  value={testDeptFilter}
                  onChange={(e) => setTestDeptFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="ALL">All Departments ({tests.length})</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* High-Density Catalog Table */}
              <div className="rounded-xl border border-slate-200 bg-white overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                      <th className="py-2.5 px-4 font-medium">Code</th>
                      <th className="py-2.5 px-4 font-medium">Investigation Name</th>
                      <th className="py-2.5 px-4 font-medium">Department</th>
                      <th className="py-2.5 px-4 font-medium">Turnaround</th>
                      <th className="py-2.5 px-4 font-medium">Price (PKR)</th>
                      <th className="py-2.5 px-4 font-medium">Visibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTests.slice(0, 120).map((tItem) => (
                      <tr key={tItem.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-4 font-mono tabular-nums text-slate-500">
                          {tItem.code}
                        </td>
                        <td className="py-2 px-4 font-medium text-slate-900">{tItem.name}</td>
                        <td className="py-2 px-4 text-slate-600">{tItem.department}</td>
                        <td className="py-2 px-4 text-slate-600">{tItem.turnaround}</td>
                        <td className="py-2 px-4">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={
                                priceDrafts[tItem.id] !== undefined
                                  ? priceDrafts[tItem.id]
                                  : String(tItem.price)
                              }
                              onChange={(e) =>
                                setPriceDrafts((prev) => ({
                                  ...prev,
                                  [tItem.id]: e.target.value,
                                }))
                              }
                              className="w-24 rounded border border-slate-300 px-2 py-1 font-mono tabular-nums"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateTestPrice(tItem)}
                              className="rounded bg-[#26318C] px-2.5 py-1 text-white hover:bg-indigo-950 cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td className="py-2 px-4 space-x-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleTestFlag(tItem, 'active')}
                            className={`font-medium cursor-pointer ${
                              tItem.active ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            {tItem.active ? 'Active' : 'Hidden'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleTestFlag(tItem, 'popular')}
                            className={`font-medium cursor-pointer ${
                              tItem.popular ? 'text-[#26318C]' : 'text-slate-400'
                            }`}
                          >
                            {tItem.popular ? 'Featured ★' : 'Standard'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredTests.length > 120 && (
                  <div className="px-4 py-3 text-xs text-slate-500 border-t border-slate-100">
                    Showing first 120 of {filteredTests.length} matching tests. Use the search box above to jump to any specific test instantly.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: HEALTH PACKAGES */}
          {activeTab === 'packages' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  Diagnostic Wellness &amp; Skin Care Packages
                </h2>
                <button
                  type="button"
                  onClick={() => setShowNewPkgForm((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#26318C] px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-950 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Package</span>
                </button>
              </div>

              {showNewPkgForm && (
                <form
                  onSubmit={handleCreatePackage}
                  className="rounded-xl border border-slate-200 bg-white p-5 grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <input
                    type="text"
                    required
                    value={pkgName}
                    onChange={(e) => setPkgName(e.target.value)}
                    placeholder="Package Name *"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                  <input
                    type="number"
                    required
                    value={pkgOrigPrice}
                    onChange={(e) => setPkgOrigPrice(e.target.value)}
                    placeholder="Regular Price PKR"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                  <input
                    type="number"
                    required
                    value={pkgPrice}
                    onChange={(e) => setPkgPrice(e.target.value)}
                    placeholder="Discounted Package PKR"
                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    value={pkgTestsCsv}
                    onChange={(e) => setPkgTestsCsv(e.target.value)}
                    placeholder="Included Tests (comma separated: CBC, LFT, RFT, TSH)"
                    className="sm:col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    Save Package
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-mono text-slate-400">{pkg.code}</p>
                        <h3 className="text-sm font-semibold text-slate-900">{pkg.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await apiFetch(`/api/admin/packages/${pkg.id}`, {method: 'DELETE'});
                          setPackages((prev) => prev.filter((p) => p.id !== pkg.id));
                          onDataMutated();
                        }}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">{pkg.includedTests.join(' · ')}</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 line-through font-mono tabular-nums">
                        Rs. {pkg.originalPrice.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          defaultValue={pkg.packagePrice}
                          onBlur={async (e) => {
                            const val = Number(e.target.value);
                            if (val > 0 && val !== pkg.packagePrice) {
                              const r = await apiFetch(`/api/admin/packages/${pkg.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({packagePrice: val}),
                              });
                              if (r.ok) {
                                const d = await r.json();
                                setPackages((prev) =>
                                  prev.map((x) => (x.id === pkg.id ? d.package : x))
                                );
                                onDataMutated();
                                showNotice('Package price updated');
                              }
                            }
                          }}
                          className="w-24 rounded border border-slate-300 px-2 py-1 font-mono font-semibold text-[#26318C]"
                        />
                        <span className="text-slate-400">PKR</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-200">
              <div className="px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">
                  Patient Reviews &amp; Testimonials Moderation
                </h2>
              </div>
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-900">
                      {rev.patientName} · <span className="font-normal text-slate-500">{rev.location}</span> ·{' '}
                      <span className="text-amber-600">{'★'.repeat(rev.rating)}</span>
                    </p>
                    <p className="text-slate-600">{rev.comment}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={async () => {
                        const r = await apiFetch(`/api/admin/reviews/${rev.id}`, {
                          method: 'PATCH',
                          body: JSON.stringify({approved: !rev.approved}),
                        });
                        if (r.ok) {
                          const d = await r.json();
                          setReviews((prev) => prev.map((x) => (x.id === rev.id ? d.review : x)));
                          onDataMutated();
                        }
                      }}
                      className={`font-medium cursor-pointer ${
                        rev.approved ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {rev.approved ? 'Published' : 'Hidden'}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await apiFetch(`/api/admin/reviews/${rev.id}`, {method: 'DELETE'});
                        setReviews((prev) => prev.filter((x) => x.id !== rev.id));
                        onDataMutated();
                      }}
                      className="text-red-600 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: SETTINGS & PASSWORD SECURITY */}
          {activeTab === 'settings' && settings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <form
                onSubmit={handleSaveSettings}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
              >
                <h2 className="text-sm font-semibold text-slate-900 pb-2 border-b border-slate-200">
                  Lab Contact, Timings &amp; Home Collection Settings
                </h2>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Managing Director
                  </label>
                  <input
                    type="text"
                    value={settings.managingDirector}
                    onChange={(e) =>
                      setSettings({...settings, managingDirector: e.target.value})
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Primary Phone
                    </label>
                    <input
                      type="text"
                      value={settings.primaryPhone}
                      onChange={(e) => setSettings({...settings, primaryPhone: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Secondary Phone
                    </label>
                    <input
                      type="text"
                      value={settings.secondaryPhone}
                      onChange={(e) => setSettings({...settings, secondaryPhone: e.target.value})}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    WhatsApp API Number (International Digits)
                  </label>
                  <input
                    type="text"
                    value={settings.whatsappNumber}
                    onChange={(e) => setSettings({...settings, whatsappNumber: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mirpur Lab Address
                  </label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({...settings, address: e.target.value})}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Home Collection Fee (PKR)
                    </label>
                    <input
                      type="number"
                      value={settings.homeCollectionFee}
                      onChange={(e) =>
                        setSettings({...settings, homeCollectionFee: Number(e.target.value)})
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Free Home Threshold (PKR)
                    </label>
                    <input
                      type="number"
                      value={settings.freeHomeCollectionThreshold}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          freeHomeCollectionThreshold: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#26318C] px-4 py-2 text-xs font-medium text-white hover:bg-indigo-950 cursor-pointer"
                >
                  Save Lab Settings
                </button>
              </form>

              <form
                onSubmit={handlePasswordChange}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <KeyRound className="h-4 w-4 text-[#26318C]" />
                  <h2 className="text-sm font-semibold text-slate-900">
                    Change Administrator Password
                  </h2>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    New Password (Min. 8 characters)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                {pwdMsg && (
                  <p
                    className={`text-xs font-medium ${
                      pwdMsg.type === 'ok' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {pwdMsg.text}
                  </p>
                )}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg border border-red-200 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    Sign Out Session
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#26318C] px-4 py-2 text-xs font-medium text-white hover:bg-indigo-950 cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
