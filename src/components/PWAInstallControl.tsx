import React, {useEffect, useState} from 'react';
import {CheckCircle2, Download, Laptop, Smartphone, WifiOff, X} from 'lucide-react';
import type {Language} from '../types';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{outcome: 'accepted' | 'dismissed'; platform: string}>;
}

// ============================================================================
// GLOBAL INSTALL PROMPT INTERCEPTOR
// Suppresses automatic browser install prompts for all public visitors in Chrome
// so patients only use the website URL, while preserving the deferred prompt
// exclusively for the authenticated Admin Portal owner.
// ============================================================================
let sharedDeferredPrompt: BeforeInstallPromptEvent | null = null;
let sharedIsInstalled = false;
const promptSubscribers = new Set<() => void>();

function notifyPromptSubscribers() {
  promptSubscribers.forEach((listener) => listener());
}

if (typeof window !== 'undefined') {
  sharedIsInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as {standalone?: boolean}).standalone === true;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    // Always suppress browser-default install banner on public pages
    e.preventDefault();
    sharedDeferredPrompt = e as BeforeInstallPromptEvent;
    notifyPromptSubscribers();
  });

  window.addEventListener('appinstalled', () => {
    sharedIsInstalled = true;
    sharedDeferredPrompt = null;
    notifyPromptSubscribers();
  });
}

export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as {standalone?: boolean}).standalone === true
  );
}

export function usePWAInstall() {
  const [, setTick] = useState(0);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const listener = () => setTick((n) => n + 1);
    promptSubscribers.add(listener);
    return () => {
      promptSubscribers.delete(listener);
    };
  }, []);

  const install = async () => {
    if (!sharedDeferredPrompt) return false;
    await sharedDeferredPrompt.prompt();
    const {outcome} = await sharedDeferredPrompt.userChoice;
    if (outcome === 'accepted') {
      sharedIsInstalled = true;
      sharedDeferredPrompt = null;
      notifyPromptSubscribers();
      return true;
    }
    return false;
  };

  return {
    isInstallable: Boolean(sharedDeferredPrompt),
    isInstalled: sharedIsInstalled || isRunningStandalone(),
    isIOS,
    install,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC<{lang: Language}> = ({lang}) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-md">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>
        {lang === 'ur'
          ? 'آف لائن موڈ — محفوظ شدہ ڈیٹا استعمال ہو رہا ہے۔'
          : 'Offline Mode — Cached lab directory is active.'}
      </span>
    </div>
  );
};

interface PWAInstallButtonProps {
  lang: Language;
  variant?: 'compact' | 'primary';
  showInstalledState?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang,
  variant = 'compact',
  showInstalledState = false,
}) => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    if (!showInstalledState) return null;
    return (
      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span>
          {lang === 'ur'
            ? 'آپ کے لیپ ٹاپ / فون میں پرائیویٹ ایپ انسٹال ہے'
            : 'Private Admin App Active on This Device'}
        </span>
      </div>
    );
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          variant === 'primary'
            ? 'inline-flex items-center gap-2 rounded-lg bg-[#26318C] px-4 py-2.5 text-xs font-medium text-white hover:bg-indigo-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer'
            : 'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer'
        }
      >
        <Download
          className={`h-3.5 w-3.5 ${variant === 'primary' ? 'text-white' : 'text-[#26318C]'}`}
        />
        <span>
          {variant === 'primary'
            ? lang === 'ur'
              ? 'پرائیویٹ لیب ایپ ڈاؤن لوڈ کریں (لیپ ٹاپ / فون)'
              : 'Install Private Lab App (Laptop / Phone)'
            : lang === 'ur'
            ? 'پرائیویٹ ایپ انسٹال'
            : 'Install Private App'}
        </span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-base font-semibold text-slate-900">
                {lang === 'ur'
                  ? 'صرف مالک کے لیے: اپنے لیپ ٹاپ یا فون میں ایپ انسٹال کریں'
                  : 'Owner Only: Install Private Lab App on Laptop or Phone'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-slate-600">
              {isIOS ? (
                <div className="flex items-start gap-3">
                  <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-[#26318C]" />
                  <div>
                    <p className="font-medium text-slate-900">iPhone / iPad (Safari)</p>
                    <p className="mt-1">
                      1. Open <span className="font-mono text-xs">{window.location.origin}/#admin</span> in Safari.
                      <br />
                      2. Tap the <strong>Share</strong> icon and select <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <Laptop className="mt-0.5 h-5 w-5 shrink-0 text-[#26318C]" />
                    <div>
                      <p className="font-medium text-slate-900">
                        {lang === 'ur'
                          ? 'لیپ ٹاپ / کمپیوٹر پر انسٹال کرنے کا طریقہ (Chrome / Edge)'
                          : 'Windows / Mac Laptop (Chrome or Edge)'}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed">
                        {lang === 'ur' ? (
                          <>
                            اپنے لیپ ٹاپ کے Chrome براؤزر میں پبلش شدہ لنک کھول کر ایڈمن لاگ اِن کریں، اور ایڈریس بار کے دائیں جانب{' '}
                            <strong>Install Al-Hayat Lab App</strong> آئیکن پر کلک کریں۔ ایپ آپ کے ڈیسک ٹاپ پر انسٹال ہو جائے گی۔
                          </>
                        ) : (
                          <>
                            Open the published app URL in a full Chrome or Edge tab on your laptop, log in to Admin, and click the{' '}
                            <strong>Install</strong> icon on the right side of the address bar (or re-click this button in the full tab).
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                    <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-[#26318C]" />
                    <div>
                      <p className="font-medium text-slate-900">
                        {lang === 'ur'
                          ? 'صرف اپنے موبائل فون میں انسٹال کرنے کے لیے'
                          : 'Owner Mobile Phone Only'}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed">
                        {lang === 'ur'
                          ? 'مریضوں کے لیے ایپ ڈاؤن لوڈ بٹن بند کر دیا گیا ہے تاکہ عام لوگ صرف Chrome میں ویب سائٹ دیکھ سکیں۔ صرف آپ اپنے فون میں Chrome Menu (⋮) → Install App سے انسٹال کر سکتے ہیں۔'
                          : 'Public app download buttons are hidden from patients so visitors only use the website in Chrome. To install on your own phone, open in Chrome and tap Menu (⋮) → Install App.'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full rounded-lg bg-[#26318C] px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-950 transition-colors cursor-pointer"
            >
              {lang === 'ur' ? 'ٹھیک ہے' : 'Got It'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
