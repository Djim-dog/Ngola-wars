-- Pedidos de saque (levantamento)
-- Minimo: 2000 Kz

CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 2000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'paid', 'rejected'
  )),
  bank_name TEXT,
  iban TEXT,
  account_holder TEXT,
  admin_id UUID REFERENCES public.profiles(id),
  admin_note TEXT,
  paid_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdraw_user ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_status ON public.withdrawal_requests(status);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Saques proprios leitura" ON public.withdrawal_requests;
CREATE POLICY "Saques proprios leitura"
  ON public.withdrawal_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = '174a8d75-9353-4559-b9af-97f4b1f5676e'
  );

DROP POLICY IF EXISTS "Saques proprios insert" ON public.withdrawal_requests;
CREATE POLICY "Saques proprios insert"
  ON public.withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin atualiza saques" ON public.withdrawal_requests;
CREATE POLICY "Admin atualiza saques"
  ON public.withdrawal_requests FOR UPDATE
  USING (auth.uid() = '174a8d75-9353-4559-b9af-97f4b1f5676e');
