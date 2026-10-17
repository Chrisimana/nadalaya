-- Data awal materi. Jalankan setelah schema.sql. tingkat: 1 dasar, 2 menengah, 3 mahir.

insert into public.materi_latihan (id, judul, jenis, tingkat, is_premium, tempo_bpm, midi_path)
values
  ('0b6f1c2a-1d4e-4c1a-9a01-000000000001', 'Tangga Nada Do Mayor',  'tangga_nada', 1, false, 90, 'do-mayor.mid'),
  ('0b6f1c2a-1d4e-4c1a-9a01-000000000002', 'Tangga Nada La Minor',  'tangga_nada', 1, false, 90, 'la-minor.mid'),
  ('0b6f1c2a-1d4e-4c1a-9a01-000000000003', 'Interval Terts Mayor',  'interval',    1, true,  80, 'interval-terts-mayor.mid'),
  ('0b6f1c2a-1d4e-4c1a-9a01-000000000004', 'Interval Kuint Murni',  'interval',    2, true,  80, 'interval-kuint-murni.mid'),
  ('0b6f1c2a-1d4e-4c1a-9a01-000000000005', 'Melodi Pendek Pagi Hari', 'melodi',    2, true,  96, 'melodi-pagi-hari.mid')
on conflict (id) do update
  set judul      = excluded.judul,
      jenis      = excluded.jenis,
      tingkat    = excluded.tingkat,
      is_premium = excluded.is_premium,
      tempo_bpm  = excluded.tempo_bpm,
      midi_path  = excluded.midi_path;
