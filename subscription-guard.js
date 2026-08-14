/* ARANE Elektronik — JFS AI Subscription Guard
   Source of truth: Supabase tenant_subscriptions
*/
(function () {
  const TENANT_ID = '661ae9a0-06c6-457a-a51f-a2c15f85ae89';
  const LOCK_ID = 'jfs-subscription-lock';

  function lockPage(reason, subscription) {
    if (document.getElementById(LOCK_ID)) return;
    const lock = document.createElement('div');
    lock.id = LOCK_ID;
    lock.style.cssText = [
      'position:fixed','inset:0','z-index:2147483647','display:flex',
      'align-items:center','justify-content:center','padding:24px',
      'background:linear-gradient(135deg,#061222,#0d2746)',
      'color:#fff','font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial'
    ].join(';');
    const card = document.createElement('div');
    card.style.cssText = 'width:min(520px,100%);text-align:center;background:#fff;color:#172033;border-radius:20px;padding:34px;box-shadow:0 20px 60px rgba(0,0,0,.28)';
    const title = document.createElement('h1');
    title.textContent = '🔒 Akses Dinonaktifkan';
    title.style.margin = '0 0 12px';
    const text = document.createElement('p');
    text.textContent = reason || 'Masa akses layanan telah berakhir.';
    text.style.cssText = 'line-height:1.6;color:#68758b;margin:0 0 20px';
    const sub = document.createElement('p');
    sub.textContent = subscription && subscription.end_date ? 'Masa akses berakhir pada ' + subscription.end_date + '.' : 'Silakan hubungi JFS AI Technology untuk mengaktifkan kembali layanan.';
    sub.style.cssText = 'font-size:13px;color:#68758b;margin:0 0 22px';
    const btn = document.createElement('a');
    btn.href = 'https://wa.me/6280000000000';
    btn.target = '_blank';
    btn.rel = 'noopener';
    btn.textContent = 'Hubungi JFS AI Technology';
    btn.style.cssText = 'display:inline-block;background:#087cf0;color:#fff;text-decoration:none;padding:11px 18px;border-radius:10px;font-weight:700';
    card.append(title, text, sub, btn);
    lock.appendChild(card);
    document.body.appendChild(lock);
    document.documentElement.style.overflow = 'hidden';
  }

  function isDateExpired(endDate) {
    if (!endDate) return true;
    // end_date is exclusive: access is valid before the end date.
    const end = new Date(endDate + 'T00:00:00');
    const now = new Date();
    return now >= end;
  }

  async function checkSubscription() {
    try {
      if (!window.supabase || !window.supabase.createClient) {
        throw new Error('Supabase library belum tersedia');
      }
      const client = window.supabase.createClient(window.JFS_SUPABASE_URL, window.JFS_SUPABASE_KEY);
      const { data, error } = await client
        .from('tenant_subscriptions')
        .select('id,tenant_id,plan_id,start_date,end_date,status,amount,created_at')
        .eq('tenant_id', TENANT_ID)
        .in('status', ['active','pending'])
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        lockPage('Tidak ditemukan akses aktif untuk tenant ARANE Elektronik.');
        return false;
      }

      if (data.status !== 'active' || isDateExpired(data.end_date)) {
        lockPage('Masa trial atau subscription ARANE Elektronik telah berakhir.');
        return false;
      }

      window.ARANE_SUBSCRIPTION = data;
      return true;
    } catch (err) {
      console.error('[JFS Subscription Guard]', err);
      // Fail closed: if the subscription cannot be verified, do not expose the tenant app.
      lockPage('Akses tidak dapat diverifikasi. Silakan hubungi JFS AI Technology.');
      return false;
    }
  }

  window.JFS_CHECK_SUBSCRIPTION = checkSubscription;
  document.addEventListener('DOMContentLoaded', checkSubscription);
})();
