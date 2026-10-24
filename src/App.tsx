import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Check,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Lock,
  MapPin,
  Phone,
  Plus,
  QrCode,
  Search,
  ShoppingBag,
  Star,
} from 'lucide-react';
import {AdminPortal} from './components/AdminPortal';
import {AlHayatLogo} from './components/AlHayatLogo';
import {BookingModal, type SelectedCartEntry} from './components/BookingModal';
import {OfflineIndicator, isRunningStandalone} from './components/PWAInstallControl';
import {PatientPortalSection} from './components/PatientPortalSection';
import {QrCodeHubModal} from './components/QrCodeHubModal';
import {WhatsAppIcon} from './components/WhatsAppIcon';
import {DEPARTMENT_LABELS, t} from './i18n';
import {generateQrDataUrl} from './utils/pdfAndQr';
import type {
  BookingRecord,
  DepartmentType,
  HealthPackage,
  LabSettings,
  LabTest,
  Language,
  PublicBootstrapData,
  ReviewRecord,
} from './types';

const FALLBACK_SETTINGS: LabSettings = {
  labName: 'Al-Hayat Lab',
  labNameUr: 'الحیات لیب میرپور',
  subtitle: 'Skin Care Center & Laboratory',
  subtitleUr: 'سکن کیئر سینٹر اینڈ لیبارٹری',
  tagline: 'Your Health Deserves the Best',
  taglineUr: 'آپ کی صحت بہترین معیار کی مستحق ہے',
  managingDirector: 'M.D: Toseef Gulistan',
  managingDirectorUr: 'ایم ڈی: توصیف گلستان',
  primaryPhone: '0342-0806062',
  secondaryPhone: '0340-0893437',
  whatsappNumber: '923420806062',
  address: 'Near Bashir Drug House, Opp. DHQ Hospital, Mirpur',
  addressUr: 'نزد بشیر ڈرگ ہاؤس، بالمقابل ڈی ایچ کیو ہسپتال، میرپور',
  timings: '8:00 AM TO 12:00 AM (Mon - Sun)',
  timingsUr: 'صبح 8:00 بجے تا رات 12:00 بجے (پیر تا اتوار)',
  specialNoticeEn:
    'PCR, Blood Culture, Urine Culture, and Histopathology reports require 3–8 days processing time.',
  specialNoticeUr:
    'پی سی آر، بلڈ کلچر، یورین کلچر، ہسٹوپیتھو کی رپورٹ میں پراسیسنگ ٹائم 3-8 دن کا ہے۔',
  homeCollectionFee: 300,
  freeHomeCollectionThreshold: 2500,
};

const DEPARTMENT_ORDER: DepartmentType[] = [
  'Haematology',
  'Biochemistry',
  'Hormone',
  'Immunology',
  'Microbiology',
  'Clinical Pathology',
  'Histopathology',
  'Cytology',
  'Procedures & X-Ray',
];

const ResilientLabPhoto: React.FC<{
  src: string;
  alt: string;
  fallbackTitle: string;
  className?: string;
}> = ({src, alt, fallbackTitle, className = ''}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-[#1E297B] text-white p-6 text-center ${className}`}
      >
        <p className="font-display text-sm font-semibold">{fallbackTitle}</p>
        <p className="mt-1 text-xs text-slate-300">Al-Hayat Lab Mirpur</p>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [viewMode, setViewMode] = useState<'public' | 'admin'>(() => {
    if (
      typeof window !== 'undefined' &&
      (window.location.hash === '#admin' || isRunningStandalone())
    ) {
      return 'admin';
    }
    return 'public';
  });
  const [websiteQrUrl, setWebsiteQrUrl] = useState('');
  const [copiedWebsiteUrl, setCopiedWebsiteUrl] = useState(false);

  const [settings, setSettings] = useState<LabSettings>(FALLBACK_SETTINGS);
  const [tests, setTests] = useState<LabTest[]>([]);
  const [packages, setPackages] = useState<HealthPackage[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Test Directory Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDept, setActiveDept] = useState<'POPULAR' | 'ALL' | DepartmentType>('POPULAR');
  const [visibleLimit, setVisibleLimit] = useState(24);

  // Booking Cart & Modals
  const [cart, setCart] = useState<SelectedCartEntry[]>([]);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [defaultHomeMode, setDefaultHomeMode] = useState(false);
  const [qrHubOpen, setQrHubOpen] = useState(false);
  const [recentCreatedBooking, setRecentCreatedBooking] = useState<BookingRecord | null>(null);

  // Deep-link QR Verification (?verify=AHL-2026-1001)
  const [initialVerifyId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('verify');
  });

  // Review Form State
  const [revName, setRevName] = useState('');
  const [revLocation, setRevLocation] = useState('');
  const [revService, setRevService] = useState('');
  const [revBookingId, setRevBookingId] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revSubmitting, setRevSubmitting] = useState(false);
  const [revSuccess, setRevSuccess] = useState('');
  const [revError, setRevError] = useState('');

  const copy = t(lang);

  const fetchBootstrap = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const resp = await fetch('/api/bootstrap');
      if (!resp.ok) return;
      const data = (await resp.json()) as PublicBootstrapData;
      setSettings(data.settings);
      setTests(data.tests);
      setPackages(data.packages);
      setReviews(data.reviews);
    } catch {
      // Offline mode gracefully retains state
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    generateQrDataUrl(window.location.origin).then((url) => setWebsiteQrUrl(url));
  }, []);

  useEffect(() => {
    if (initialVerifyId) {
      setTimeout(() => {
        document.getElementById('patient-portal')?.scrollIntoView({behavior: 'smooth'});
      }, 300);
    }
  }, [initialVerifyId]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'ur' : 'en'));
  };

  const filteredTests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return tests.filter((item) => {
      if (q) {
        return (
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.department.toLowerCase().includes(q)
        );
      }
      if (activeDept === 'POPULAR') return item.popular;
      if (activeDept === 'ALL') return true;
      return item.department === activeDept;
    });
  }, [tests, searchQuery, activeDept]);

  const displayedTests = filteredTests.slice(0, visibleLimit);

  const toggleTestInCart = (test: LabTest) => {
    setCart((prev) => {
      if (prev.some((x) => x.id === test.id)) {
        return prev.filter((x) => x.id !== test.id);
      }
      return [
        ...prev,
        {
          id: test.id,
          type: 'test',
          code: test.code,
          name: test.name,
          price: test.price,
          turnaround: test.turnaround,
        },
      ];
    });
  };

  const togglePackageInCart = (pkg: HealthPackage) => {
    setCart((prev) => {
      if (prev.some((x) => x.id === pkg.id)) {
        return prev.filter((x) => x.id !== pkg.id);
      }
      return [
        ...prev,
        {
          id: pkg.id,
          type: 'package',
          code: pkg.code,
          name: pkg.name,
          price: pkg.packagePrice,
          turnaround: pkg.turnaround,
          freeHome: pkg.homeCollectionFree,
        },
      ];
    });
  };

  const handleOpenBookingModal = (preferHome = false) => {
    setDefaultHomeMode(preferHome);
    setBookingModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevError('');
    setRevSuccess('');
    if (!revName.trim() || !revComment.trim()) {
      setRevError(
        lang === 'ur'
          ? 'براہ کرم اپنا نام اور رائے درج کریں۔'
          : 'Please enter your full name and feedback.'
      );
      return;
    }

    setRevSubmitting(true);
    try {
      const resp = await fetch('/api/reviews', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          patientName: revName,
          location: revLocation || 'Mirpur AJK',
          serviceUsed: revService || 'Laboratory Diagnostics',
          rating: revRating,
          comment: revComment,
          bookingId: revBookingId,
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setRevError(data.message || 'Unable to submit feedback.');
      } else {
        setReviews((prev) => [data.review, ...prev]);
        setRevName('');
        setRevLocation('');
        setRevService('');
        setRevBookingId('');
        setRevComment('');
        setRevSuccess(
          lang === 'ur'
            ? 'آپ کی رائے کامیابی سے شامل کر دی گئی ہے۔ شکریہ!'
            : 'Thank you! Your feedback has been published.'
        );
      }
    } catch {
      setRevError('Network error while posting feedback.');
    } finally {
      setRevSubmitting(false);
    }
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price, 0);
  const cleanWa = settings.whatsappNumber.replace(/[^0-9]/g, '');
  const directWhatsAppUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
    lang === 'ur'
      ? 'السلام علیکم الحیات لیب میرپور! مجھے لیب ٹیسٹ اور مزید معلومات کے لیے رابطہ کرنا ہے۔'
      : 'Assalam-o-Alaikum Al-Hayat Lab Mirpur! I would like to inquire about further investigations / lab test booking.'
  )}`;

  // ==========================================================================
  // PRIVATE ADMIN / RECEPTION APP MODE
  // ==========================================================================
  if (viewMode === 'admin') {
    return (
      <>
        <OfflineIndicator lang={lang} />
        <AdminPortal
          onExitAdmin={() => {
            window.location.hash = '';
            setViewMode('public');
          }}
          onDataMutated={fetchBootstrap}
          onOpenQrHub={() => setQrHubOpen(true)}
          lang={lang}
          onToggleLang={toggleLanguage}
        />
        <QrCodeHubModal
          open={qrHubOpen}
          onClose={() => setQrHubOpen(false)}
          settings={settings}
          lang={lang}
        />
      </>
    );
  }

  // ==========================================================================
  // PUBLIC PATIENT WEBSITE & DIAGNOSTIC PORTAL
  // ==========================================================================
  return (
    <div id="top" dir={lang === 'ur' ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-50 text-slate-900">
      <OfflineIndicator lang={lang} />

      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="sticky top-0 z-40 h-14 border-b border-slate-200 bg-white/95 backdrop-blur-xs">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-[#26318C] whitespace-nowrap shrink-0"
          >
            {copy.brandWordmark}
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a
              href="#tests"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {copy.navTests}
            </a>
            <a
              href="#packages"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {copy.navPackages}
            </a>
            <a
              href="#patient-portal"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {copy.navPortal}
            </a>
            <a
              href="#facility"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {copy.navFacility}
            </a>
            <a
              href="#reviews"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {copy.navReviews}
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => handleOpenBookingModal(false)}
              className="rounded-lg bg-[#26318C] px-4 py-2 text-xs font-medium text-white hover:bg-indigo-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {copy.bookTestCta}
              {cart.length > 0 ? ` (${cart.length})` : ''}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* WORKSPACE UTILITY STRIP (Language Switcher, Logo Lockup, QR Hub, PWA Install, Admin App) */}
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <AlHayatLogo size="sm" />
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-600">
                <span>{lang === 'ur' ? settings.managingDirectorUr : settings.managingDirector}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{settings.primaryPhone}</span>
                <span aria-hidden="true">/</span>
                <span className="font-mono tabular-nums">{settings.secondaryPhone}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
              >
                <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-700" />
                <span>{copy.whatsappBookingHelp}</span>
              </a>

              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Globe className="h-3.5 w-3.5 text-[#26318C]" />
                <span>{copy.switchLangLabel}</span>
              </button>

              <button
                type="button"
                onClick={() => setQrHubOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5 text-[#26318C]" />
                <span>{copy.qrHubBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.location.hash = 'admin';
                  setViewMode('admin');
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5 text-slate-500" />
                <span>{copy.staffPortalBtn}</span>
              </button>
            </div>
          </div>
        </div>

        {/* HERO SECTION (2-Column Balanced Split + Full-Width Proof Strip Below) */}
        <section className="py-12 sm:py-16 lg:py-20 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              {/* Left 7 Cols: Value Proposition & Action */}
              <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <p className="text-xs sm:text-sm font-medium text-[#26318C]">{copy.heroKicker}</p>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-tight text-balance">
                    {copy.heroHeadline}
                  </h1>
                  <p
                    className={`text-base text-slate-600 leading-relaxed max-w-2xl ${
                      lang === 'ur' ? 'urdu-prose' : ''
                    }`}
                  >
                    {copy.heroBody}
                  </p>
                </div>

                {/* Primary Test Booking CTA + Prominent First-Desktop WhatsApp Contact */}
                <div className="space-y-3.5 pt-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenBookingModal(true)}
                      className="rounded-lg bg-[#26318C] px-6 py-3 text-sm font-medium text-white hover:bg-indigo-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copy.primaryBookHome}
                    </button>

                    <a
                      href={directWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      <WhatsAppIcon className="h-4 w-4" />
                      <span>{copy.whatsappBookingHelp}</span>
                    </a>

                    <a
                      href="#patient-portal"
                      className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                    >
                      {copy.secondaryTrackReport}
                    </a>
                  </div>

                  {/* Dedicated First-Desktop WhatsApp Further Investigation & Info Bar */}
                  <a
                    href={directWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 text-xs font-medium text-emerald-900 hover:bg-emerald-100/80 transition-colors"
                  >
                    <span className="inline-flex items-center gap-2">
                      <WhatsAppIcon className="h-4 w-4 text-emerald-700" />
                      <span>{copy.whatsappHeroInquiry}</span>
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-emerald-800 shrink-0">
                      {settings.primaryPhone} →
                    </span>
                  </a>

                  {/* Visiting Card Official Turnaround Advisory */}
                  <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
                    <strong className="text-slate-900">{copy.specialNoticeTitle}</strong>{' '}
                    <span>
                      {lang === 'ur' ? settings.specialNoticeUr : settings.specialNoticeEn}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Authentic Lab Working Area Photo */}
              <div className="lg:col-span-5">
                <div className="relative h-72 sm:h-80 lg:h-full min-h-[320px] overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                  <ResilientLabPhoto
                    src="/assets/aistudio/Lab_working_area_pic_d37d54aa.jfif"
                    alt="Al-Hayat Lab Mirpur Automated Diagnostic Working Area"
                    fallbackTitle="Al-Hayat Lab Automated Analyzer Suite"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-5 text-white">
                    <p className="text-xs font-medium text-slate-200">
                      {lang === 'ur' ? settings.addressUr : settings.address}
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {lang === 'ur'
                        ? 'جدید ہیماٹولوجی اور بائیو کیمسٹری اینالائزرز'
                        : 'Automated Hematology & Biochemistry Analyzer Suite'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Width 4-Column Quantitative Proof Bar Below Hero Split */}
            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 rounded-xl border border-slate-200 bg-white p-6">
              <div>
                <p className="font-mono text-2xl font-bold tabular-nums text-[#26318C]">
                  {tests.length > 0 ? `${tests.length}+` : '515+'}
                </p>
                <p className="mt-1 text-xs text-slate-600">{copy.statTestsLabel}</p>
              </div>
              <div className="border-slate-200 lg:border-s lg:ps-6">
                <p className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                  8 AM – 12 AM
                </p>
                <p className="mt-1 text-xs text-slate-600">{copy.statHoursLabel}</p>
              </div>
              <div className="border-slate-200 lg:border-s lg:ps-6">
                <p className="font-mono text-2xl font-bold tabular-nums text-slate-900">
                  4–6 Hrs
                </p>
                <p className="mt-1 text-xs text-slate-600">{copy.statTurnaroundLabel}</p>
              </div>
              <div className="border-slate-200 lg:border-s lg:ps-6">
                <p className="font-mono text-xl font-bold tabular-nums text-slate-900">
                  0342-0806062
                </p>
                <p className="mt-1 text-xs text-slate-600">{copy.statLocationLabel}</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 01: COMPLETE DIAGNOSTIC TEST DIRECTORY (515+ TESTS) */}
        <section id="tests" className="py-16 sm:py-20 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                  {copy.catalogTitle}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600">{copy.catalogSubtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenBookingModal(false)}
                  className="rounded-lg bg-[#26318C] px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copy.bookTestCta}
                  {cart.length > 0 ? ` (${cart.length})` : ''}
                </button>
                <a
                  href={directWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                  <span>{copy.whatsappBookingHelp}</span>
                </a>
                <span className="text-xs text-slate-500 tabular-nums">
                  {copy.showingCount} <strong>{displayedTests.length}</strong> {copy.ofTotal}{' '}
                  <strong>{filteredTests.length}</strong>
                </span>
              </div>
            </div>

            {/* Live Search Bar */}
            <div className="mt-6 relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleLimit(30);
                }}
                placeholder={copy.searchPlaceholder}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/70 pl-11 pr-4 py-3 text-sm text-slate-900 focus:border-[#26318C] focus:bg-white focus:outline-none"
              />
            </div>

            {/* Interactive Department Filter Tabs (Segmented Button Bar) */}
            <div className="mt-4 flex items-center gap-1.5 overflow-x-auto rounded-lg bg-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => {
                  setActiveDept('POPULAR');
                  setSearchQuery('');
                  setVisibleLimit(24);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeDept === 'POPULAR' && !searchQuery
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.popularFilter}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveDept('ALL');
                  setSearchQuery('');
                  setVisibleLimit(36);
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeDept === 'ALL' && !searchQuery
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.allDepartments} ({tests.length})
              </button>
              {DEPARTMENT_ORDER.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => {
                    setActiveDept(dept);
                    setSearchQuery('');
                    setVisibleLimit(36);
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeDept === dept && !searchQuery
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang === 'ur' ? DEPARTMENT_LABELS[dept].ur : DEPARTMENT_LABELS[dept].en}
                </button>
              ))}
            </div>

            {/* Test Rows — Clean Unboxed Metadata, Single-Elevation Border */}
            {loadingCatalog ? (
              <div className="mt-6 space-y-2">
                {Array.from({length: 6}).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-lg border border-slate-200 bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredTests.length === 0 ? (
              <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm font-medium text-slate-900">
                  No diagnostic test matched "{searchQuery}".
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setActiveDept('ALL');
                  }}
                  className="mt-3 rounded-lg bg-[#26318C] px-4 py-2 text-xs font-medium text-white cursor-pointer"
                >
                  Reset Search &amp; View All {tests.length} Tests
                </button>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white divide-y divide-slate-200/80">
                {displayedTests.map((test) => {
                  const isSelected = cart.some((c) => c.id === test.id);
                  return (
                    <div
                      key={test.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900">{test.name}</h3>
                        {/* Zero-Pill Metadata Discipline: quiet unboxed text with separators */}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono tabular-nums">{test.code}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {lang === 'ur'
                              ? DEPARTMENT_LABELS[test.department].ur
                              : test.department}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{test.sampleType}</span>
                          <span aria-hidden="true">·</span>
                          <span>{test.turnaround}</span>
                          <span aria-hidden="true">·</span>
                          <span className={test.fastingRequired ? 'text-amber-700 font-medium' : ''}>
                            {test.fastingRequired ? copy.fastingReq : copy.noFasting}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                        <span className="font-mono text-sm font-bold tabular-nums text-slate-900">
                          Rs. {test.price.toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleTestInCart(test)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                              : 'border border-slate-300 bg-white text-slate-800 hover:border-[#26318C] hover:text-[#26318C]'
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>{copy.addedBtn}</span>
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" />
                              <span>{copy.addBtn}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {visibleLimit < filteredTests.length && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 48)}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {copy.loadMoreTests} ({filteredTests.length - visibleLimit} remaining)
                </button>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 02: PREVENTIVE HEALTH & SKIN CARE PACKAGES */}
        <section id="packages" className="py-16 sm:py-20 border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                {copy.packagesTitle}
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
                {copy.packagesSubtitle}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const isSelected = cart.some((c) => c.id === pkg.id);
                const savings = Math.max(0, pkg.originalPrice - pkg.packagePrice);

                return (
                  <div
                    key={pkg.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6"
                  >
                    <div>
                      {/* Quiet 1-line text kicker instead of pill badges */}
                      <p className="text-xs text-slate-500">
                        {lang === 'ur' ? pkg.targetAudienceUr : pkg.targetAudience}
                      </p>
                      <h3 className="mt-1.5 text-lg font-bold text-slate-900">
                        {lang === 'ur' ? pkg.nameUr : pkg.name}
                      </h3>
                      <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                        {lang === 'ur' ? pkg.descriptionUr : pkg.description}
                      </p>

                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-semibold text-slate-800 mb-2">
                          Included Investigations ({pkg.includedTests.length}):
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {pkg.includedTests.join(' · ')}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="font-mono text-xl font-bold tabular-nums text-[#26318C]">
                            Rs. {pkg.packagePrice.toLocaleString()}
                          </span>
                          {pkg.originalPrice > pkg.packagePrice && (
                            <span className="ms-2 font-mono text-xs text-slate-400 line-through tabular-nums">
                              Rs. {pkg.originalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        {savings > 0 && (
                          <span className="text-xs font-medium text-emerald-700 tabular-nums">
                            {copy.saveAmount} {savings.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500">
                        <span>{pkg.turnaround}</span>
                        {pkg.homeCollectionFree && (
                          <>
                            <span aria-hidden="true"> · </span>
                            <span className="font-medium text-emerald-700">{copy.freeHomeTag}</span>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => togglePackageInCart(pkg)}
                        className={`w-full rounded-lg px-4 py-2.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                            : 'bg-[#26318C] text-white hover:bg-indigo-950'
                        }`}
                      >
                        {isSelected ? copy.packageSelectedBtn : copy.selectPackageBtn}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 03: PATIENT PORTAL & QR REPORT VERIFICATION */}
        <PatientPortalSection
          settings={settings}
          lang={lang}
          initialVerifyId={initialVerifyId}
          recentBooking={recentCreatedBooking}
        />

        {/* SECTION 04: INSIDE AL-HAYAT LAB MIRPUR (AUTHENTIC PHOTOS & VISITING CARD) */}
        <section id="facility" className="py-16 sm:py-20 border-t border-slate-200 bg-slate-50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                {copy.facilityTitle}
              </h2>
              <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
                {copy.facilitySubtitle}
              </p>
            </div>

            {/* Asymmetric Bento Grid with Real Lab Assets */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Working Area Showcase (7 cols) */}
              <div className="lg:col-span-7 overflow-hidden rounded-xl border border-slate-200 bg-white flex flex-col">
                <ResilientLabPhoto
                  src="/assets/aistudio/Lab_working_area_pic_d37d54aa.jfif"
                  alt="Al-Hayat Lab Mirpur Clinical Analyzer Working Bench"
                  fallbackTitle="Automated Diagnostic Working Area"
                  className="h-72 sm:h-80 w-full object-cover"
                />
                <div className="p-5">
                  <p className="text-xs text-slate-500">
                    Haematology · Biochemistry · Hormone · Immunology
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">
                    {lang === 'ur'
                      ? 'جدید کلینیکل لیبارٹری ورکنگ ایریا'
                      : 'Dedicated Diagnostic Working Area & Automated Analyzers'}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Equipped with calibrated multi-parameter hematology analyzers, precision micropipettes, binocular microscopy, and temperature-monitored reagent storage.
                  </p>
                </div>
              </div>

              {/* Reception Desk Photo (5 cols) */}
              <div className="lg:col-span-5 overflow-hidden rounded-xl border border-slate-200 bg-white flex flex-col">
                <ResilientLabPhoto
                  src="/assets/aistudio/reciption_desk_pic_06f46c1a.jfif"
                  alt="Al-Hayat Lab Mirpur Patient Reception and Sample Counter"
                  fallbackTitle="Patient Reception & Sample Collection Counter"
                  className="h-72 sm:h-80 w-full object-cover object-top"
                />
                <div className="p-5">
                  <p className="text-xs text-slate-500">
                    Barcoded Vacutainers · Walk-In &amp; Home Dispatch
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">
                    {lang === 'ur'
                      ? 'پیشنٹ ریسیپشن اور بارکوڈڈ سیمپل کاؤنٹر'
                      : 'Patient Reception & Barcoded Sample Counter'}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                    Barcode-tracked vacutainer labeling at reception ensures accurate specimen identification from collection to verified PDF report delivery.
                  </p>
                </div>
              </div>

              {/* Official Visiting Card & Location Details (Full 12 cols split) */}
              <div className="lg:col-span-12 rounded-xl border border-slate-200 bg-white p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-5">
                  <ResilientLabPhoto
                    src="/assets/aistudio/WhatsApp_Image_2026-09-07_at_7.06.11_AM_fe6b5f28.jpeg"
                    alt="Official Visiting Card of Al-Hayat Lab Skin Care Center and Laboratory Mirpur"
                    fallbackTitle="Official Al-Hayat Lab Mirpur Card"
                    className="w-full max-h-80 object-contain rounded-lg border border-slate-200 bg-slate-50"
                  />
                </div>
                <div className="lg:col-span-7 space-y-4">
                  <p className="text-xs font-medium text-[#26318C]">
                    Official Directory &amp; Contact Information
                  </p>
                  <h3 className="text-xl font-bold text-slate-900">
                    {settings.labName} — {settings.subtitle}
                  </h3>
                  <div className="space-y-2.5 text-sm text-slate-700">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 text-[#26318C] shrink-0 mt-1" />
                      <span>{lang === 'ur' ? settings.addressUr : settings.address}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Phone className="h-4 w-4 text-[#26318C] shrink-0 mt-1" />
                      <span className="font-mono tabular-nums">
                        {settings.managingDirector} — {settings.primaryPhone} /{' '}
                        {settings.secondaryPhone}
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Clock className="h-4 w-4 text-[#26318C] shrink-0 mt-1" />
                      <span>{lang === 'ur' ? settings.timingsUr : settings.timings}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleOpenBookingModal(true)}
                      className="rounded-lg bg-[#26318C] px-4 py-2.5 text-xs font-medium text-white hover:bg-indigo-950 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {copy.primaryBookHome}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrHubOpen(true)}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {lang === 'ur'
                        ? 'کیو آر کوڈ اور ویب سائٹ لنک کھولیں'
                        : 'Open QR Codes & Website URL'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Official Website QR Code + Explicit Shareable URL Below QR */}
              <div className="lg:col-span-12 rounded-xl border border-slate-200 bg-white p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <div className="lg:col-span-4 flex flex-col items-center text-center rounded-xl border border-slate-200 bg-slate-50 p-5">
                  {websiteQrUrl && (
                    <img
                      src={websiteQrUrl}
                      alt="Al-Hayat Lab Official Website QR Code"
                      referrerPolicy="no-referrer"
                      className="h-36 w-36 rounded-lg border border-slate-200 bg-white p-2"
                    />
                  )}
                  <p className="mt-2.5 text-[11px] font-medium text-slate-500">
                    {lang === 'ur'
                      ? 'آفیشل ویب سائٹ یو آر ایل (لنک)'
                      : 'Official Website URL'}
                  </p>
                  <a
                    href={typeof window !== 'undefined' ? window.location.origin : '/'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 font-mono text-xs font-medium text-[#26318C] hover:underline break-all select-all"
                  >
                    <span>{typeof window !== 'undefined' ? window.location.origin : ''}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>

                <div className="lg:col-span-8 space-y-3.5">
                  <p className="text-xs font-medium text-[#26318C]">
                    {lang === 'ur'
                      ? 'ویب سائٹ کیو آر کوڈ اور شیئرایبل لنک'
                      : 'Scan QR Code or Forward Official Website Link'}
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                    {lang === 'ur'
                      ? 'کیو آر کوڈ اسکین کریں یا ویب سائٹ کا لنک کسی کو بھی فارورڈ کریں'
                      : 'Share Al-Hayat Lab Website via Direct Link or QR Code'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {lang === 'ur'
                      ? 'یہ لنک یا کیو آر کوڈ جس کو بھی بھیجا جائے گا، کلک یا اسکین کرتے ہی سیدھا Chrome براؤزر میں الحیات لیب میرپور کی ویب سائٹ کھل جائے گی جہاں سے مریض آن لائن ٹیسٹ بک کر سکتے ہیں اور اپنی پی ڈی ایف رپورٹ چیک کر سکتے ہیں۔'
                      : 'Anyone scanning this QR code or clicking the forwarded URL opens the Al-Hayat Lab Mirpur website directly in Chrome to book tests, upload prescriptions, and verify PDF reports online.'}
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      onClick={async () => {
                        if (typeof window === 'undefined') return;
                        try {
                          await navigator.clipboard.writeText(window.location.origin);
                          setCopiedWebsiteUrl(true);
                          setTimeout(() => setCopiedWebsiteUrl(false), 2200);
                        } catch {
                          // Ignore clipboard restriction
                        }
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#26318C] px-4 py-2.5 text-xs font-medium text-white hover:bg-indigo-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copiedWebsiteUrl ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>{lang === 'ur' ? 'ویب سائٹ لنک کاپی ہو گیا!' : 'Website URL Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{lang === 'ur' ? 'ویب سائٹ لنک کاپی کریں' : 'Copy Website URL'}</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `${settings.labName} (${settings.subtitle}) — ${settings.address}\nOnline Test Booking & Report Website:\n${
                          typeof window !== 'undefined' ? window.location.origin : ''
                        }`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-medium text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      <span>
                        {lang === 'ur'
                          ? 'واٹس ایپ پر ویب سائٹ لنک فارورڈ کریں'
                          : 'Forward Website Link on WhatsApp'}
                      </span>
                    </a>

                    {websiteQrUrl && (
                      <a
                        href={websiteQrUrl}
                        download="AlHayatLab-Website-QR.png"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                      >
                        <Download className="h-3.5 w-3.5 text-[#26318C]" />
                        <span>{lang === 'ur' ? 'کیو آر کوڈ ڈاؤن لوڈ کریں' : 'Download QR PNG'}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 05: VERIFIED PATIENT REVIEWS & FEEDBACK FORM */}
        <section id="reviews" className="py-16 sm:py-20 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
                {copy.reviewsTitle}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-slate-600">{copy.reviewsSubtitle}</p>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Attributable Testimonials (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                {reviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-amber-500" aria-label={`${rev.rating} out of 5 stars`}>
                        {Array.from({length: rev.rating}).map((_, sIdx) => (
                          <Star key={sIdx} className="h-3.5 w-3.5 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">
                        {rev.verifiedPatient ? 'Verified Patient Record' : 'Patient Feedback'} ·{' '}
                        {rev.createdAt.slice(0, 10)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">"{rev.comment}"</p>
                    <div className="pt-1 text-xs text-slate-500">
                      <strong className="text-slate-900">{rev.patientName}</strong> · {rev.location}{' '}
                      · {rev.serviceUsed}
                    </div>
                  </article>
                ))}
              </div>

              {/* Validated Patient Feedback Form (5 cols) */}
              <form
                onSubmit={handleSubmitReview}
                className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-6 space-y-4"
              >
                <h3 className="text-base font-semibold text-slate-900">{copy.writeReviewTitle}</h3>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={revName}
                    onChange={(e) => setRevName(e.target.value)}
                    placeholder="e.g. Raja Kamran"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#26318C] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Area in Mirpur
                    </label>
                    <input
                      type="text"
                      value={revLocation}
                      onChange={(e) => setRevLocation(e.target.value)}
                      placeholder="Sector F-1, Mirpur"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#26318C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Booking ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={revBookingId}
                      onChange={(e) => setRevBookingId(e.target.value)}
                      placeholder="AHL-2026-..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-[#26318C] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Test / Package Taken
                    </label>
                    <input
                      type="text"
                      value={revService}
                      onChange={(e) => setRevService(e.target.value)}
                      placeholder="e.g. Home Collection / CBC"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#26318C] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Rating</label>
                    <select
                      value={revRating}
                      onChange={(e) => setRevRating(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#26318C] focus:outline-none"
                    >
                      <option value={5}>5 Stars — Excellent</option>
                      <option value={4}>4 Stars — Good</option>
                      <option value={3}>3 Stars — Satisfactory</option>
                      <option value={2}>2 Stars — Needs Improvement</option>
                      <option value={1}>1 Star — Poor</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Your Experience *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={revComment}
                    onChange={(e) => setRevComment(e.target.value)}
                    placeholder="Share your experience with sample collection, staff, or report turnaround..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#26318C] focus:outline-none"
                  />
                </div>

                {revError && <p className="text-xs font-medium text-red-600">{revError}</p>}
                {revSuccess && <p className="text-xs font-medium text-emerald-700">{revSuccess}</p>}

                <button
                  type="submit"
                  disabled={revSubmitting}
                  className="w-full rounded-lg bg-[#26318C] px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-950 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {revSubmitting ? 'Submitting...' : copy.submitReviewBtn}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* QUIET FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-900 text-slate-300 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-xs">
          <div className="space-y-2">
            <p className="font-display text-base font-bold text-white tracking-wide">
              AL-HAYAT LAB MIRPUR
            </p>
            <p className="text-slate-400">Skin Care Center &amp; Diagnostic Laboratory</p>
            <p className="text-slate-400">{settings.managingDirector}</p>
          </div>

          <div className="space-y-1.5">
            <p className="font-semibold text-white">Location &amp; Operating Hours</p>
            <p>{settings.address}</p>
            <p>{settings.timings}</p>
            <p className="font-mono tabular-nums text-slate-200">
              Tel / WhatsApp: {settings.primaryPhone} · {settings.secondaryPhone}
            </p>
          </div>

          <div className="space-y-2 md:text-right">
            <div className="flex flex-wrap md:justify-end gap-4 text-slate-300">
              <a href="#tests" className="hover:text-white">
                Tests
              </a>
              <a href="#packages" className="hover:text-white">
                Packages
              </a>
              <a href="#patient-portal" className="hover:text-white">
                Patient Portal
              </a>
              <button
                type="button"
                onClick={() => {
                  window.location.hash = 'admin';
                  setViewMode('admin');
                }}
                className="hover:text-white cursor-pointer"
              >
                Admin App
              </button>
            </div>
            <p className="text-slate-500">
              © {new Date().getFullYear()} Al-Hayat Lab Mirpur. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* FLOATING WHATSAPP CONTACT OR CHECKOUT BAR (Respects 15% Mobile Sticky Cap) */}
      {!bookingModalOpen && !qrHubOpen && (
        cart.length > 0 ? (
          <div className="fixed bottom-3 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-auto z-40 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-white shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <ShoppingBag className="h-4 w-4 text-indigo-300 shrink-0" />
              <span>
                <strong className="font-mono tabular-nums">{cart.length}</strong> {copy.cartBarItems}{' '}
                · <strong className="font-mono tabular-nums">Rs. {cartTotal.toLocaleString()}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={directWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 whitespace-nowrap"
                title={copy.whatsappBookingHelp}
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{copy.whatsappBookingHelp}</span>
              </a>
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs text-slate-300 hover:text-white px-1.5 py-1 cursor-pointer"
              >
                {copy.clearSelectionBtn}
              </button>
              <button
                type="button"
                onClick={() => handleOpenBookingModal(false)}
                className="rounded-lg bg-[#26318C] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 whitespace-nowrap cursor-pointer"
              >
                {copy.proceedBookingBtn}
              </button>
            </div>
          </div>
        ) : (
          <a
            href={directWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-4 right-4 sm:right-6 z-40 inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-medium text-white shadow-lg hover:bg-emerald-800 transition-colors whitespace-nowrap"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>{copy.whatsappBookingHelp}</span>
          </a>
        )
      )}

      {/* MODALS */}
      <BookingModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedItems={cart}
        onRemoveItem={(id) => setCart((prev) => prev.filter((x) => x.id !== id))}
        onClearCart={() => setCart([])}
        settings={settings}
        lang={lang}
        defaultHomeCollection={defaultHomeMode}
        onBookingCreated={(b) => setRecentCreatedBooking(b)}
        allTests={tests}
        allPackages={packages}
        onAddQuickTest={(test) => toggleTestInCart(test)}
      />

      <QrCodeHubModal
        open={qrHubOpen}
        onClose={() => setQrHubOpen(false)}
        settings={settings}
        lang={lang}
      />
    </div>
  );
}
