/* ARANE Elektronik — JFS AI Subscription Guard
   Source of truth: Supabase RPC get_my_tenant_subscription
   end_date is INCLUSIVE.
*/
(function () {
  const TENANT_ID =
    '661ae9a0-06c6-457a-a51f-a2c15f85ae89';

  const SUPABASE_URL =
    window.JFS_SUPABASE_URL ||
    'https://evtkeyfjgqwarsmlzrkh.supabase.co';

  const SUPABASE_KEY =
    window.JFS_SUPABASE_KEY ||
    'sb_publishable_7lGio_RVVgkVASYYyBHQIg_GvL-8ELD';

  const LOCK_ID = 'jfs-subscription-lock';

  function renderLock(reason, subscription) {
    if (document.getElementById(LOCK_ID)) return;

    const lock = document.createElement('div');

    lock.id = LOCK_ID;

    lock.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:2147483647',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'padding:24px',
      'background:linear-gradient(135deg,#061222,#0d2746)',
      'color:#fff',
      'font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial'
    ].join(';');

    const card = document.createElement('div');

    card.style.cssText =
      'width:min(520px,100%);' +
      'text-align:center;' +
      'background:#fff;' +
      'color:#172033;' +
      'border-radius:20px;' +
      'padding:34px;' +
      'box-shadow:0 20px 60px rgba(0,0,0,.28)';

    const title = document.createElement('h1');

    title.textContent =
      '🔒 Akses Dinonaktifkan';

    title.style.margin =
      '0 0 12px';

    const text = document.createElement('p');

    text.textContent =
      reason ||
      'Masa akses layanan telah berakhir.';

    text.style.cssText =
      'line-height:1.6;' +
      'color:#68758b;' +
      'margin:0 0 20px';

    const sub = document.createElement('p');

    sub.textContent =
      subscription &&
      subscription.end_date
        ? 'Masa akses berakhir pada ' +
          subscription.end_date +
          '.'
        : 'Silakan hubungi JFS AI Technology untuk mengaktifkan kembali layanan.';

    sub.style.cssText =
      'font-size:13px;' +
      'color:#68758b;' +
      'margin:0 0 22px';

    const btn = document.createElement('a');

    btn.href =
      'https://wa.me/6282230010172';

    btn.target = '_blank';

    btn.rel = 'noopener';

    btn.textContent =
      'Hubungi JFS AI Technology';

    btn.style.cssText =
      'display:inline-block;' +
      'background:#087cf0;' +
      'color:#fff;' +
      'text-decoration:none;' +
      'padding:11px 18px;' +
      'border-radius:10px;' +
      'font-weight:700';

    card.append(
      title,
      text,
      sub,
      btn
    );

    lock.appendChild(card);

    function mount() {
      if (document.body) {
        document.body.appendChild(lock);
        document.documentElement.style.overflow =
          'hidden';
      } else {
        document.addEventListener(
          'DOMContentLoaded',
          mount,
          { once: true }
        );
      }
    }

    mount();
  }

  function getLocalDateString() {
    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        now.getDate()
      ).padStart(2, '0');

    return (
      year +
      '-' +
      month +
      '-' +
      day
    );
  }

  function isDateExpired(endDate) {
    if (!endDate) {
      return true;
    }

    const today =
      getLocalDateString();

    const end =
      String(endDate).slice(
        0,
        10
      );

    /*
      end_date bersifat INCLUSIVE.

      Contoh:

      end_date = 2026-08-15

      15 Agustus 2026
      = MASIH AKTIF

      16 Agustus 2026
      = EXPIRED
    */

    return today > end;
  }

  async function checkSubscription() {
    try {

      /*
       * Pastikan library Supabase tersedia.
       */

      if (
        !window.supabase ||
        !window.supabase.createClient
      ) {
        throw new Error(
          'Supabase library belum tersedia'
        );
      }

      /*
       * Buat Supabase client.
       */

      const client =
        window.supabase.createClient(
          SUPABASE_URL,
          SUPABASE_KEY
        );

      /*
       * Pastikan user sudah login.
       *
       * Ini penting karena RPC menggunakan
       * auth.uid() untuk memastikan Owner ARANE.
       */

      const {
        data: sessionData,
        error: sessionError
      } = await client.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (
        !sessionData ||
        !sessionData.session ||
        !sessionData.session.user
      ) {
        throw new Error(
          'Owner belum login'
        );
      }

      /*
       * Panggil RPC.
       *
       * RPC akan memeriksa:
       *
       * auth.uid()
       *       ↓
       * tenant_users
       *       ↓
       * owner/admin ARANE
       *       ↓
       * tenant_subscriptions
       */

      const {
        data,
        error
      } = await client.rpc(
        'get_my_tenant_subscription',
        {
          p_tenant_id:
            TENANT_ID
        }
      );

      if (error) {
        throw error;
      }

      /*
       * RPC RETURNS TABLE sehingga
       * Supabase biasanya mengembalikan array.
       */

      const subscription =
        Array.isArray(data)
          ? data[0]
          : data;

      /*
       * Tidak ada subscription aktif.
       */

      if (!subscription) {

        renderLock(
          'Tidak ditemukan akses aktif untuk tenant ARANE Elektronik.'
        );

        return false;
      }

      /*
       * Cek tanggal berakhir.
       */

      if (
        isDateExpired(
          subscription.end_date
        )
      ) {

        renderLock(
          'Masa trial atau subscription ARANE Elektronik telah berakhir.',
          subscription
        );

        return false;
      }

      /*
       * Subscription valid.
       */

      window.ARANE_SUBSCRIPTION =
        subscription;

      /*
       * Simpan informasi tenant
       * agar dapat digunakan modul lain
       * bila diperlukan.
       */

      window.ARANE_TENANT_ID =
        TENANT_ID;

      return true;

    } catch (err) {

      console.error(
        '[JFS Subscription Guard]',
        err
      );

      renderLock(
        'Akses tidak dapat diverifikasi. Silakan hubungi JFS AI Technology.'
      );

      return false;
    }
  }

  /*
   * Expose function agar modul lain
   * seperti product-upload.js dapat
   * menjalankan pemeriksaan subscription.
   */

  window.JFS_CHECK_SUBSCRIPTION =
    checkSubscription;

  /*
   * Jalankan pemeriksaan otomatis.
   */

  function startGuard() {

    if (
      !window.ARANE_SUBSCRIPTION
    ) {
      checkSubscription();
    }
  }

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      startGuard,
      { once: true }
    );

  } else {

    startGuard();

  }

})();
