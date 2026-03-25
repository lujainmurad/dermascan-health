

# Complete Booking System Implementation Plan

## Overview

Build the full booking system across 7 tasks: database migration, clinician availability management, slot-based booking, auto-save analysis cases, patient history page, enhanced appointments pages, and email notifications.

---

## 1. Database Migration

Single migration to add:

- **`clinician_availability` table**: `id`, `clinician_id` (uuid), `day_of_week` (int 0-6), `start_time` (time), `end_time` (time), `created_at`. RLS: clinicians CRUD own rows, patients can SELECT all.
- **`report_pdf` column** on `cases` table (text, nullable) for storing base64 PDF.
- **`is_slot_available` function** (SECURITY DEFINER): checks no existing pending/confirmed appointment for a clinician at a given timestamp. Returns boolean.
- **Clinicians can insert cases** RLS policy on `cases` table (currently only patients can insert).

---

## 2. Clinician Availability Management (Settings.tsx)

Add an "Availability" section below existing clinician fields in Settings:
- Dropdown for day of week, start time picker, end time picker (1-hour increments: 08:00-18:00).
- "Add" button to save a row to `clinician_availability`.
- Display current availability as a list with delete buttons.
- Fetches and manages `clinician_availability` rows for the logged-in clinician.

---

## 3. Slot-Based Booking (BookAppointment.tsx)

Replace free-form date/time inputs with:
1. Clinician dropdown (keep existing).
2. Calendar date picker (shadcn Calendar in Popover with `pointer-events-auto`).
3. After selecting a date, fetch clinician's `clinician_availability` for that day_of_week, generate 1-hour slot buttons.
4. Query existing appointments for that clinician+date to grey out booked slots.
5. Patient clicks an available slot to book.
6. After successful insert, trigger email notification (see step 7).

---

## 4. Find Specialist Page (FindSpecialist.tsx)

- Fetch availability data alongside clinician profiles.
- For clinicians with availability set: show days available (e.g., "Mon, Wed, Fri") and link to booking page.
- For clinicians without availability: show "Contact to schedule" text instead of "Book Appointment" button. Do NOT hide these clinicians.

---

## 5. Auto-Save Clinician Analysis (clinician/Analyze.tsx)

After successful analysis:
1. Upload original image to `case-images` storage bucket.
2. Insert row into `cases` with: `clinician_id`, `image_url` (storage URL), `overlay_image_url` (base64 from result), `prediction_label`, `confidence`, `features_summary`, `report_pdf` (base64 from result).
3. `patient_id` left as a required field -- since the clinician may not have a patient linked, we need to handle this. The clinician will optionally select a patient from a dropdown of their appointment patients before or after analysis.
4. Show toast confirming save.
5. Download Report filename uses date: `dermascan_report_YYYY-MM-DD.pdf`.

**Note**: Since `patient_id` is NOT NULL on `cases`, the clinician must select a patient to save the case. Add a patient selector dropdown (populated from the clinician's appointment patients) that appears before the save happens.

---

## 6. Patient History Page (clinician/PatientHistory.tsx)

New page at `/clinician/patient/:patientId`:
- **Back button** uses `navigate('/clinician/appointments')` (not browser history).
- **Patient header**: Name, email from profiles.
- **Appointments section**: All appointments between this clinician and patient, with date, status, notes.
- **Cases section**: Only cases where `clinician_id = auth.uid()` AND `patient_id = :patientId` (skip cases with no patient_id). Each case card shows:
  - Original + overlay images side by side
  - Feature summary grid (10 values with labels)
  - Prediction, confidence
  - Download Report button: if `report_pdf` exists, decode base64 and download as `dermascan_report_YYYY-MM-DD.pdf` using `created_at` date. Otherwise show "No report available".

Update `clinician/Appointments.tsx`: make patient names clickable `Link` to `/clinician/patient/${a.patient_id}`.

Add route in `App.tsx`.

---

## 7. Enhanced Appointment Pages

**Clinician Appointments**: Add filter tabs (All / Upcoming / Past). Patient names become links to patient history.

**Patient Appointments**: Add cancel button for pending appointments (update status to 'cancelled').

---

## 8. Email Notification on Booking

Use Lovable Cloud's built-in email infrastructure:
1. Check email domain status and set up if needed.
2. Scaffold a transactional email template `booking-notification` with: patient name, date/time, notes, CTA to appointments page.
3. After successful booking in `BookAppointment.tsx`, invoke `send-transactional-email` edge function with clinician's email and booking details.

---

## File Changes Summary

| File | Action |
|------|--------|
| Migration SQL | New table + column + function + RLS |
| `Settings.tsx` | Add availability management section |
| `BookAppointment.tsx` | Replace with calendar + slot picker + email trigger |
| `FindSpecialist.tsx` | Show availability info; show unscheduled clinicians with "Contact to schedule" |
| `clinician/Analyze.tsx` | Auto-save case with patient selector + date-based report filename |
| `clinician/PatientHistory.tsx` | **New page** |
| `clinician/Appointments.tsx` | Clickable patient names + filter tabs |
| `patient/Appointments.tsx` | Add cancel button |
| `App.tsx` | Add `/clinician/patient/:patientId` route |
| Email template + infra | Transactional booking notification |

All existing pages, routes, and functionality remain unchanged.

