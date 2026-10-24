import React, {useEffect, useState} from 'react';
import {Check, Copy, Download, ExternalLink, QrCode, X} from 'lucide-react';
import {WhatsAppIcon} from './WhatsAppIcon';
import type {LabSettings, Language} from '../types';
import {generateQrDataUrl} from '../utils/pdfAndQr';

interface QrCodeHubModalProps {
  open: boolean;
  onClose: () => void;
  settings: LabSettings;
  lang: Language;
}

interface QrCardItem {
  id: string;
  titleEn: string;
  titleUr: string;
  subtitleEn: string;
  subtitleUr: string;
  targetUrl: string;
  dataUrl: string;
}

export const QrCodeHubModal: React.FC<QrCodeHubModalProps> = ({
  open,
  onClose,
  settings,
  lang,
}) => {
  const [cards, setCards] = useState<QrCardItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (!open) return;
    let active = true;

    const currentOrigin = window.location.origin;
    const cleanWa = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const waHomeUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(
      'Assalam-o-Alaikum Al-Hayat Lab Mirpur! I would like to book Home Sample Collection.'
    )}`;
    const portalUrl = `${currentOrigin}/#patient-portal`;
    const mapsQueryUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      'Al-Hayat Lab Near Bashir Drug House Opp DHQ Hospital Mirpur AJK'
    )}`;

    const rawSpecs = [
      {
        id: 'qr-website',
        titleEn: 'Official Website & Online Test Booking',
        titleUr: 'آفیشل ویب سائٹ اور آن لائن ٹیسٹ بکنگ لنک',
        subtitleEn: 'Scan QR or forward URL to open Al-Hayat Lab Website in Chrome',
        subtitleUr: 'کیو آر اسکین کریں یا نیچے دیا گیا لنک فارورڈ کریں (کروم میں کھلے گا)',
        targetUrl: currentOrigin,
      },
      {
        id: 'qr-portal',
        titleEn: 'Patient Report & Invoice Verification',
        titleUr: 'رپورٹ اور انوائس تصدیق پورٹل',
        subtitleEn: 'Scan or open link to check status & download verified PDF reports',
        subtitleUr: 'اپنی پی ڈی ایف رپورٹ ڈاؤن لوڈ کرنے کا براہِ راست لنک',
        targetUrl: portalUrl,
      },
      {
        id: 'qr-whatsapp',
        titleEn: 'WhatsApp Home Sample Collection',
        titleUr: 'واٹس ایپ ہوم سیمپل کلیکشن',
        subtitleEn: `Direct WhatsApp chat with ${settings.primaryPhone}`,
        subtitleUr: `براہِ راست واٹس ایپ رابطہ: ${settings.primaryPhone}`,
        targetUrl: waHomeUrl,
      },
      {
        id: 'qr-location',
        titleEn: 'Lab Location (Opp. DHQ Hospital Mirpur)',
        titleUr: 'لیب لوکیشن (بالمقابل ڈی ایچ کیو ہسپتال میرپور)',
        subtitleEn: 'Near Bashir Drug House, Mirpur AJK',
        subtitleUr: 'نزد بشیر ڈرگ ہاؤس، میرپور آزاد کشمیر',
        targetUrl: mapsQueryUrl,
      },
    ];

    Promise.all(
      rawSpecs.map(async (spec) => ({
        ...spec,
        dataUrl: await generateQrDataUrl(spec.targetUrl),
      }))
    ).then((generated) => {
      if (active) setCards(generated);
    });

    return () => {
      active = false;
    };
  }, [open, settings]);

  const handleCopyLink = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2200);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  if (!open) return null;

  const websiteForwardWhatsApp = `https://wa.me/?text=${encodeURIComponent(
    `${settings.labName} (${settings.subtitle}) — ${settings.address}\nOnline Test Booking & Report Portal:\n${origin}`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl my-8 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <QrCode className="h-5 w-5 text-[#26318C] shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {lang === 'ur'
                  ? 'الحیات لیب میرپور — آفیشل کیو آر کوڈ اور ویب سائٹ لنک سینٹر'
                  : 'Al-Hayat Lab Mirpur — Official QR Code & Website URL Hub'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'ur'
                  ? 'کسی کو بھی لنک فارورڈ کریں تو وہ سیدھا ہماری ویب سائٹ پر Chrome میں بکنگ کر سکے گا۔'
                  : 'Scan any QR code or copy/forward the Website URL below so patients open the website directly in Chrome.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
            aria-label="Close QR Hub"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Direct Shareable Website URL Strip */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#26318C]">
              {lang === 'ur'
                ? 'آفیشل ویب سائٹ لنک (فارورڈ کرنے کے لیے):'
                : 'Official Public Website Link (Forward to Patients):'}
            </p>
            <a
              href={origin}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-xs text-slate-900 hover:text-[#26318C] hover:underline break-all"
            >
              <span>{origin}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleCopyLink('top-origin', origin)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#26318C] px-3.5 py-2 text-xs font-medium text-white hover:bg-indigo-950 transition-colors whitespace-nowrap cursor-pointer"
            >
              {copiedId === 'top-origin' ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>{lang === 'ur' ? 'لنک کاپی ہو گیا!' : 'Link Copied!'}</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>{lang === 'ur' ? 'ویب سائٹ لنک کاپی کریں' : 'Copy Website URL'}</span>
                </>
              )}
            </button>
            <a
              href={websiteForwardWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-medium text-white hover:bg-emerald-800 transition-colors whitespace-nowrap"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              <span>{lang === 'ur' ? 'واٹس ایپ پر لنک فارورڈ کریں' : 'Forward URL on WhatsApp'}</span>
            </a>
          </div>
        </div>

        {/* QR Cards with Explicit URL Below Every QR Code */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {cards.map((card) => {
            const forwardCardWa = `https://wa.me/?text=${encodeURIComponent(
              `${settings.labName} — ${card.titleEn}:\n${card.targetUrl}`
            )}`;

            return (
              <div
                key={card.id}
                className="flex flex-col items-center text-center rounded-xl border border-slate-200 bg-slate-50/70 p-5"
              >
                <img
                  src={card.dataUrl}
                  alt={card.titleEn}
                  referrerPolicy="no-referrer"
                  className="h-36 w-36 rounded-lg border border-slate-200 bg-white p-2"
                />

                <h3 className="mt-3 text-sm font-semibold text-slate-900">
                  {lang === 'ur' ? card.titleUr : card.titleEn}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {lang === 'ur' ? card.subtitleUr : card.subtitleEn}
                </p>

                {/* Explicit Shareable URL Directly Below QR Code */}
                <div className="mt-2.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-center">
                  <p className="text-[10px] font-medium text-slate-400">
                    {lang === 'ur' ? 'ویب سائٹ / ڈائریکٹ یو آر ایل' : 'Direct Website URL'}
                  </p>
                  <a
                    href={card.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 block font-mono text-[11px] text-[#26318C] hover:underline break-all select-all"
                  >
                    {card.targetUrl}
                  </a>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(card.id, card.targetUrl)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedId === card.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{lang === 'ur' ? 'کاپی ہو گیا' : 'Copied'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[#26318C]" />
                        <span>{lang === 'ur' ? 'لنک کاپی کریں' : 'Copy URL'}</span>
                      </>
                    )}
                  </button>

                  <a
                    href={forwardCardWa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{lang === 'ur' ? 'فارورڈ لنک' : 'Forward'}</span>
                  </a>

                  <a
                    href={card.dataUrl}
                    download={`AlHayatLab-${card.id}.png`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Download className="h-3.5 w-3.5 text-[#26318C]" />
                    <span>{lang === 'ur' ? 'کیو آر ڈاؤن لوڈ' : 'QR PNG'}</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
