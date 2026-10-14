-- Depositos manuais + primeira batalha

CREATE TABLE IF NOT EXISTS public.deposit_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  bank_code TEXT NOT NULL CHECK (bank_code IN ('millennium', 'yetu')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'under_review', 'confirmed', 'rejected'
  )),
  proof_path TEXT,
  proof_deleted BOOLEAN DEFAULT FALSE,
  admin_id UUID REFERENCES public.profiles(id),
  admin_note TEXT,
  bank_reference TEXT,
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deposit_user ON public.deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_status ON public.deposit_requests(status);

ALTER TABLE public.deposit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Depositos proprios leitura" ON public.deposit_requests;
CREATE POLICY "Depositos proprios leitura"
  ON public.deposit_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Depositos proprios insert" ON public.deposit_requests;
CREATE POLICY "Depositos proprios insert"
  ON public.deposit_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Flag de primeira batalha no perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_battle_done BOOLEAN DEFAULT FALSE;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_battle_won BOOLEAN DEFAULT FALSE;
