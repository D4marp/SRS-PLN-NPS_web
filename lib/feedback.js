function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeList(items) {
  const output = [];
  const seen = new Set();

  (Array.isArray(items) ? items : []).forEach((item) => {
    const normalized = normalizeText(item);
    if (!normalized) return;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    output.push(normalized);
  });

  return output;
}

function findRoomByBooking(booking, rooms) {
  if (!booking?.roomId || !Array.isArray(rooms)) return null;
  return rooms.find((room) => room?.id === booking.roomId) || null;
}

export function getRoomFacilitiesForBooking(booking, rooms) {
  const room = findRoomByBooking(booking, rooms);
  return normalizeList(room?.amenities);
}

export function getSelectedComplaintSet(booking) {
  const complaintItems = booking?.feedback?.complaintItems;
  return new Set(normalizeList(complaintItems).map((item) => item.toLowerCase()));
}

export function getFeedbackLabel(booking) {
  if (!booking?.feedback) return '-';
  return booking.feedback.satisfactionLevel === 'satisfied' ? 'Puas' : 'Tidak Puas';
}

export function getFeedbackExportColumns(bookings, rooms) {
  const facilityColumns = [];
  const seen = new Set();

  (Array.isArray(rooms) ? rooms : []).forEach((room) => {
    normalizeList(room?.amenities).forEach((facility) => {
      const key = facility.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      facilityColumns.push(facility);
    });
  });

  if (facilityColumns.length === 0) {
    (Array.isArray(bookings) ? bookings : []).forEach((booking) => {
      normalizeList(booking?.feedback?.complaintItems).forEach((facility) => {
        const key = facility.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        facilityColumns.push(facility);
      });
    });
  }

  return facilityColumns;
}

export function buildFeedbackExportRows(bookings, rooms) {
  const facilityColumns = getFeedbackExportColumns(bookings, rooms);

  const rows = (Array.isArray(bookings) ? bookings : []).map((booking) => {
    const selectedSet = getSelectedComplaintSet(booking);
    const row = {
      Ruangan: booking.roomName || '-',
      'Tanggal Booking': booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('id-ID') : '-',
      'Jam Check-in': booking.checkInTime || '-',
      'Jam Check-out': booking.checkOutTime || '-',
      Status: booking.status || '-',
      Feedback: getFeedbackLabel(booking),
      Pengguna: booking.userName || '-',
      Email: booking.userEmail || '-',
      Untuk: booking.bookedForName || '-',
      'Instansi / Perusahaan': booking.bookedForCompany || '-',
      'Jumlah Tamu': booking.numberOfGuests || '-',
      Tujuan: booking.purpose || '-',
      'Keluhan Terpilih': Array.isArray(booking?.feedback?.complaintItems) && booking.feedback.complaintItems.length > 0
        ? booking.feedback.complaintItems.join(', ')
        : '-',
      Lainnya: booking?.feedback?.complaintOther || '-',
    };

    facilityColumns.forEach((facility) => {
      if (!booking?.feedback) {
        row[facility] = '-';
        return;
      }

      row[facility] = selectedSet.has(facility.toLowerCase()) ? 'v' : 'x';
    });

    return row;
  });

  return { rows, facilityColumns };
}
