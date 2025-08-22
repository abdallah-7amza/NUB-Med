// docs/js/lessons-list.js
// Purpose: read lessons-index.json and show specialties & lessons. (قراءة الفهرس وعرض التخصصات والدروس)

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const params = new URLSearchParams(location.search);
  const yearParam = (params.get('year') || '').toLowerCase(); // normalize (توحيد صيغة)
  const titleEl = document.getElementById('page-title');
  const subtitleEl = document.getElementById('page-subtitle');
  const specialtySelect = document.getElementById('specialty-filter');
  const searchInput = document.getElementById('search-input');
  const specsGrid = document.getElementById('specialties-grid');
  const lessonsGrid = document.getElementById('lessons-grid');
  const emptyState = document.getElementById('empty-state');
  const debugLine = document.getElementById('debug-line');

  if (!yearParam) {
    titleEl.textContent = 'Error: year is missing (السنة غير موجودة في الرابط)';
    return;
  }

  titleEl.textContent = `Lessons — ${yearParam.toUpperCase()}`;
  subtitleEl.textContent = 'Select a specialty or search for a lesson. (اختر تخصصًا أو ابحث عن درس)';

  // Fetch index (جلب الفهرس) — use no-store to avoid stale cache (منع الكاش القديم)
  const indexUrl = './lessons-index.json';
  let index;
  try {
    const res = await fetch(indexUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    index = await res.json();
  } catch (e) {
    titleEl.textContent = 'Failed to load lessons-index.json (تعذر تحميل فهرس الدروس)';
    debugLine.textContent = `Debug: GET ${indexUrl} → ${e.message}`;
    return;
  }

  // Filter by year (تصفية حسب السنة) — case-insensitive (غير حساس لحالة الحروف)
  const yearEntries = index.filter(x => (x.year || '').toLowerCase() === yearParam);

  // If nothing, show available years for debugging (لو مفيش بيانات، اعرض السنوات المتاحة كتصحيح)
  if (yearEntries.length === 0) {
    const availableYears = Array.from(new Set(index.map(x => (x.year || '').toLowerCase()))).filter(Boolean);
    titleEl.textContent = `No entries for ${yearParam} (لا توجد بيانات لهذه السنة)`;
    debugLine.textContent = `Available years: ${availableYears.join(', ') || 'none'}`;
    return;
  }

  // Build specialties map (خريطة التخصصات)
  const specMap = new Map(); // key=specialty, value=[entries]
  for (const item of yearEntries) {
    const spec = (item.specialty || 'general').toLowerCase();
    if (!specMap.has(spec)) specMap.set(spec, []);
    specMap.get(spec).push(item);
  }

  // Populate specialty dropdown (ملء قائمة التخصص)
  const specList = Array.from(specMap.keys()).sort();
  for (const s of specList) {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = `${capitalize(s)} (${specMap.get(s).length})`;
    specialtySelect.appendChild(opt);
  }

  // Render specialties cards (كروت التخصصات)
  function renderSpecialties() {
    specsGrid.innerHTML = '';
    for (const s of specList) {
      const count = specMap.get(s).length;
      const div = document.createElement('div');
      div.className = 'card';
      div.innerHTML = `
        <h3>${capitalize(s)}</h3>
        <p><span class="badge">${count} lessons</span></p>
        <div style="margin-top:.5rem;">
          <button class="btn btn-primary" data-spec="${s}">View lessons</button>
        </div>
      `;
      specsGrid.appendChild(div);
    }

    // Bind buttons (ربط الأزرار)
    specsGrid.querySelectorAll('button[data-spec]').forEach(btn => {
      btn.addEventListener('click', () => {
        specialtySelect.value = btn.dataset.spec;
        renderLessons(); // show lessons (عرض الدروس)
        document.querySelector('section h2:nth-of-type(2)').scrollIntoView({ behavior: 'smooth' });
      });
    });
  }

  // Normalize/derive slug (اشتقاق المعرّف) from path if missing (لو مفيش)
  function entrySlug(e) {
    if (e.slug) return e.slug;
    if (e.path) {
      const file = e.path.split('/').pop() || '';
      return file.toLowerCase().replace(/\.md$/, '');
    }
    return '';
  }

  // Render lessons list (عرض قائمة الدروس) with filters (بالتصفية)
  function renderLessons() {
    const pickedSpec = (specialtySelect.value || '').toLowerCase();
    const q = (searchInput.value || '').toLowerCase().trim();

    // Filter (تصفية)
    let list = [...yearEntries];
    if (pickedSpec) list = list.filter(x => (x.specialty || '').toLowerCase() === pickedSpec);
    if (q) {
      list = list.filter(x =>
        (x.title || '').toLowerCase().includes(q) ||
        entrySlug(x).includes(q)
      );
    }

    lessonsGrid.innerHTML = '';
    if (list.length === 0) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    for (const e of list) {
      const title = e.title || prettifySlug(entrySlug(e));
      const spec = (e.specialty || '').toLowerCase();
      const slug = entrySlug(e);
      // link to lesson page (رابط صفحة الدرس)
      const href = `lesson.html?year=${encodeURIComponent(yearParam)}&specialty=${encodeURIComponent(spec)}&lesson=${encodeURIComponent(slug)}`;

      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <h3>${title}</h3>
        <p class="muted">${capitalize(spec)}</p>
        <div style="margin-top:.5rem;">
          <a class="btn btn-primary" href="${href}">Open lesson</a>
        </div>
      `;
      lessonsGrid.appendChild(card);
    }

    // Update debug line (سطر تصحيح)
    debugLine.textContent = `Showing ${list.length} lesson(s) — year=${yearParam} spec=${pickedSpec || 'any'} q="${q}"`;
  }

  // Events (الأحداث)
  specialtySelect.addEventListener('change', renderLessons);
  searchInput.addEventListener('input', renderLessons);

  // Initial render (العرض الأولي)
  renderSpecialties();
  renderLessons();
}

/* Helpers (دوال مساعدة) */
function capitalize(s='') { return s.charAt(0).toUpperCase() + s.slice(1); }
function prettifySlug(s='') {
  return s.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); // slug → Title (تحويل سلاج لعنوان)
}
