# JFS AI Subscription Admin — Supabase Setup

## 1. Jalankan SQL

Buka Supabase project ARANE → **SQL Editor** → buat query baru → salin seluruh isi `supabase/subscription-management.sql` → Run.

SQL ini membuat `jfs_admins` dan RLS untuk `jfs_admins`, `tenants`, dan `tenant_subscriptions`.

## 2. Buat akun admin

Di Supabase buka **Authentication → Users → Add user**.

Buat akun khusus admin JFS AI. Contoh:

- Email: gunakan email admin JFS AI milik Anda
- Password: gunakan password kuat yang tidak dipakai di tempat lain

Jika Supabase meminta email confirmation, selesaikan verifikasi sesuai pengaturan project.

## 3. Ambil User UID

Setelah user dibuat, salin **User UID** dari Authentication → Users.

Lalu di SQL Editor jalankan:

```sql
insert into public.jfs_admins(user_id)
values ('GANTI-DENGAN-USER-UID-ADMIN');
```

Jalankan hanya sekali untuk user tersebut.

## 4. Uji login

Setelah PR admin di-merge ke `main`, halaman admin tersedia di:

`https://jfsaittechnology.github.io/ARANE-Elektronik/admin/subscription-management.html`

Login menggunakan email/password Supabase Auth yang sudah dimasukkan ke `jfs_admins`.

## 5. Aktivasi ARANE setelah DP

Tenant ARANE memakai ID:

`661ae9a0-06c6-457a-a51f-a2c15f85ae89`

Di dashboard pilih **Aktifkan / Perpanjang**, gunakan paket 3, 6, atau 12 bulan, lalu simpan.

Untuk subscription baru/expired, sistem memulai dari tanggal hari ini. Untuk subscription yang masih aktif, sistem melanjutkan dari `end_date` yang sedang aktif.

## 6. Perilaku website tenant

Website tenant membaca `tenant_subscriptions` secara langsung. `end_date` bersifat exclusive: jika `end_date = 2026-08-15`, akses terkunci mulai 15 Agustus 2026.

## Keamanan

Jangan masukkan `service_role` key ke HTML/JavaScript. Frontend hanya boleh menggunakan publishable/anon key. Password admin hanya digunakan melalui Supabase Auth.
