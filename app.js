/* ================================================================
   DASHBOARD PENDAFTARAN IPPEX PROJEK AKHIR JKM PSAS
   app.js
   ================================================================ */
'use strict';

// ── Konstanta ──────────────────────────────────────────────────
const STORAGE_KEY = 'ippex_jkm_psas_projek';

// ── Utiliti: localStorage ──────────────────────────────────────
function muatData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { return []; }
}
function simpanData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ── Utiliti: kira isipadu ──────────────────────────────────────
function kiraIsipadu(p, l, t) {
  return Math.round(parseFloat(p) * parseFloat(l) * parseFloat(t) * 100) / 100;
}

// ── Utiliti: format nombor ─────────────────────────────────────
function fmtNombor(n) {
  return Number(n).toLocaleString('ms-MY', { maximumFractionDigits: 2 });
}

// ── Utiliti: escape HTML ───────────────────────────────────────
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Utiliti: jana ID unik ──────────────────────────────────────
function janaId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── TOAST ──────────────────────────────────────────────────────
let toastTimer = null;
function tunjukToast(msg, jenis = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show ${jenis}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = 'toast'; }, 3200);
}

// ── STAT CARDS ─────────────────────────────────────────────────
function kemaskinStats() {
  const data = muatData();
  const jumlahPelajar  = data.reduce((acc, p) => acc + p.ahli.length, 0);
  const senaraiPenyelia = [...new Set(data.map(p => p.penyelia.trim().toLowerCase()))];
  const terbesar       = data.length
    ? [...data].sort((a, b) => b.isipadu - a.isipadu)[0].tajuk
    : '—';

  document.getElementById('statJumlah').textContent  = data.length;
  document.getElementById('statAhli').textContent    = jumlahPelajar;
  document.getElementById('statPenyelia').textContent = senaraiPenyelia.length;
  document.getElementById('statTop').textContent     = data.length ? terbesar : '—';
}

// ── RENDER JADUAL ──────────────────────────────────────────────
function renderJadual(filterTeks = '') {
  const semua   = muatData();
  const tbody   = document.getElementById('tbodyJadual');
  const tiada   = document.getElementById('tiadaProjek');
  const wrapper = document.getElementById('tableWrapper');

  // Isih: isipadu terbesar → terkecil
  const disusun = [...semua].sort((a, b) => b.isipadu - a.isipadu);

  // Tapis berdasarkan carian
  const carian = filterTeks.trim().toLowerCase();
  const dipapar = carian
    ? disusun.filter(p =>
        p.tajuk.toLowerCase().includes(carian) ||
        p.penyelia.toLowerCase().includes(carian) ||
        p.ahli.some(a =>
          a.nama.toLowerCase().includes(carian) ||
          a.noPendaftaran.toLowerCase().includes(carian)
        )
      )
    : disusun;

  // Tiada data
  if (dipapar.length === 0) {
    tiada.hidden  = false;
    wrapper.hidden = true;
    tiada.querySelector('p').textContent = carian
      ? `⚠️ Tiada projek sepadan dengan carian "${filterTeks}".`
      : '⚠️ Tiada projek berdaftar. Sila isi borang di atas.';
    kemaskinStats();
    return;
  }

  tiada.hidden  = true;
  wrapper.hidden = false;

  tbody.innerHTML = dipapar.map((proj, i) => {
    const rank = i + 1;
    const badgeCls = rank <= 3 ? `rank-badge rank-${rank}` : 'rank-badge';

    const ahliHtml = proj.ahli.map(a => `
      <li>
        <span class="ahli-nama">${esc(a.nama)}</span><br>
        <span class="ahli-nopend">📋 ${esc(a.noPendaftaran)}</span>
      </li>`).join('');

    return `
      <tr>
        <td class="td-rank"><span class="${badgeCls}">${rank}</span></td>
        <td><span class="tajuk-text">${esc(proj.tajuk)}</span></td>
        <td><span class="dim-text">${proj.panjang} × ${proj.lebar} × ${proj.tinggi}</span></td>
        <td class="th-vol"><span class="vol-text">${fmtNombor(proj.isipadu)}</span></td>
        <td><ul class="ahli-list">${ahliHtml}</ul></td>
        <td><span class="penyelia-text">${esc(proj.penyelia)}</span></td>
        <td><span class="tarikh-text">${esc(proj.tarikhDaftar)}</span></td>
        <td class="no-print">
          <button class="btn-padam" data-id="${proj.id}" title="Padam projek ini">🗑 Padam</button>
        </td>
      </tr>`;
  }).join('');

  kemaskinStats();
}

// ── AHLI KUMPULAN: reset baris ──────────────────────────────────
function resetBabarisAhli() {
  const bekas = document.getElementById('senaraiAhli');
  bekas.innerHTML = `
    <div class="ahli-row" data-idx="0">
      <span class="ahli-num">1</span>
      <input type="text"  class="inp-nama"   placeholder="Nama penuh ahli" required />
      <input type="text"  class="inp-nopend" placeholder="No. Pendaftaran (cth: 23DEM12345)" required />
      <button type="button" class="btn-rm-ahli" disabled title="Buang ahli">✕</button>
    </div>`;
}

// ── AHLI KUMPULAN: kemas kini nombor dan butang buang ──────────
function kemaskinAhli() {
  const rows = document.querySelectorAll('.ahli-row');
  rows.forEach((row, i) => {
    row.querySelector('.ahli-num').textContent     = i + 1;
    row.querySelector('.inp-nama').placeholder     = `Nama penuh ahli ${i + 1}`;
    row.querySelector('.btn-rm-ahli').disabled     = rows.length === 1;
  });
}

// ── AHLI KUMPULAN: tambah baris ────────────────────────────────
function tambahBabarisAhli() {
  const bekas = document.getElementById('senaraiAhli');
  const idx   = bekas.children.length;
  const div   = document.createElement('div');
  div.className  = 'ahli-row';
  div.dataset.idx = idx;
  div.innerHTML = `
    <span class="ahli-num">${idx + 1}</span>
    <input type="text"  class="inp-nama"   placeholder="Nama penuh ahli ${idx + 1}" required />
    <input type="text"  class="inp-nopend" placeholder="No. Pendaftaran" required />
    <button type="button" class="btn-rm-ahli" title="Buang ahli">✕</button>`;
  bekas.appendChild(div);
  kemaskinAhli();
  div.querySelector('.inp-nama').focus();
}

// ── PREVIEW ISIPADU ─────────────────────────────────────────────
function previewIsipadu() {
  const p  = parseFloat(document.getElementById('panjang').value);
  const l  = parseFloat(document.getElementById('lebar').value);
  const t  = parseFloat(document.getElementById('tinggi').value);
  const el = document.getElementById('volPreview');
  if (p > 0 && l > 0 && t > 0) {
    el.textContent = `📐 ${fmtNombor(p * l * t)} cm³`;
  } else {
    el.textContent = '';
  }
}

// ── VALIDASI BORANG ─────────────────────────────────────────────
function validasiBorang() {
  const tajuk   = document.getElementById('tajukProjek').value.trim();
  const panjang = parseFloat(document.getElementById('panjang').value);
  const lebar   = parseFloat(document.getElementById('lebar').value);
  const tinggi  = parseFloat(document.getElementById('tinggi').value);
  const penyelia = document.getElementById('namaPenyelia').value.trim();

  if (!tajuk) {
    tunjukToast('❌ Sila masukkan tajuk projek.', 'error');
    document.getElementById('tajukProjek').focus();
    return null;
  }
  if (!panjang || !lebar || !tinggi || panjang <= 0 || lebar <= 0 || tinggi <= 0) {
    tunjukToast('❌ Sila masukkan saiz dimensi yang sah (> 0).', 'error');
    document.getElementById('panjang').focus();
    return null;
  }
  if (!penyelia) {
    tunjukToast('❌ Sila masukkan nama penyelia.', 'error');
    document.getElementById('namaPenyelia').focus();
    return null;
  }

  // Kumpul ahli
  const rows = document.querySelectorAll('.ahli-row');
  const ahli = [];
  for (const row of rows) {
    const nama   = row.querySelector('.inp-nama').value.trim();
    const noPend = row.querySelector('.inp-nopend').value.trim();
    if (!nama || !noPend) {
      tunjukToast('❌ Sila lengkapkan nama dan no. pendaftaran semua ahli.', 'error');
      row.querySelector(!nama ? '.inp-nama' : '.inp-nopend').focus();
      return null;
    }
    ahli.push({ nama, noPendaftaran: noPend });
  }

  return { tajuk, panjang, lebar, tinggi, penyelia, ahli };
}

// ── ID untuk modal padam ────────────────────────────────────────
let idPadamTerkini = null;

// ── INIT ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Render awal
  renderJadual();

  // ── Togol borang ──
  const btnToggle  = document.getElementById('btnToggleForm');
  const formWrapper = document.getElementById('formWrapper');
  btnToggle.addEventListener('click', () => {
    const terbuka = btnToggle.getAttribute('aria-expanded') === 'true';
    if (terbuka) {
      formWrapper.style.display = 'none';
      btnToggle.setAttribute('aria-expanded', 'false');
      btnToggle.textContent = '▼';
    } else {
      formWrapper.style.display = '';
      btnToggle.setAttribute('aria-expanded', 'true');
      btnToggle.textContent = '▲';
    }
  });

  // ── Tambah ahli ──
  document.getElementById('btnTambahAhli').addEventListener('click', tambahBabarisAhli);

  // ── Buang ahli (event delegation) ──
  document.getElementById('senaraiAhli').addEventListener('click', e => {
    if (e.target.classList.contains('btn-rm-ahli') && !e.target.disabled) {
      e.target.closest('.ahli-row').remove();
      kemaskinAhli();
    }
  });

  // ── Preview dimensi semasa taip ──
  ['panjang', 'lebar', 'tinggi'].forEach(id =>
    document.getElementById(id).addEventListener('input', previewIsipadu)
  );

  // ── Hantar borang ──
  document.getElementById('formProjek').addEventListener('submit', e => {
    e.preventDefault();

    const data = validasiBorang();
    if (!data) return;

    const { tajuk, panjang, lebar, tinggi, penyelia, ahli } = data;

    const projekBaru = {
      id:           janaId(),
      tajuk,
      panjang,
      lebar,
      tinggi,
      isipadu:      kiraIsipadu(panjang, lebar, tinggi),
      ahli,
      penyelia,
      tarikhDaftar: new Date().toLocaleDateString('ms-MY', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      })
    };

    const semua = muatData();
    semua.push(projekBaru);
    simpanData(semua);

    // Reset borang
    e.target.reset();
    document.getElementById('volPreview').textContent = '';
    resetBabarisAhli();

    const carian = document.getElementById('carian').value;
    renderJadual(carian);

    tunjukToast(`✅ Projek "${projekBaru.tajuk}" berjaya didaftarkan!`);
    document.getElementById('sectionSenarai').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // ── Reset borang ──
  document.getElementById('btnReset').addEventListener('click', () => {
    document.getElementById('volPreview').textContent = '';
    resetBabarisAhli();
  });

  // ── Carian live ──
  document.getElementById('carian').addEventListener('input', e => {
    renderJadual(e.target.value);
  });

  // ── Padam satu: buka modal (event delegation pada tbody) ──
  document.getElementById('tbodyJadual').addEventListener('click', e => {
    const btn = e.target.closest('.btn-padam');
    if (btn) {
      idPadamTerkini = btn.dataset.id;
      document.getElementById('modalPadam').hidden = false;
    }
  });

  // ── Padam satu: sahkan ──
  document.getElementById('btnSahkanPadam').addEventListener('click', () => {
    if (!idPadamTerkini) return;
    const semua   = muatData();
    const dipadam = semua.find(p => p.id === idPadamTerkini);
    const baru    = semua.filter(p => p.id !== idPadamTerkini);
    simpanData(baru);
    idPadamTerkini = null;
    document.getElementById('modalPadam').hidden = true;
    renderJadual(document.getElementById('carian').value);
    tunjukToast(`🗑 Projek "${dipadam?.tajuk ?? ''}" telah dipadam.`, 'error');
  });

  // ── Padam satu: batal ──
  document.getElementById('btnBatalPadam').addEventListener('click', () => {
    idPadamTerkini = null;
    document.getElementById('modalPadam').hidden = true;
  });

  // ── Padam semua: buka modal ──
  document.getElementById('btnPadamSemua').addEventListener('click', () => {
    if (muatData().length === 0) {
      tunjukToast('ℹ️ Tiada rekod untuk dipadam.', 'info');
      return;
    }
    document.getElementById('modalPadamSemua').hidden = false;
  });

  // ── Padam semua: sahkan ──
  document.getElementById('btnSahkanPadamSemua').addEventListener('click', () => {
    simpanData([]);
    document.getElementById('modalPadamSemua').hidden = true;
    renderJadual();
    tunjukToast('🗑 Semua rekod projek telah dipadam.', 'error');
  });

  // ── Padam semua: batal ──
  document.getElementById('btnBatalPadamSemua').addEventListener('click', () => {
    document.getElementById('modalPadamSemua').hidden = true;
  });

  // ── Tutup modal jika klik latar ──
  ['modalPadam', 'modalPadamSemua'].forEach(id => {
    document.getElementById(id).addEventListener('click', e => {
      if (e.target === e.currentTarget) {
        e.currentTarget.hidden = true;
        idPadamTerkini = null;
      }
    });
  });

  // ── Tutup modal dengan kekunci Escape ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.getElementById('modalPadam').hidden = true;
      document.getElementById('modalPadamSemua').hidden = true;
      idPadamTerkini = null;
    }
  });

  // ── Cetak ──
  document.getElementById('btnCetak').addEventListener('click', () => {
    window.print();
  });

});
