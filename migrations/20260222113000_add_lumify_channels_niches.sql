-- Add Lumify channel niches for manual prospecting

INSERT INTO public.niches (id, label, is_active)
VALUES
  ('reddit', 'Reddit', true),
  ('youtube', 'Youtube', true),
  ('instagram', 'Instagram', true),
  ('facebook', 'Facebook', true),
  ('twitter', 'Twitter', true),
  ('lp', 'LP', true),
  ('ommigle', 'Ommigle', true),
  ('grupos', 'Grupos', true),
  ('outros', 'Outros', true)
ON CONFLICT (id) DO UPDATE
SET label = EXCLUDED.label, is_active = EXCLUDED.is_active;

INSERT INTO public.nichos (id, label)
VALUES
  ('reddit', 'Reddit'),
  ('youtube', 'Youtube'),
  ('instagram', 'Instagram'),
  ('facebook', 'Facebook'),
  ('twitter', 'Twitter'),
  ('lp', 'LP'),
  ('ommigle', 'Ommigle'),
  ('grupos', 'Grupos'),
  ('outros', 'Outros')
ON CONFLICT (id) DO UPDATE
SET label = EXCLUDED.label;
