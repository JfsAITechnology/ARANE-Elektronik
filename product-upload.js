/* JFS AI — load subscription guard before tenant features */
(function loadSubscriptionGuard() {
  window.JFS_SUPABASE_URL = 'https://evtkeyfjgqwarsmlzrkh.supabase.co';
  window.JFS_SUPABASE_KEY = 'sb_publishable_7lGio_RVVgkVASYYyBHQIg_GvL-8ELD';

  const script = document.createElement('script');
  script.src = 'subscription-guard.js';
  script.onload = function () {
    if (typeof window.JFS_CHECK_SUBSCRIPTION === 'function') {
      window.JFS_CHECK_SUBSCRIPTION().then(function (active) {
        if (active) {
          window.dispatchEvent(new CustomEvent('jfs:subscription-active'));
        }
      }).catch(function (err) {
        console.error('[JFS Subscription Guard]', err);
      });
    }
  };
  script.onerror = function () {
    console.error('[JFS Subscription Guard] Gagal memuat guard.');
  };
  document.head.appendChild(script);
})();

/* ARANE Elektronik - Supabase product photo integration */
(() => {
  const TENANT_ID = '661ae9a0-06c6-457a-a51f-a2c15f85ae89';
  const BUCKET = 'product-images';
  let selectedFile = null;
  let editingProduct = null;
  let originalOpenModal = null;
  let originalDeleteProduct = null;
  let integrationInstalled = false;

  const $ = id => document.getElementById(id);

  async function ensureAnonymousSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) return session;
    const { data, error } = await supabaseClient.auth.signInAnonymously();
    if (error) throw new Error('Supabase login anonim gagal: ' + error.message);
    return data.session;
  }

  function ensurePhotoFields() {
    const old = $('fImage');
    if (!old || $('fImageFile')) return;
    const wrap = old.parentElement;
    wrap.innerHTML = `
      <label>📷 Foto Produk</label>
      <input id="fImage" type="hidden">
      <input id="fImagePath" type="hidden">
      <input id="fImageFile" type="file" accept="image/jpeg,image/png,image/webp">
      <div id="imagePreviewBox" style="display:none;margin-top:10px;text-align:center">
        <img id="imagePreview" style="max-width:240px;max-height:180px;object-fit:contain;border-radius:10px;border:1px solid var(--line);padding:5px;background:#fff">
        <div class="actions" style="justify-content:center;margin-top:8px">
          <button type="button" class="btn" id="replaceImageBtn">🔄 Ganti Foto</button>
          <button type="button" class="btn danger" id="removeImageBtn">🗑️ Hapus Foto</button>
        </div>
      </div>
      <div id="imageStatus" class="dark-note" style="font-size:12px;margin-top:8px">JPG, PNG, WEBP • Maks. 5 MB</div>`;
    const fileInput = $('fImageFile');
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
        fileInput.value = '';
        return alert('Gunakan JPG, PNG, atau WEBP.');
      }
      if (file.size > 5 * 1024 * 1024) {
        fileInput.value = '';
        return alert('Ukuran foto maksimal 5 MB.');
      }
      selectedFile = file;
      $('imagePreview').src = URL.createObjectURL(file);
      $('imagePreviewBox').style.display = 'block';
      $('imageStatus').textContent = 'Foto siap diupload saat Anda klik Simpan Barang.';
    });
    $('replaceImageBtn').onclick = () => fileInput.click();
    $('removeImageBtn').onclick = () => {
      selectedFile = null;
      fileInput.value = '';
      $('fImage').value = '';
      $('fImagePath').value = '';
      $('imagePreview').removeAttribute('src');
      $('imagePreviewBox').style.display = 'none';
      $('imageStatus').textContent = 'Foto dihapus dari pilihan.';
    };
  }

  function showPhoto(url, path) {
    $('fImage').value = url || '';
    $('fImagePath').value = path || '';
    if (url) {
      $('imagePreview').src = url;
      $('imagePreviewBox').style.display = 'block';
      $('imageStatus').textContent = 'Foto produk tersimpan.';
    } else {
      $('imagePreview').removeAttribute('src');
      $('imagePreviewBox').style.display = 'none';
      $('imageStatus').textContent = 'Belum ada foto produk.';
    }
  }

  async function upsertSupabaseProduct(p) {
    const { data: existing, error: findError } = await supabaseClient
      .from('products').select('id,image_url,image_path')
      .eq('tenant_id', TENANT_ID).eq('sku', p.sku).maybeSingle();
    if (findError) throw findError;

    const payload = {
      tenant_id: TENANT_ID,
      sku: p.sku || null,
      name: p.name || 'Produk Elektronik',
      category: p.cat || null,
      brand: p.brand || null,
      model: p.model || null,
      description: p.defect || null,
      price: Number(p.price || 0),
      image_url: p.image || null,
      image_path: p.image_path || null,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      const { data, error } = await supabaseClient.from('products').update(payload).eq('id', existing.id).select('id,image_url,image_path').single();
      if (error) throw error;
      return data;
    }

    const { data, error } = await supabaseClient.from('products').insert(payload).select('id,image_url,image_path').single();
    if (error) throw error;
    return data;
  }

  async function uploadImage(productId) {
    if (!selectedFile) return null;
    await ensureAnonymousSession();
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const filePath = `arane/${productId}-${Date.now()}.${ext}`;
    $('imageStatus').textContent = '⏳ Mengupload foto...';
    const { error } = await supabaseClient.storage.from(BUCKET).upload(filePath, selectedFile, {
      cacheControl: '3600', upsert: false, contentType: selectedFile.type
    });
    if (error) throw error;
    const { data } = supabaseClient.storage.from(BUCKET).getPublicUrl(filePath);
    return { url: data.publicUrl, path: filePath };
  }

  function installIntegration() {
    if (integrationInstalled) return true;
    if (typeof window.openModal !== 'function' || typeof window.closeModal !== 'function') {
      console.warn('ARANE upload: fungsi modal belum siap.');
      return false;
    }

    integrationInstalled = true;
    originalOpenModal = window.openModal;
    originalDeleteProduct = window.deleteProduct;

    window.openModal = function(p = null) {
      editingProduct = p;
      selectedFile = null;
      originalOpenModal(p);
      ensurePhotoFields();
      showPhoto(p?.image || '', p?.image_path || '');
      $('fImageFile').value = '';
    };

    if (typeof originalDeleteProduct === 'function') {
      window.deleteProduct = async function(id) {
        const p = Array.isArray(window.products) ? window.products.find(x => x.id === id) : null;
        if (p && p.image_path) {
          try {
            await ensureAnonymousSession();
            await supabaseClient.storage.from(BUCKET).remove([p.image_path]);
          } catch(e) { console.warn('Supabase image delete:', e); }
        }
        return originalDeleteProduct(id);
      };
    }

    window.saveProduct = async function() {
      const oldBtn = document.querySelector('#modal .modalfoot .btn.primary');
      if (oldBtn) { oldBtn.disabled = true; oldBtn.textContent = 'Menyimpan...'; }
      try {
        const p = {
          id: editingProduct?.id || Date.now(),
          cat: $('fCat').value,
          brand: $('fBrand').value,
          name: $('fName').value || 'Produk Elektronik',
          model: $('fModel').value,
          sku: $('fSku').value || ('ARANE-' + Date.now()),
          grade: $('fGrade').value,
          func: $('fFunc').value,
          qty: Math.max(0, Number($('fQty').value || 0)),
          price: Math.max(0, Number($('fPrice').value || 0)),
          warranty: $('fWarranty').value,
          defectType: $('fDefectType').value,
          defect: $('fDefect').value,
          image: $('fImage').value || '',
          image_path: $('fImagePath').value || ''
        };

        await ensureAnonymousSession();
        let dbProduct = await upsertSupabaseProduct(p);
        if (selectedFile) {
          const uploaded = await uploadImage(dbProduct.id);
          p.image = uploaded.url;
          p.image_path = uploaded.path;
          const { error } = await supabaseClient.from('products').update({ image_url: p.image, image_path: p.image_path, updated_at: new Date().toISOString() }).eq('id', dbProduct.id);
          if (error) throw error;
        }

        const { error: invError } = await supabaseClient.from('inventory').upsert({
          tenant_id: TENANT_ID,
          product_id: dbProduct.id,
          quantity: p.qty,
          condition: p.defectType || 'Baik',
          grade: p.grade,
          stock_status: p.qty > 0 ? 'Tersedia' : 'Habis',
          updated_at: new Date().toISOString()
        }, { onConflict: 'product_id' });
        if (invError) throw invError;

        if (editingProduct) products = products.map(x => x.id === editingProduct.id ? p : x);
        else products.push(p);
        save(); render(); closeModal();
        alert('✅ Barang dan foto berhasil disimpan ke Supabase.');
      } catch (e) {
        console.error(e);
        alert('Gagal menyimpan: ' + (e.message || e));
      } finally {
        if (oldBtn) { oldBtn.disabled = false; oldBtn.textContent = 'Simpan Barang'; }
      }
    };
    return true;
  }

  function waitForTenantFunctions(attempt = 0) {
    if (installIntegration()) return;
    if (attempt >= 50) {
      console.warn('ARANE upload: fungsi tenant belum siap setelah menunggu.');
      return;
    }
    setTimeout(() => waitForTenantFunctions(attempt + 1), 100);
  }

  function startWhenSubscriptionIsActive() {
    waitForTenantFunctions();
  }

  window.addEventListener('jfs:subscription-active', startWhenSubscriptionIsActive);

  if (window.ARANE_SUBSCRIPTION && window.ARANE_SUBSCRIPTION.status === 'active') {
    startWhenSubscriptionIsActive();
  }
})();