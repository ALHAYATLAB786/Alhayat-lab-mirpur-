import React, {useCallback, useEffect, useState} from 'react';
import {CheckCircle2, Download, FileCheck2, Search} from 'lucide-react';
import {WhatsAppIcon} from './WhatsAppIcon';
import {t} from '../i18n';
import type {BookingRecord, LabSettings, Language} from '../types';
import {
  buildWhatsAppBookingUrl,
  downloadInvoicePdf,
  downloadLabReportPdf,
  generateQrDataUrl,
  getVerificationUrl,
} from '../utils/pdfAndQr';

interface PatientPortalSectionProps {
  settings: LabSettings;
  lang: Language;
  initialVerifyId?: string | null;
  recentBooking?: BookingRecord | null;
}

const PROGRESS_STEPS = [
  {key: 'Booked', labelEn: 'Registered', labelUr: 'بکنگ رجسٹرڈ'},
  {key: 'Sample', labelEn: 'Sample Collected', labelUr: 'سیمپل جمع'},
  {key: 'Processing', labelEn: 'In Lab Analysis', labelUr: 'لیب پراسیسنگ'},
  {key: 'Ready', labelEn: 'Report Verified', labelUr: 'رپورٹ تیار'},
];

function statusToStepIndex(status: BookingRecord['status']): number {
  switch (status) {
    case 'Pending':
    case 'Confirmed':
      return 0;
    case 'Sample Collected':
      return 1;
    case 'Processing':
      return 2;
    case 'Report Ready':
    case 'Completed':
      return 3;
    default:
      return 0;
  }
}

export const PatientPortalSection: React.FC<PatientPortalSectionProps> = ({
  settings,
  lang,
  initialVerifyId,
  recentBooking,
}) => {
  const copy = t(lang);
  const [query, setQuery] = useState(initialVerifyId || '');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [results, setResults] = useState<BookingRecord[]>([]);
  const [qrMap, setQrMap] = useState<Record<string, string>>({});

  const performLookup = useCallback(async (searchValue: string) => {
    const clean = searchValue.trim();
    if (!clean) return;
    setLoading(true);
    setErrorMsg('');
    setSearched(true);

    try {
      const resp = await fetch(`/api/patient/lookup?query=${encodeURIComponent(clean)}`);
      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data.message || 'Lookup failed.');
        setResults([]);
      } else {
        const list: BookingRecord[] = data.bookings || [];
        setResults(list);
        const generatedQrs: Record<string, string> = {};
        await Promise.all(
          list.map(async (b) => {
            generatedQrs[b.id] = await generateQrDataUrl(getVerificationUrl(b.id));
          })
        );
        setQrMap(generatedQrs);
      }
    } catch {
      setErrorMsg('Unable to reach verification server. Please check connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialVerifyId) {
      setQuery(initialVerifyId);
      performLookup(initialVerifyId);
    }
  }, [initialVerifyId, performLookup]);

  useEffect(() => {
    if (recentBooking) {
      setQuery(recentBooking.id);
      performLookup(recentBooking.id);
    }
  }, [recentBooking, performLookup]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(query);
  };

  return (
    <section id="patient-portal" className="py-16 sm:py-20 border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            {copy.portalTitle}
          </h2>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            {copy.portalSubtitle}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.portalInputPlaceholder}
              className="w-full rounded-lg border border-slate-300 bg-slate-50/60 pl-10 pr-4 py-2.5 text-sm font-mono tabular-nums text-slate-900 focus:border-[#26318C] focus:bg-white focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#26318C] px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-950 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {loading ? 'Checking...' : copy.portalSearchBtn}
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => {
              setQuery('AHL-2026-1001');
              performLookup('AHL-2026-1001');
            }}
            className="font-medium text-[#26318C] hover:underline cursor-pointer"
          >
            {copy.trySampleBtn}
          </button>
          <span aria-hidden="true">·</span>
          <span>
            {lang === 'ur'
              ? 'کیو آر کوڈ اسکین کرنے پر رپورٹ خودکار کھل جائے گی'
              : 'QR codes on printed invoices automatically open verified records here'}
          </span>
        </div>

        {errorMsg && (
          <div className="mt-6 max-w-2xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            {errorMsg}
          </div>
        )}

        {searched && !loading && results.length === 0 && !errorMsg && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center max-w-2xl">
            <p className="text-sm font-medium text-slate-900">
              {lang === 'ur'
                ? 'اس آئی ڈی یا موبائل نمبر پر کوئی ریکارڈ نہیں ملا۔'
                : 'No booking or diagnostic report matched that ID or phone number.'}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {lang === 'ur'
                ? 'درست بکنگ آئی ڈی (مثلاً AHL-2026-1001) درج کریں یا واٹس ایپ 0342-0806062 پر رابطہ کریں۔'
                : 'Check your invoice slip (e.g. AHL-2026-1001) or message reception on WhatsApp at 0342-0806062.'}
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-8 space-y-6">
            {results.map((booking) => {
              const activeStep = statusToStepIndex(booking.status);
              const qrImg = qrMap[booking.id];

              return (
                <div
                  key={booking.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 p-6"
                >
                  {/* Record Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-[#26318C] tabular-nums">
                          {booking.id}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>PIN: {booking.verificationPin}</span>
                        <span aria-hidden="true">·</span>
                        <span>{booking.preferredDate}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-slate-800">Status: {booking.status}</span>
                        <span aria-hidden="true">·</span>
                        <span>Payment: {booking.paymentStatus}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {booking.patientName}{' '}
                        <span className="text-sm font-normal text-slate-500">
                          ({booking.patientAge} / {booking.patientGender})
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        {booking.collectionType === 'home_collection'
                          ? `Home Sample Collection — ${booking.address}`
                          : `Lab Visit — ${settings.address}`}{' '}
                        · Ref: {booking.doctorRef}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => downloadInvoicePdf(booking, settings)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-[#26318C]" />
                        <span>{copy.downloadInvoiceBtn}</span>
                      </button>

                      {booking.reportPublished && booking.reportResults.length > 0 && (
                        <button
                          type="button"
                          onClick={() => downloadLabReportPdf(booking, settings)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#26318C] px-4 py-2 text-xs font-medium text-white hover:bg-indigo-950 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" />
                          <span>{copy.downloadReportBtn}</span>
                        </button>
                      )}

                      <a
                        href={buildWhatsAppBookingUrl(booking, settings, lang)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5 text-emerald-700" />
                        <span>{lang === 'ur' ? 'واٹس ایپ پر رابطہ کریں' : 'Contact on WhatsApp'}</span>
                      </a>
                    </div>
                  </div>

                  {/* 4-Step Progress Tracker */}
                  {booking.status !== 'Cancelled' && (
                    <div className="py-5 border-b border-slate-200">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {PROGRESS_STEPS.map((step, idx) => {
                          const completed = idx <= activeStep;
                          return (
                            <div key={step.key} className="flex items-center gap-2 text-xs">
                              <CheckCircle2
                                className={`h-4 w-4 shrink-0 ${
                                  completed ? 'text-emerald-600' : 'text-slate-300'
                                }`}
                              />
                              <span
                                className={
                                  completed ? 'font-semibold text-slate-900' : 'text-slate-400'
                                }
                              >
                                {idx + 1}. {lang === 'ur' ? step.labelUr : step.labelEn}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Booked Items + QR Verification */}
                  <div className="mt-5 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    <div className="lg:col-span-3 space-y-5">
                      <div>
                        <h4 className="text-xs font-semibold text-slate-700 mb-2">
                          {lang === 'ur' ? 'رجسٹرڈ ٹیسٹ اور بلنگ تفصیل' : 'Registered Investigations & Billing'}
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500">
                                <th className="py-2 pr-3 font-medium">Code</th>
                                <th className="py-2 pr-3 font-medium">Investigation</th>
                                <th className="py-2 pr-3 font-medium">Turnaround</th>
                                <th className="py-2 text-right font-medium">Fee (PKR)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/70">
                              {booking.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-2 pr-3 font-mono tabular-nums text-slate-500">
                                    {item.code}
                                  </td>
                                  <td className="py-2 pr-3 font-medium text-slate-900">{item.name}</td>
                                  <td className="py-2 pr-3 text-slate-600">{item.turnaround}</td>
                                  <td className="py-2 text-right font-mono tabular-nums text-slate-900">
                                    Rs. {item.price.toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-slate-300 font-semibold text-slate-900">
                                <td colSpan={3} className="pt-2.5 text-right pr-4">
                                  Net Total (Home Fee: Rs. {booking.homeCollectionFee} · Discount: Rs.{' '}
                                  {booking.discount}):
                                </td>
                                <td className="pt-2.5 text-right font-mono tabular-nums text-[#26318C]">
                                  Rs. {booking.totalAmount.toLocaleString()}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {/* Verified Diagnostic Results Table (when published) */}
                      {booking.reportPublished && booking.reportResults.length > 0 && (
                        <div className="pt-4 border-t border-slate-200">
                          <div className="flex items-center justify-between mb-2.5">
                            <h4 className="text-xs font-semibold text-emerald-800">
                              {lang === 'ur'
                                ? 'مصدقہ لیبارٹری رپورٹ نتائج'
                                : 'Verified Clinical Laboratory Results'}
                            </h4>
                            <span className="text-xs text-slate-500">
                              {booking.verifiedBy || 'Verified by M.D Toseef Gulistan'}
                            </span>
                          </div>
                          <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                                  <th className="py-2.5 px-3 font-medium">Parameter</th>
                                  <th className="py-2.5 px-3 font-medium">Result</th>
                                  <th className="py-2.5 px-3 font-medium">Unit</th>
                                  <th className="py-2.5 px-3 font-medium">Reference Interval</th>
                                  <th className="py-2.5 px-3 font-medium">Interpretation</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {booking.reportResults.map((row, rIdx) => {
                                  const isAbnormal =
                                    row.flag === 'High' ||
                                    row.flag === 'Low' ||
                                    row.flag === 'Positive';
                                  return (
                                    <tr key={rIdx} className="hover:bg-slate-50/70">
                                      <td className="py-2 px-3 font-medium text-slate-900">
                                        {row.parameter}
                                      </td>
                                      <td
                                        className={`py-2 px-3 font-mono tabular-nums font-semibold ${
                                          isAbnormal ? 'text-red-700' : 'text-slate-900'
                                        }`}
                                      >
                                        {row.result}
                                      </td>
                                      <td className="py-2 px-3 text-slate-500">{row.unit}</td>
                                      <td className="py-2 px-3 font-mono tabular-nums text-slate-600">
                                        {row.referenceRange}
                                      </td>
                                      <td
                                        className={`py-2 px-3 font-medium ${
                                          isAbnormal ? 'text-red-700' : 'text-emerald-700'
                                        }`}
                                      >
                                        {row.flag}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          {booking.reportRemarks && (
                            <p className="mt-2.5 text-xs text-slate-600">
                              <strong className="text-slate-800">Remarks:</strong> {booking.reportRemarks}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* QR Verification Stamp + Explicit URL */}
                    <div className="flex flex-col items-center text-center bg-white rounded-lg border border-slate-200 p-4">
                      {qrImg && (
                        <img
                          src={qrImg}
                          alt={`QR verification for ${booking.id}`}
                          referrerPolicy="no-referrer"
                          className="h-28 w-28"
                        />
                      )}
                      <p className="mt-2 font-mono text-xs font-semibold tabular-nums text-slate-900">
                        {booking.id}
                      </p>
                      <a
                        href={getVerificationUrl(booking.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 font-mono text-[10px] text-[#26318C] hover:underline break-all select-all"
                      >
                        {getVerificationUrl(booking.id)}
                      </a>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {lang === 'ur'
                          ? 'آن لائن تصدیق شدہ ریکارڈ'
                          : 'Authentic Al-Hayat Lab Digital Record'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
