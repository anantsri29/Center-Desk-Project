/**
 * WhatsApp reminder links via wa.me (click-to-chat).
 *
 * MVP pattern: owner taps "Send Reminder", WhatsApp opens with a pre-filled message —
 * no API keys or Meta business verification required.
 *
 * Upgrade path: replace buildWhatsAppReminderLink + message builder with the
 * WhatsApp Cloud API (POST to graph.facebook.com) for fully automated sending once
 * paying customers justify the Meta approval process. Keep the same message template.
 */

export function normalizePhoneForWhatsApp(phone) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.startsWith('0')) return `91${digits.slice(1)}`;
  return digits;
}

export function buildWhatsAppReminderLink(phone, message) {
  const normalized = normalizePhoneForWhatsApp(phone);
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildFeeReminderMessage({
  parentName,
  studentName,
  centerName,
  amountDue,
  monthLabel,
  dueDateLabel,
}) {
  return (
    `Hi ${parentName},\n\n` +
    `This is a fee reminder from ${centerName}.\n` +
    `Student: ${studentName}\n` +
    `Month: ${monthLabel}\n` +
    `Amount due: ₹${amountDue.toLocaleString('en-IN')}\n` +
    `Due date: ${dueDateLabel}\n\n` +
    `Please let us know once the payment is done. Thank you!`
  );
}

export function formatMonthLabel(month) {
  const [year, mon] = month.split('-');
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

export function formatDateLabel(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
