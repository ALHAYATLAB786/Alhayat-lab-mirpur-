import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type {BookingRecord, LabSettings, Language} from '../types';

export async function generateQrDataUrl(content: string): Promise<string> {
  return QRCode.toDataURL(content, {
    width: 280,
    margin: 1,
    color: {
      dark: '#1E297B',
      light: '#FFFFFF',
    },
  });
}

export function getVerificationUrl(bookingId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://alhayatlab.pk';
  return `${origin}/?verify=${encodeURIComponent(bookingId)}`;
}

export function buildWhatsAppBookingUrl(
  booking: BookingRecord,
  settings: LabSettings,
  lang: Language = 'en'
): string {
  const verifyUrl = getVerificationUrl(booking.id);
  const itemLines = booking.items
    .map(
      (item, idx) =>
        `${idx + 1}. ${item.name} (${item.code}) — ${
          item.price > 0 ? `Rs. ${item.price.toLocaleString()}` : 'As per Prescription'
        }`
    )
    .join('\n');

  const rxLineUr = booking.prescriptionFileName
    ? `اپلوڈ کردہ نسخہ / پرچی: منسلک ہے (${booking.prescriptionFileName})`
    : '';
  const rxLineEn = booking.prescriptionFileName
    ? `Uploaded Prescription / Slip: Attached (${booking.prescriptionFileName})`
    : '';

  const msg =
    lang === 'ur'
      ? [
          `*الحیات لیب میرپور — آن لائن ٹیسٹ بکنگ*`,
          `بکنگ آئی ڈی: *${booking.id}*`,
          `تصدیقی پن: *${booking.verificationPin}*`,
          `مریض کا نام: ${booking.patientName}`,
          `فون نمبر: ${booking.patientPhone}`,
          `عمر / جنس: ${booking.patientAge} / ${booking.patientGender}`,
          `پتہ (ایڈریس): ${booking.address}`,
          `ریفرل / ڈاکٹر: ${booking.doctorRef}`,
          `طریقہ کار: ${
            booking.collectionType === 'home_collection'
              ? 'ہوم سیمپل کلیکشن (گھر سے نمونہ)'
              : 'لیب وزٹ (بالمقابل ڈی ایچ کیو ہسپتال میرپور)'
          }`,
          `تاریخ و وقت: ${booking.preferredDate} · ${booking.preferredTime}`,
          rxLineUr,
          ``,
          `*منتخب ٹیسٹ / پیکیجز:*`,
          itemLines,
          ``,
          `کل بل: *Rs. ${booking.totalAmount.toLocaleString()}*`,
          `آن لائن انوائس و رپورٹ ٹریکنگ: ${verifyUrl}`,
        ]
          .filter(Boolean)
          .join('\n')
      : [
          `*AL-HAYAT LAB MIRPUR — TEST BOOKING*`,
          `Booking ID: *${booking.id}*`,
          `Verification PIN: *${booking.verificationPin}*`,
          `Patient Name: ${booking.patientName}`,
          `Phone: ${booking.patientPhone}`,
          `Age / Gender: ${booking.patientAge} / ${booking.patientGender}`,
          `Address: ${booking.address}`,
          `Referral / Doctor: ${booking.doctorRef}`,
          `Service Mode: ${
            booking.collectionType === 'home_collection'
              ? 'Home Sample Collection'
              : 'Lab Visit (Opp. DHQ Hospital Mirpur)'
          }`,
          `Preferred Slot: ${booking.preferredDate} at ${booking.preferredTime}`,
          rxLineEn,
          ``,
          `*Selected Tests / Packages:*`,
          itemLines,
          ``,
          `Total Amount: *PKR ${booking.totalAmount.toLocaleString()}*`,
          `Verify & Track Report: ${verifyUrl}`,
        ]
          .filter(Boolean)
          .join('\n');

  const cleanWa = settings.whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanWa}?text=${encodeURIComponent(msg)}`;
}

function drawPdfHeader(doc: jsPDF, settings: LabSettings, qrDataUrl: string, docTitle: string) {
  doc.setFillColor(30, 41, 123);
  doc.rect(0, 0, 210, 8, 'F');

  doc.setTextColor(30, 41, 123);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AL-HAYAT LAB MIRPUR', 14, 20);

  doc.setTextColor(220, 38, 38);
  doc.setFontSize(10);
  doc.text('SKIN CARE CENTER & DIAGNOSTIC LABORATORY', 14, 26);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `${settings.managingDirector}  |  Tel/WhatsApp: ${settings.primaryPhone} / ${settings.secondaryPhone}`,
    14,
    32
  );
  doc.text(`${settings.address}  |  Timings: ${settings.timings}`, 14, 37);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 41, 146, 8, 1.5, 1.5, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(docTitle, 18, 46.3);

  doc.addImage(qrDataUrl, 'PNG', 166, 12, 30, 30);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SCAN TO VERIFY', 181, 45, {align: 'center'});

  doc.setDrawColor(226, 232, 240);
  doc.line(14, 52, 196, 52);
}

export async function downloadInvoicePdf(booking: BookingRecord, settings: LabSettings): Promise<void> {
  const doc = new jsPDF({unit: 'mm', format: 'a4'});
  const verifyUrl = getVerificationUrl(booking.id);
  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  drawPdfHeader(doc, settings, qrDataUrl, `OFFICIAL PATIENT BOOKING INVOICE  —  #${booking.id}`);

  // Top Section: Patient Name, Phone, Age, Address & Referral First
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Name:', 14, 60);
  doc.text('Phone Number:', 14, 66);
  doc.text('Age / Gender:', 14, 72);
  doc.text('Address:', 14, 78);
  doc.text('Doctor Referral:', 14, 84);

  doc.setFont('helvetica', 'normal');
  doc.text(booking.patientName, 44, 60);
  doc.text(booking.patientPhone, 44, 66);
  doc.text(`${booking.patientAge} / ${booking.patientGender}`, 44, 72);
  doc.text(booking.address, 44, 78, {maxWidth: 66});
  doc.text(booking.doctorRef || 'Self / Walk-in', 44, 84, {maxWidth: 66});

  doc.setFont('helvetica', 'bold');
  doc.text('Invoice / ID:', 115, 60);
  doc.text('Verify PIN:', 115, 66);
  doc.text('Collection Mode:', 115, 72);
  doc.text('Preferred Slot:', 115, 78);
  doc.text('Prescription:', 115, 84);

  doc.setFont('helvetica', 'normal');
  doc.text(booking.id, 146, 60);
  doc.text(booking.verificationPin, 146, 66);
  doc.text(
    booking.collectionType === 'home_collection' ? 'Home Sample Collection' : 'Lab Visit (Opp. DHQ)',
    146,
    72
  );
  doc.text(`${booking.preferredDate} (${booking.preferredTime})`, 146, 78);
  doc.text(
    booking.prescriptionFileName ? `Attached (${booking.prescriptionFileName.slice(0, 18)})` : 'Not Attached',
    146,
    84
  );

  // Lower Section: Selected Tests & Packages Table
  autoTable(doc, {
    startY: 92,
    head: [['#', 'Code', 'Investigation / Package Description', 'Turnaround', 'Fee (PKR)']],
    body: booking.items.map((item, i) => [
      String(i + 1),
      item.code,
      item.name,
      item.turnaround,
      item.price > 0 ? `Rs. ${item.price.toLocaleString()}` : 'As per Rx',
    ]),
    styles: {
      fontSize: 8.8,
      cellPadding: 3,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [30, 41, 123],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: {cellWidth: 10},
      1: {cellWidth: 24},
      3: {cellWidth: 36},
      4: {cellWidth: 30, halign: 'right'},
    },
  });

  const finalY = (doc as unknown as {lastAutoTable?: {finalY: number}}).lastAutoTable?.finalY || 140;

  // Totals Summary Box
  const sumY = finalY + 8;
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(120, sumY, 76, 32, 2, 2, 'S');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Tests Subtotal:', 124, sumY + 7);
  doc.text(`Rs. ${booking.subtotal.toLocaleString()}`, 192, sumY + 7, {align: 'right'});

  doc.text('Home Sample Fee:', 124, sumY + 13);
  doc.text(
    booking.homeCollectionFee === 0 ? 'FREE (Rs. 0)' : `Rs. ${booking.homeCollectionFee.toLocaleString()}`,
    192,
    sumY + 13,
    {align: 'right'}
  );

  doc.text('Discount:', 124, sumY + 19);
  doc.text(`- Rs. ${booking.discount.toLocaleString()}`, 192, sumY + 19, {align: 'right'});

  doc.setDrawColor(203, 213, 225);
  doc.line(124, sumY + 22, 192, sumY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 123);
  doc.text('Net Total (PKR):', 124, sumY + 28.5);
  doc.text(`Rs. ${booking.totalAmount.toLocaleString()}`, 192, sumY + 28.5, {align: 'right'});

  // Optional Prescription Image Thumbnail on Left of Totals Box (if image uploaded)
  if (booking.prescriptionImage && booking.prescriptionImage.startsWith('data:image/')) {
    try {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Uploaded Prescription / Slip:', 14, sumY + 4);
      doc.addImage(booking.prescriptionImage, 'JPEG', 14, sumY + 6, 36, 26);
    } catch {
      // Ignore non-standard image encoding in PDF preview
    }
  }

  const noteY = sumY + 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Important Lab Turnaround & WhatsApp Contact Notice:', 14, noteY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`• ${settings.specialNoticeEn}`, 14, noteY + 5);
  doc.text(
    `• Scan the QR code above or visit ${verifyUrl} with Booking ID ${booking.id} to track & download your report.`,
    14,
    noteY + 10
  );
  doc.text(
    `• Contact on WhatsApp for further investigation or assistance: ${settings.primaryPhone} / ${settings.secondaryPhone}.`,
    14,
    noteY + 15
  );

  doc.save(`AlHayat-Invoice-${booking.id}.pdf`);
}

export async function downloadLabReportPdf(booking: BookingRecord, settings: LabSettings): Promise<void> {
  const doc = new jsPDF({unit: 'mm', format: 'a4'});
  const verifyUrl = getVerificationUrl(booking.id);
  const qrDataUrl = await generateQrDataUrl(verifyUrl);

  drawPdfHeader(doc, settings, qrDataUrl, `VERIFIED CLINICAL DIAGNOSTIC REPORT  —  #${booking.id}`);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Patient Name:', 14, 60);
  doc.text('Age / Gender:', 14, 66);
  doc.text('Contact Phone:', 14, 72);
  doc.text('Referred By:', 14, 78);

  doc.setFont('helvetica', 'normal');
  doc.text(booking.patientName, 44, 60);
  doc.text(`${booking.patientAge} / ${booking.patientGender}`, 44, 66);
  doc.text(booking.patientPhone, 44, 72);
  doc.text(booking.doctorRef || 'Self / Walk-in', 44, 78);

  doc.setFont('helvetica', 'bold');
  doc.text('Lab Report ID:', 115, 60);
  doc.text('Registered On:', 115, 66);
  doc.text('Reported On:', 115, 72);
  doc.text('Report Status:', 115, 78);

  doc.setFont('helvetica', 'normal');
  doc.text(booking.id, 146, 60);
  doc.text(booking.preferredDate, 146, 66);
  doc.text(
    booking.reportPublishedAt ? booking.reportPublishedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    146,
    72
  );
  doc.text('FINAL VERIFIED', 146, 78);

  autoTable(doc, {
    startY: 86,
    head: [['Investigation Parameter', 'Result', 'Units', 'Biological Reference Range', 'Flag']],
    body: booking.reportResults.map((row) => [
      row.parameter,
      row.result,
      row.unit,
      row.referenceRange,
      row.flag,
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 3.2,
      textColor: [15, 23, 42],
    },
    headStyles: {
      fillColor: [30, 41, 123],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.column.index === 4) {
        const val = String(hookData.cell.raw || '');
        if (val === 'High' || val === 'Low' || val === 'Positive') {
          hookData.cell.styles.textColor = [220, 38, 38];
          hookData.cell.styles.fontStyle = 'bold';
        }
      }
    },
  });

  const finalY = (doc as unknown as {lastAutoTable?: {finalY: number}}).lastAutoTable?.finalY || 150;
  let cursorY = finalY + 10;

  if (booking.reportRemarks) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Clinical / Pathologist Remarks:', 14, cursorY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(51, 65, 85);
    doc.text(booking.reportRemarks, 14, cursorY + 5.5, {maxWidth: 180});
    cursorY += 18;
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(14, cursorY + 8, 196, cursorY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 123);
  doc.text(booking.verifiedBy || 'Toseef Gulistan (M.D — Al-Hayat Lab Mirpur)', 14, cursorY + 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Electronically verified diagnostic report. Scan QR code on top-right to verify authenticity on the Al-Hayat Lab Mirpur Portal.',
    14,
    cursorY + 19
  );

  doc.save(`AlHayat-Report-${booking.id}.pdf`);
}
