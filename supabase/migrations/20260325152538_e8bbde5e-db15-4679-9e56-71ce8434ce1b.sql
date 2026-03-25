
-- Create clinician_availability table
CREATE TABLE public.clinician_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinician_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinician_availability ENABLE ROW LEVEL SECURITY;

-- Clinicians can CRUD their own availability
CREATE POLICY "Clinicians can view own availability"
  ON public.clinician_availability FOR SELECT
  TO authenticated
  USING (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can insert own availability"
  ON public.clinician_availability FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can update own availability"
  ON public.clinician_availability FOR UPDATE
  TO authenticated
  USING (auth.uid() = clinician_id);

CREATE POLICY "Clinicians can delete own availability"
  ON public.clinician_availability FOR DELETE
  TO authenticated
  USING (auth.uid() = clinician_id);

-- Patients can view all availability (needed for slot picker)
CREATE POLICY "Anyone can view availability"
  ON public.clinician_availability FOR SELECT
  TO authenticated
  USING (true);

-- Add report_pdf column to cases table
ALTER TABLE public.cases ADD COLUMN report_pdf TEXT;

-- Clinicians can insert cases
CREATE POLICY "Clinicians can insert cases"
  ON public.cases FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = clinician_id);

-- Create is_slot_available function
CREATE OR REPLACE FUNCTION public.is_slot_available(
  _clinician_id UUID,
  _appointment_date TIMESTAMP WITH TIME ZONE
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.appointments
    WHERE clinician_id = _clinician_id
      AND status IN ('pending', 'confirmed')
      AND appointment_date = _appointment_date
  )
$$;
