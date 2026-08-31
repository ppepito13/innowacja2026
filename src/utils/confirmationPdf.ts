import { jsPDF } from 'jspdf';
import { Event } from '../types/types';
import { localizedEventField } from './localizedEvent';
import { dateLocaleTag } from './formatters';

function stripDiacritics(str: string): string {
  if (!str) return str;
  const map: Record<string, string> = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l', 'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'A', 'Ć': 'C', 'Ę': 'E', 'Ł': 'L', 'Ń': 'N', 'Ó': 'O', 'Ś': 'S', 'Ź': 'Z', 'Ż': 'Z'
  };
  return str.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, match => map[match] || match);
}

function formatDateForPdf(iso: string, language?: string): string {
  return new Intl.DateTimeFormat(dateLocaleTag(language), { dateStyle: 'long', timeStyle: 'short' }).format(new Date(iso));
}

function qrSvgToDataUrl(svgElement: SVGSVGElement): Promise<string> {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);
      ctx.drawImage(img, 0, 0, 400, 400);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export async function generateConfirmationPdf(
  event: Event,
  unregisterToken: string,
  t: (key: string) => string,
  language?: string,
): Promise<void> {
  const qrSvg = document.querySelector('#qr-confirmation svg') as SVGSVGElement | null;
  const eventTitle = localizedEventField(event, 'title', language);
  const eventLocation = localizedEventField(event, 'location', language);

  // const baseUrl = process.env.UNREGISTER_URL!;
  const baseUrl = "http://31.182.34.134:20080/unregister/";
  const unrregisterUrl = `${baseUrl.replace(/\/$/, '')}/${unregisterToken}`;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // header bar
  doc.setFillColor(0, 46, 60);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(stripDiacritics(t('common.brand')), margin, 18);

  y = 42;

  // event title
  doc.setTextColor(0, 46, 60);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(stripDiacritics(eventTitle), contentWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 10 + 6;

  // thank you
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(stripDiacritics(t('eventDetails.confirmationThankYou')), margin, y);
  y += 12;

  // separator
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // date
  const startIso = event.startDate.iso ?? event.startDate.date?.toISOString() ?? '';
  if (startIso) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 46, 60);
    doc.text(stripDiacritics(t('eventDetails.dateLabel') + ':'), margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    let dateStr = formatDateForPdf(startIso, language);
    const endIso = event.endDate?.iso ?? event.endDate?.date?.toISOString();
    if (endIso) {
      dateStr += '  —  ' + formatDateForPdf(endIso, language);
    }
    doc.text(stripDiacritics(dateStr), margin + 5, y + 6);
    y += 16;
  }

  // location
  if (eventLocation && event.eventFormat !== 'virtual') {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 46, 60);
    doc.text(stripDiacritics(t('eventDetails.locationLabel') + ':'), margin, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text(stripDiacritics(eventLocation), margin + 5, y + 6);
    y += 16;
  }

  // separator
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // QR code
  if (qrSvg) {
    try {
      const qrDataUrl = await qrSvgToDataUrl(qrSvg);
      const qrSize = 50;
      const qrX = (pageWidth - qrSize) / 2;
      doc.addImage(qrDataUrl, 'PNG', qrX, y, qrSize, qrSize);
      y += qrSize + 6;
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(stripDiacritics(t('eventDetails.showCodeAtEntrance')), pageWidth / 2, y, { align: 'center' });
      y += 12;
    } catch {
      y += 4;
    }
  }

  // unregister link placeholder
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.textWithLink(stripDiacritics(t('eventDetails.confirmationUnregister')), pageWidth / 2, y, { align: 'center', url: unrregisterUrl });
      
  y += 6;

  // footer
  const footerY = doc.internal.pageSize.getHeight() - 10;
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text(stripDiacritics(t('common.brand')), pageWidth / 2, footerY, { align: 'center' });

  doc.save(`${stripDiacritics(eventTitle).replace(/[^a-zA-Z0-9]/g, '_')}_potwierdzenie.pdf`);
}
