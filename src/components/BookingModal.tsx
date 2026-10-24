import React, {useEffect, useRef, useState} from 'react';
import {CheckCircle2, Download, FileText, Trash2, Upload, X} from 'lucide-react';
import {WhatsAppIcon} from './WhatsAppIcon';
import type {BookingRecord, HealthPackage, LabSettings, LabTest, Language} from '../types';
import {
  buildWhatsAppBookingUrl,
  downloadInvoicePdf,
  generateQrDataUrl,
  getVerificationUrl,
} from '../utils/pdfAndQr';

export interface SelectedCartEntry {
  id: string;
  type: 'test' | 'package';
  code: string;
  name: string;
  price: number;
  turnaround: string;
  freeHome?: boolean;
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  selectedItems: SelectedCartEntry[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  settings: LabSettings;
  lang: Language;
  defaultHomeCollection?: boolean;
  onBookingCreated: (booking: BookingRecord) => void;
  allTests?: LabTest[];
  allPackages?: HealthPackage[];
  onAddQuickTest?: (test: LabTest) => void;
}

async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!file.type.startsWith('image/')) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        const maxDim = 1200;
        let {width, height} = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export const BookingModal: React.FC<BookingModalProps> = ({
  open,
  onClose,
  selectedItems,
  onRemoveItem,
  onClearCart,
  settings,
  lang,
  defaultHomeCollection = false,
  onBookingCreated,
  allTests = [],
  onAddQuickTest,
}) => {
  const [collectionType, setCollectionType] = useState<'lab_visit' | 'home_collection'>(
    defaultHomeCollection ? 'home_collection' : 'lab_visit'
  );
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [address, setAddress] = useState('');
  const [doctorRef, setDoctorRef] = useState('');
  const [preferredDate, setPreferredDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [preferredTime, setPreferredTime] = useState('10:00 AM');
  const [notes, setNotes] = useState('');
  const [quickSearch, setQuickSearch] = useState('');

  // Optional Prescription / Invoice Upload State
  const [prescriptionImage, setPrescriptionImage] = useState<string>('');
  const [prescriptionFileName, setPrescriptionFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState<BookingRecord | null>(null);
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (defaultHomeCollection) {
      setCollectionType('home_collection');
    }
  }, [defaultHomeCollection, open]);

  useEffect(() => {
    if (!confirmedBooking) {
      setQrUrl('');
      return;
    }
    generateQrDataUrl(getVerificationUrl(confirmedBooking.id)).then(setQrUrl);
  }, [confirmedBooking]);

  if (!open) return null;

  const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const hasFreeHomePkg = selectedItems.some((i) => i.freeHome);
  const homeFee =
    collectionType === 'home_collection' &&
    !hasFreeHomePkg &&
    (subtotal === 0 || subtotal < settings.freeHomeCollectionThreshold) &&
    (selectedItems.length > 0 || Boolean(prescriptionImage))
      ? settings.homeCollectionFee
      : 0;
  const totalAmount = subtotal + homeFee;

  const cleanWa = settings.whatsappNumber.replace(/[^0-9]/g, '');
  const liveWhatsAppUrl = (() => {
    const draftMsg =
      lang === 'ur'
        ? [
            `السلام علیکم الحیات لیب میرپور! مجھے ٹیسٹ بکنگ / معلومات کے لیے رابطہ کرنا ہے۔`,
            patientName ? `نام: ${patientName}` : '',
            patientPhone ? `فون: ${patientPhone}` : '',
            address ? `ایڈریس: ${address}` : '',
            selectedItems.length > 0
              ? `ٹیسٹ: ${selectedItems.map((i) => i.name).join(', ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n')
        : [
            `Assalam-o-Alaikum Al-Hayat Lab Mirpur! I would like to book a test / inquire on WhatsApp.`,
            patientName ? `Patient Name: ${patientName}` : '',
            patientPhone ? `Phone: ${patientPhone}` : '',
            address ? `Address: ${address}` : '',
            selectedItems.length > 0
              ? `Selected Tests: ${selectedItems.map((i) => i.name).join(', ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n');
    return `https://wa.me/${cleanWa}?text=${encodeURIComponent(draftMsg)}`;
  })();

  const quickMatches =
    quickSearch.trim().length >= 2
      ? allTests
          .filter(
            (t) =>
              !selectedItems.some((s) => s.id === t.id) &&
              (t.name.toLowerCase().includes(quickSearch.toLowerCase()) ||
                t.code.toLowerCase().includes(quickSearch.toLowerCase()))
          )
          .slice(0, 6)
      : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg(
        lang === 'ur'
          ? 'فائل کا سائز 8MB سے کم ہونا چاہیے۔'
          : 'Please choose an image or PDF smaller than 8 MB.'
      );
      return;
    }
    setErrorMsg('');
    try {
      const encoded = await compressImageFile(file);
      setPrescriptionImage(encoded);
      setPrescriptionFileName(file.name);
    } catch {
      setErrorMsg('Could not read the selected file.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!patientName.trim() || patientPhone.replace(/[^0-9]/g, '').length < 10) {
      setErrorMsg(
        lang === 'ur'
          ? 'براہ کرم مریض کا پورا نام اور درست موبائل نمبر درج کریں۔'
          : 'Please enter the patient full name and a valid mobile/WhatsApp number.'
      );
      return;
    }

    if (collectionType === 'home_collection' && !address.trim()) {
      setErrorMsg(
        lang === 'ur'
          ? 'ہوم سیمپل کلیکشن کے لیے مکمل گھر کا پتہ لکھنا ضروری ہے۔'
          : 'Please provide your residential address in Mirpur for Home Sample Collection.'
      );
      return;
    }

    if (selectedItems.length === 0 && !prescriptionImage) {
      setErrorMsg(
        lang === 'ur'
          ? 'براہ کرم نیچے سے کم از کم ایک ٹیسٹ منتخب کریں یا اپنا ڈاکٹر کا نسخہ اپلوڈ کریں۔'
          : 'Please select at least one diagnostic test below or upload your prescription above.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch('/api/bookings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          patientName,
          patientPhone,
          patientAge,
          patientGender,
          collectionType,
          address,
          preferredDate,
          preferredTime,
          doctorRef,
          notes,
          itemIds: selectedItems.map((i) => ({id: i.id, type: i.type})),
          prescriptionImage: prescriptionImage || undefined,
          prescriptionFileName: prescriptionFileName || undefined,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        setErrorMsg(data.message || 'Unable to save booking. Please check inputs.');
        setSubmitting(false);
        return;
      }

      setConfirmedBooking(data.booking);
      onBookingCreated(data.booking);
      onClearCart();
      setPrescriptionImage('');
      setPrescriptionFileName('');
    } catch {
      setErrorMsg('Network error while submitting booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseAll = () => {
    setConfirmedBooking(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-xl my-8 max-h-[92vh] overflow-y-auto">
        {/* Modal Header with Direct WhatsApp Contact Option */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {confirmedBooking
                ? lang === 'ur'
                  ? 'بکنگ مکمل ہو گئی — آفیشل انوائس تیار ہے'
                  : 'Booking Confirmed — Official Invoice & QR Ready'
                : lang === 'ur'
                ? 'ٹیسٹ بکنگ اور انوائس فارم'
                : 'Test Booking & Invoice Form'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {settings.labName} · {settings.address} · {settings.primaryPhone}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={liveWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
            >
              <WhatsAppIcon className="h-3.5 w-3.5" />
              <span>{lang === 'ur' ? 'واٹس ایپ پر رابطہ کریں' : 'Contact on WhatsApp'}</span>
            </a>

            <button
              type="button"
              onClick={handleCloseAll}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              aria-label="Close booking dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {confirmedBooking ? (
          <div className="mt-6 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-base">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  <span>
                    {lang === 'ur' ? 'آپ کی بکنگ رجسٹر ہو چکی ہے!' : 'Your booking is registered!'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Booking ID:{' '}
                  <strong className="font-mono tabular-nums text-slate-900">
                    {confirmedBooking.id}
                  </strong>{' '}
                  · Verification PIN:{' '}
                  <strong className="font-mono tabular-nums text-slate-900">
                    {confirmedBooking.verificationPin}
                  </strong>
                </p>
                <p className="text-xs text-slate-600">
                  Patient: <strong>{confirmedBooking.patientName}</strong> · Phone:{' '}
                  <span className="font-mono">{confirmedBooking.patientPhone}</span>
                </p>
                <p className="text-xs text-slate-600">
                  Address: {confirmedBooking.address} · Referral: {confirmedBooking.doctorRef}
                </p>
                <p className="text-xs text-slate-700">
                  Total Payable:{' '}
                  <strong className="font-mono tabular-nums text-[#26318C]">
                    Rs. {confirmedBooking.totalAmount.toLocaleString()}
                  </strong>
                  {confirmedBooking.prescriptionFileName
                    ? ` · Prescription Attached (${confirmedBooking.prescriptionFileName})`
                    : ''}
                </p>
              </div>
              {qrUrl && (
                <div className="flex flex-col items-center text-center shrink-0 max-w-[180px]">
                  <img
                    src={qrUrl}
                    alt={`Verification QR for ${confirmedBooking.id}`}
                    referrerPolicy="no-referrer"
                    className="h-24 w-24 rounded-lg border border-slate-200 bg-white p-1.5"
                  />
                  <a
                    href={getVerificationUrl(confirmedBooking.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 font-mono text-[10px] text-[#26318C] hover:underline break-all"
                  >
                    {getVerificationUrl(confirmedBooking.id)}
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => downloadInvoicePdf(confirmedBooking, settings)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#26318C] px-4 py-3 text-sm font-medium text-white hover:bg-indigo-950 transition-colors whitespace-nowrap cursor-pointer"
              >
                <Download className="h-4 w-4 shrink-0" />
                <span>
                  {lang === 'ur' ? 'پی ڈی ایف انوائس ڈاؤن لوڈ کریں' : 'Download PDF Invoice (with QR)'}
                </span>
              </button>

              <a
                href={buildWhatsAppBookingUrl(confirmedBooking, settings, lang)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-800 transition-colors whitespace-nowrap"
              >
                <WhatsAppIcon className="h-4 w-4" />
                <span>
                  {lang === 'ur' ? 'واٹس ایپ پر لیب کو بھیجیں' : 'Send on WhatsApp (0342-0806062)'}
                </span>
              </a>
            </div>

            <div className="border-t border-slate-200 pt-4 text-xs text-slate-500 space-y-1">
              <p>
                • Save your Booking ID (<strong className="font-mono">{confirmedBooking.id}</strong>) to track sample collection and download your verified report in the Patient Portal.
              </p>
              <p>• {settings.specialNoticeEn}</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-6">
            {/* ================================================================
                SECTION 1 (FIRST / TOP): PATIENT NAME, PHONE, AGE, ADDRESS & REFERRAL
                ================================================================ */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-[#26318C] pb-1.5 border-b border-slate-100">
                {lang === 'ur'
                  ? '1. مریض کی بنیادی معلومات اور ریفرل (پہلے درج کریں)'
                  : '1. Patient Information, Address & Referral'}
              </h3>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'ur' ? 'مریض کا مکمل نام *' : 'Patient Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Muhammad Usman"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'ur' ? 'فون / واٹس ایپ نمبر *' : 'Phone / WhatsApp Number *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="0342-0000000"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-[#26318C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Age, Gender, Date & Time */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'ur' ? 'عمر (سال)' : 'Age (Years)'}
                  </label>
                  <input
                    type="text"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 34"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums text-slate-900 focus:border-[#26318C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'ur' ? 'جنس' : 'Gender'}
                  </label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as 'Male' | 'Female' | 'Other')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'ur' ? 'تاریخ' : 'Preferred Date'}
                  </label>
                  <input
                    type="date"
                    value={preferredDate}
                    onChange={(e) => setPreferredDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm tabular-nums text-slate-900 focus:border-[#26318C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'ur' ? 'وقت (8AM–12AM)' : 'Time Slot'}
                  </label>
                  <select
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
                  >
                    <option value="08:30 AM">08:30 AM (Fasting)</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="09:00 PM">09:00 PM</option>
                    <option value="11:00 PM">11:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Service Mode + Patient Address */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'ur' ? 'سیمپل دینے کا طریقہ کار' : 'Sample Collection Mode'}
                  </label>
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setCollectionType('lab_visit')}
                      className={`rounded-md py-2 px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        collectionType === 'lab_visit'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'ur' ? 'لیب وزٹ (بالمقابل DHQ)' : 'Lab Visit (Opp. DHQ Hospital)'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollectionType('home_collection')}
                      className={`rounded-md py-2 px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        collectionType === 'home_collection'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {lang === 'ur' ? 'گھر بیٹھے سیمپل کلیکشن' : 'Home Sample Collection'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {collectionType === 'home_collection'
                      ? lang === 'ur'
                        ? 'مکمل پتہ / ایڈریس (میرپور سیکٹر، گلی، مکان نمبر) *'
                        : 'Complete Address in Mirpur (Sector / Street / House No.) *'
                      : lang === 'ur'
                      ? 'پتہ / علاقہ (ایڈریس)'
                      : 'Patient Address / Area in Mirpur'}
                  </label>
                  <input
                    type="text"
                    required={collectionType === 'home_collection'}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. House 14, Sector F-1, Mirpur AJK"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
                  />
                </div>
              </div>

              {/* Referral & Clinical Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'ur'
                      ? 'ریفرل / ڈاکٹر کا نام (Referred By)'
                      : 'Referral / Referred By Doctor'}
                  </label>
                  <input
                    type="text"
                    value={doctorRef}
                    onChange={(e) => setDoctorRef(e.target.value)}
                    placeholder="Self / Dr. Name (DHQ Hospital)"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    {lang === 'ur' ? 'اضافی نوٹ / ہدایت' : 'Additional Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Fasting / Urgent / Special care"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* ================================================================
                SECTION 2: UPLOAD YOUR PRESCRIPTION / UPLOAD INVOICE (OPTIONAL)
                ================================================================ */}
            <div className="rounded-xl border border-dashed border-[#26318C]/40 bg-indigo-50/40 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-900">
                    {lang === 'ur'
                      ? 'اپنا نسخہ یا انوائس اپلوڈ کریں — Upload Your Prescription / Invoice (اختیاری)'
                      : 'Upload Your Prescription or Previous Invoice (Optional)'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {lang === 'ur'
                      ? 'اگر آپ ڈاکٹر کی پرچی یا انوائس کی تصویر اپلوڈ کرنا چاہیں تو کلک کریں، نہ کرنا چاہیں تو چھوڑ دیں۔'
                      : 'Click to attach a photo or PDF of your doctor prescription / slip if you wish, or skip if not needed.'}
                  </p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#26318C]/30 bg-white px-3.5 py-2 text-xs font-medium text-[#26318C] hover:bg-indigo-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>
                    {prescriptionFileName
                      ? lang === 'ur'
                        ? 'فائل تبدیل کریں'
                        : 'Change File'
                      : lang === 'ur'
                      ? 'پریسکرپشن اپلوڈ کریں'
                      : 'Upload Prescription'}
                  </span>
                </button>
              </div>

              {prescriptionFileName && (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    {prescriptionImage.startsWith('data:image/') ? (
                      <img
                        src={prescriptionImage}
                        alt="Uploaded Prescription Preview"
                        referrerPolicy="no-referrer"
                        className="h-12 w-12 rounded object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <FileText className="h-8 w-8 text-[#26318C] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {prescriptionFileName}
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        {lang === 'ur'
                          ? 'نسخہ منسلک ہو گیا ہے'
                          : 'Prescription attached to booking invoice'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPrescriptionImage('');
                      setPrescriptionFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    aria-label="Remove uploaded prescription"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* ================================================================
                SECTION 3 (BOTTOM): SELECT / ADD TESTS & INVOICE SUMMARY
                ================================================================ */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <h3 className="text-xs font-semibold text-[#26318C]">
                {lang === 'ur'
                  ? '2. مطلوبہ لیب ٹیسٹ منتخب کریں اور بل چیک کریں'
                  : '2. Select Diagnostic Tests & Review Invoice Total'}
              </h3>

              <div>
                <input
                  type="text"
                  value={quickSearch}
                  onChange={(e) => setQuickSearch(e.target.value)}
                  placeholder={
                    lang === 'ur'
                      ? 'یہاں ٹیسٹ کا نام لکھ کر شامل کریں (مثلاً CBC, HbA1c, TSH, LFT, Urine R/E)...'
                      : 'Search & add tests from 535+ catalog (e.g. CBC, HbA1c, TSH, Lipid Profile)...'
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-[#26318C] focus:outline-none"
                />
                {quickMatches.length > 0 && (
                  <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 divide-y divide-slate-200">
                    {quickMatches.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                      >
                        <div>
                          <span className="font-medium text-slate-900">{test.name}</span>
                          <span className="text-slate-500">
                            {' '}
                            · {test.department} · {test.turnaround}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onAddQuickTest?.(test);
                            setQuickSearch('');
                          }}
                          className="rounded-md bg-[#26318C] px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-950 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          + Rs. {test.price.toLocaleString()}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-800">
                    {lang === 'ur' ? 'منتخب کردہ ٹیسٹ اور پیکیجز' : 'Selected Tests & Packages'} (
                    <span className="tabular-nums">{selectedItems.length}</span>)
                  </span>
                  {selectedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearCart}
                      className="text-xs text-red-600 hover:underline cursor-pointer"
                    >
                      {lang === 'ur' ? 'سب ختم کریں' : 'Clear all'}
                    </button>
                  )}
                </div>

                {selectedItems.length === 0 ? (
                  <p className="py-3 text-xs text-slate-500 text-center">
                    {prescriptionFileName
                      ? lang === 'ur'
                        ? 'آپ نے نسخہ اپلوڈ کر دیا ہے — آپ براہِ راست بکنگ مکمل کر سکتے ہیں یا مزید ٹیسٹ بھی منتخب کر سکتے ہیں۔'
                        : 'Prescription attached — you may submit directly or also add specific tests above.'
                      : lang === 'ur'
                      ? 'اوپر سرچ باکس سے ٹیسٹ شامل کریں یا اپنا ڈاکٹر کا نسخہ اپلوڈ کریں۔'
                      : 'Search above to add tests, or upload your prescription slip.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200/80 max-h-40 overflow-y-auto">
                    {selectedItems.map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 truncate">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {item.code} · {item.turnaround}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-xs font-semibold tabular-nums text-slate-900">
                            Rs. {item.price.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.id)}
                            className="text-slate-400 hover:text-red-600 cursor-pointer"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="text-slate-600 text-xs">
                    {collectionType === 'home_collection'
                      ? homeFee === 0
                        ? 'Home Sample Collection: FREE'
                        : `Includes Rs. ${homeFee} Home Sample Collection`
                      : 'Walk-in Lab Visit (Opp. DHQ Hospital Mirpur)'}
                  </span>
                  <span className="font-mono text-base font-bold tabular-nums text-[#26318C]">
                    Rs. {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {errorMsg && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                {errorMsg}
              </div>
            )}

            {/* Action Bar with Direct WhatsApp Contact + Confirm Invoice */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <a
                href={liveWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
              >
                <WhatsAppIcon className="h-4 w-4 text-emerald-700" />
                <span>{lang === 'ur' ? 'واٹس ایپ پر رابطہ کریں' : 'Contact on WhatsApp'}</span>
              </a>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseAll}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {lang === 'ur' ? 'منسوخ کریں' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-[#26318C] px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-950 disabled:opacity-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {submitting
                    ? 'Generating Invoice...'
                    : lang === 'ur'
                    ? 'بکنگ کنفرم کریں اور انوائس لیں'
                    : 'Confirm Booking & Generate Invoice'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
