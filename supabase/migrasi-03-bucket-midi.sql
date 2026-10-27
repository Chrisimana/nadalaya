-- Migrasi 03: bucket "midi" hanya menerima berkas MIDI. Jalankan setelah migrasi 02 (aman dijalankan ulang).
update storage.buckets
   set allowed_mime_types = array['audio/midi', 'audio/mid', 'audio/x-midi'],
       file_size_limit = 1048576,
       public = false
 where id = 'midi';
