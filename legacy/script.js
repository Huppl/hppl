function updateClock() {
  const now = new Date();
  const timeString = now.toLocaleTimeString('ru-RU', { hour12: false });
  let tzCity = 'UNKNOWN';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    tzCity = tz.split('/')[1].replace('_', ' ');
  } catch (e) {}
  document.getElementById('sys-time').innerText = timeString;
  document.getElementById('sys-loc').innerText = tzCity.toUpperCase();
}
updateClock();
setInterval(updateClock, 1000);

// --- Language Switching ---
function applyTranslations() {
  const elements = document.querySelectorAll('[data-i18n-key]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n-key');
    el.textContent = t(key);
  });

  const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
  placeholders.forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key));
  });

  // Update hero title
  const heroTitle = document.getElementById('hero-title');
  if (heroTitle) {
    heroTitle.textContent = t('portfolio');
  }

  updateLanguageButtons();
}

function updateLanguageButtons() {
  const lang = getCurrentLanguage();
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.getAttribute('data-lang') === lang) {
      btn.classList.add('lang-active');
    } else {
      btn.classList.remove('lang-active');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Initial translation apply
  applyTranslations();

  // Setup language switcher buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
    });
  });
});
// Эффект параллакса для орбит
document.addEventListener('mousemove', (e) => {
  const { clientX, clientY } = e;
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  // Рассчитываем смещение относительно центра экрана
  const moveX = (clientX - centerX) / 50; 
  const moveY = (clientY - centerY) / 50;

  // Применяем смещение к нашим кругам
  const circle1 = document.querySelector('.circle-1');
  const circle2 = document.querySelector('.circle-2');

  // У второго круга смещение чуть меньше, чтобы создать глубину
  circle1.style.transform = `translate(${moveX}px, ${moveY}px)`;
  circle2.style.transform = `translate(${-moveX * 0.5}px, ${-moveY * 0.5}px)`;
});
document.addEventListener('DOMContentLoaded', () => {
  const transitionLayer = document.createElement('div');
  transitionLayer.className = 'page-transition';
  document.body.appendChild(transitionLayer);

  // Плавное появление при загрузке страницы
  setTimeout(() => {
    transitionLayer.classList.remove('active');
  }, 100);

  // Перехват кликов по ссылкам
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
      // Якорные ссылки на этой же странице (#works, #top) — просто скроллим,
      // без fade-перехода, который нужен только для перехода на другую страницу
      if (link.hash && link.pathname === window.location.pathname) {
        return;
      }
      // Исключаем ссылки, которые ведут на якоря или внешние ресурсы
      if (link.hostname === window.location.hostname) {
        e.preventDefault();
        transitionLayer.classList.add('active');
        
        setTimeout(() => {
          window.location = link.href;
        }, 500); // Ждем завершения анимации (0.5 сек)
      }
    });
  });
});
let currentSlide = 0;
const slider = document.querySelector('.slider-container');

if (slider) {
  let isDown = false;
  let startX;
  let scrollLeft;

  slider.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.style.transform ? parseInt(slider.style.transform.replace(/[^\d.-]/g, '')) : 0;
  });

  slider.addEventListener('mouseleave', () => { isDown = false; });
  slider.addEventListener('mouseup', () => { isDown = false; });

  slider.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 2; // Коэффициент скорости
    slider.style.transform = `translateX(${scrollLeft + walk}px)`;
    
  });
}

// --- Show the filter bar only while the Works section is in view ---
document.addEventListener('DOMContentLoaded', () => {
  const worksSection = document.getElementById('works');
  const filterBar = document.querySelector('.filter-bar');
  if (!worksSection || !filterBar) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      filterBar.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, { threshold: 0.15 });

  observer.observe(worksSection);
});

// --- Works: data-driven render, источник данных — Supabase (таблица projects) ---
const CATEGORIES = [
  { value: '3d', label: '3D' },
  { value: 'web', label: 'Веб-дизайн' },
  { value: 'branding', label: 'Брендинг' },
  { value: 'art', label: 'Арт' },
  { value: 'ai', label: 'Нейросети' },
  { value: 'type', label: 'Типографика' },
  { value: 'motion', label: 'Моушн' }
];

function getProjectIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id') || params.get('project');
  const id = parseInt(idParam, 10);
  return Number.isInteger(id) ? id : null;
}

function getProjectById(projectId) {
  if (!projectId) return null;
  return projects.find(item => item.id === projectId);
}

function getCategoryLabel(value) {
  return CATEGORIES.find(item => item.value === value)?.label || value || '';
}

function normalizeProjectLink(project) {
  if (!project) return '';
  if (project.link && project.link.startsWith('project.html?id=')) return project.link;
  if (project.link && project.link.trim() !== '' && !project.link.includes('project-template.html')) return project.link;
  if (project.id) {
    project.link = `project.html?id=${project.id}`;
    return project.link;
  }
  project.id = Date.now();
  project.link = `project.html?id=${project.id}`;
  return project.link;
}

let projects = [];

// Загружаем проекты из Supabase. Пока запрос не завершился, projects = [].
// projectsReady — промис, на который можно подписаться перед первым рендером.
async function loadProjects() {
  try {
    const list = await sbFetchProjects();
    projects = (list && list.length) ? list : JSON.parse(JSON.stringify(window.PROJECTS_DEFAULT || []));
  } catch (e) {
    console.error('Не удалось загрузить проекты из Supabase, использую значения по умолчанию', e);
    projects = JSON.parse(JSON.stringify(window.PROJECTS_DEFAULT || []));
  }
  return projects;
}

const projectsReady = loadProjects();
let currentFilter = 'all';
const defaultCardImage = 'images/1.jpg';

function renderWorkBoard() {
  const board = document.getElementById('work-board');
  if (!board) return;
  board.innerHTML = '';

  projects.forEach((p, i) => {
    if (currentFilter !== 'all' && p.category !== currentFilter) return;

    const card = document.createElement('div');
    card.className = 'work-card';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'work-card-image';
    const img = document.createElement('img');
    img.src = p.image || defaultCardImage;
    img.alt = `${p.title || 'Project'} preview`;
    imgWrap.appendChild(img);

    const index = document.createElement('span');
    index.className = 'work-index';
    index.textContent = String(i + 1).padStart(2, '0');

    const h2 = document.createElement('h2');
    h2.textContent = p.title || 'Untitled';

    const meta = document.createElement('p');
    meta.textContent = p.meta || '';

    const link = normalizeProjectLink(p);

    card.appendChild(imgWrap);
    card.appendChild(index);
    card.appendChild(h2);
    card.appendChild(meta);

    card.addEventListener('click', () => {
      if (link) window.location.href = link;
    });

    board.appendChild(card);
  });
}

function setFilter(category) {
  currentFilter = category;
  document.querySelectorAll('.filter-button').forEach(button => {
    button.classList.toggle('active', button.dataset.category === category);
  });
  renderWorkBoard();
}

function renderProjectDetail() {
  const projectId = getProjectIdFromUrl();
  const project = getProjectById(projectId);
  const page = document.querySelector('.project-page');
  const titleEl = document.getElementById('project-title');
  const categoryEl = document.getElementById('project-category');
  const metaEl = document.getElementById('project-meta');
  const descriptionEl = document.getElementById('project-description');
  const heroImg = document.getElementById('project-hero-img');
  const noticeEl = document.getElementById('project-notice');

  if (!page || !titleEl || !heroImg) return;
  if (!project) {
    page.innerHTML = '<div class="project-missing"><h2>'+t('project_not_found')+'</h2><p>'+t('project_not_found_desc')+' <a href="index.html">'+t('project_missing_link')+'</a></p></div>';
    return;
  }

  normalizeProjectLink(project);
  titleEl.textContent = project.title || 'Untitled';
  categoryEl.textContent = getCategoryLabel(project.category);
  metaEl.textContent = project.meta || 'Описание не задано';
  descriptionEl.textContent = project.description || 'Описание проекта скоро появится.';
  heroImg.src = project.image || defaultCardImage;
  heroImg.alt = `${project.title || 'Project'} preview`;
  noticeEl.textContent = 'ID проекта: ' + project.id + '. Изменения сохраняются в браузере и видны после обновления страницы.';
}

document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = Array.from(document.querySelectorAll('.filter-button'));
  if (!filterButtons.length) return;
  filterButtons.forEach(button => {
    button.addEventListener('click', () => setFilter(button.dataset.category));
  });
  projectsReady.then(() => renderWorkBoard());
});

document.addEventListener('DOMContentLoaded', () => {
  projectsReady.then(() => renderProjectDetail());
});

// --- Load Laboratory and Contact from Supabase on page load ---
document.addEventListener('DOMContentLoaded', async () => {
  // Load Laboratory
  const laboratoryEl = document.getElementById('laboratory-content');
  if (laboratoryEl) {
    try {
      const laboratory = await sbFetchLaboratory();
      laboratoryEl.textContent = laboratory.content || 'Сейчас изучаю: Web Design, 3D Modeling, Creative Coding';
    } catch (e) {
      console.error('Не удалось загрузить Laboratory из Supabase', e);
    }
  }

  // Load Contact links
  const contactContainer = document.getElementById('contact-links-container');
  if (contactContainer) {
    try {
      const contacts = await sbFetchContacts();
      if (contacts.length > 0) {
        contactContainer.innerHTML = '';
        contacts.forEach(contact => {
          const link = document.createElement('a');
          link.className = 'contact-link';
          link.href = contact.url || '#';
          link.textContent = contact.label || 'Контакт';
          link.style.display = 'block';
          link.style.marginTop = '10px';
          contactContainer.appendChild(link);
        });
      }
    } catch (e) {
      console.error('Не удалось загрузить Contact из Supabase', e);
    }
  }
});


document.addEventListener('DOMContentLoaded', () => {
  const adminToggle = document.getElementById('admin-toggle');
  const projectAdminPanel = document.getElementById('project-admin-panel');
  const generalAdminPanel = document.getElementById('admin-panel');

  if (adminToggle) {
    adminToggle.addEventListener('click', async (e) => {
      const isAuthenticated = await sbIsAuthenticated();
      if (!isAuthenticated) {
        e.stopPropagation();
        showAuthModal();
        return;
      }

      if (projectAdminPanel) {
        openProjectAdminPanel();
      } else if (generalAdminPanel) {
        openGeneralAdminPanel();
      }
    });
  }
});

function showAuthModal() {
  const authModal = document.getElementById('admin-auth');
  const authBtn = document.getElementById('admin-auth-btn');
  const authInput = document.getElementById('admin-password-input');
  const authError = document.getElementById('admin-auth-error');

  if (!authModal) return;

  authModal.classList.add('is-open');

  authBtn.onclick = async () => {
    const password = authInput.value;
    authBtn.disabled = true;
    const { error } = await sbSignIn(password);
    authBtn.disabled = false;
    if (!error) {
      authModal.classList.remove('is-open');
      authInput.value = '';
      authError.style.display = 'none';
      document.getElementById('admin-toggle').click();
    } else {
      authError.textContent = t('admin_auth_error');
      authError.style.display = 'block';
    }
  };

  authInput.onkeypress = (e) => {
    if (e.key === 'Enter') authBtn.click();
  };

  authInput.focus();
}

let globalOpenGeneralAdminPanel = null;

function openGeneralAdminPanel() {
  if (typeof globalOpenGeneralAdminPanel === 'function') {
    globalOpenGeneralAdminPanel();
  }
}

function openProjectAdminPanel() {
  const panel = document.getElementById('project-admin-panel');
  const backdrop = document.getElementById('admin-backdrop');
  if (!panel || !backdrop) return;
  renderProjectAdminPanel();
  panel.classList.add('is-open');
  backdrop.classList.add('is-open');
}

function closeProjectAdminPanel() {
  const panel = document.getElementById('project-admin-panel');
  const backdrop = document.getElementById('admin-backdrop');
  if (!panel || !backdrop) return;
  panel.classList.remove('is-open');
  backdrop.classList.remove('is-open');
}

document.addEventListener('DOMContentLoaded', () => {
  const projectAdminSave = document.getElementById('project-admin-save');
  const projectAdminClose = document.getElementById('admin-close');
  const projectAdminBackdrop = document.getElementById('admin-backdrop');
  if (!document.getElementById('project-admin-panel')) return;

  if (projectAdminSave) {
    projectAdminSave.addEventListener('click', saveProjectDetail);
  }
  if (projectAdminClose) {
    projectAdminClose.addEventListener('click', closeProjectAdminPanel);
  }
  if (projectAdminBackdrop) {
    projectAdminBackdrop.addEventListener('click', closeProjectAdminPanel);
  }
});

function renderProjectAdminPanel() {
  const projectId = getProjectIdFromUrl();
  const project = getProjectById(projectId);
  if (!project) return;

  const titleField = document.getElementById('project-admin-title');
  const metaField = document.getElementById('project-admin-meta');
  const categorySelect = document.getElementById('project-admin-category');
  const imageField = document.getElementById('project-admin-image');
  const descriptionField = document.getElementById('project-admin-description');

  if (!titleField || !metaField || !categorySelect || !imageField || !descriptionField) return;

  titleField.value = project.title || '';
  metaField.value = project.meta || '';
  imageField.value = project.image || '';
  descriptionField.value = project.description || '';

  categorySelect.innerHTML = '';
  CATEGORIES.forEach(c => {
    const option = document.createElement('option');
    option.value = c.value;
    option.textContent = c.label;
    if (project.category === c.value) option.selected = true;
    categorySelect.appendChild(option);
  });
}

async function saveProjectDetail() {
  const projectId = getProjectIdFromUrl();
  const project = getProjectById(projectId);
  if (!project) return;

  const titleField = document.getElementById('project-admin-title');
  const metaField = document.getElementById('project-admin-meta');
  const categorySelect = document.getElementById('project-admin-category');
  const imageField = document.getElementById('project-admin-image');
  const descriptionField = document.getElementById('project-admin-description');

  if (!titleField || !metaField || !categorySelect || !imageField || !descriptionField) return;

  project.title = titleField.value;
  project.meta = metaField.value;
  project.category = categorySelect.value;
  project.image = imageField.value;
  project.description = descriptionField.value;
  normalizeProjectLink(project);

  const ok = await sbUpdateProject(project.id, {
    title: project.title,
    meta: project.meta,
    category: project.category,
    image: project.image,
    description: project.description,
    link: project.link
  });

  renderProjectDetail();
  alert(ok ? t('project_saved') : 'Ошибка сохранения в Supabase — проверьте, что вы авторизованы.');
}

// --- Admin panel: edit / delete / add / export / reset ---
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('admin-toggle');
  const backdrop = document.getElementById('admin-backdrop');
  const panel = document.getElementById('admin-panel');
  const closeBtn = document.getElementById('admin-close');
  const list = document.getElementById('admin-list');
  const addBtn = document.getElementById('admin-add');
  const exportBtn = document.getElementById('admin-export');
  const resetBtn = document.getElementById('admin-reset');
  const exportOutput = document.getElementById('admin-export-output');
  if (!toggle || !panel) return;

  const openPanel = async () => {
    await projectsReady;
    renderAdminList();
    panel.classList.add('is-open');
    backdrop.classList.add('is-open');
  };
  globalOpenGeneralAdminPanel = openPanel;

  const closePanel = () => {
    panel.classList.remove('is-open');
    backdrop.classList.remove('is-open');
  };

  closeBtn.addEventListener('click', closePanel);
  backdrop.addEventListener('click', closePanel);

  // Локальный ре-рендер списка + доски работ (без похода в БД — используется
  // после того как поле уже сохранено в Supabase отдельным вызовом).
  function refreshBoards() {
    renderWorkBoard();
  }

  function renderAdminList() {
    list.innerHTML = '';
    projects.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'admin-row';

      const title = document.createElement('input');
      title.className = 'admin-field';
      title.placeholder = 'Название';
      title.value = p.title || '';
      title.addEventListener('change', () => { p.title = title.value; refreshBoards(); sbUpdateProject(p.id, { title: p.title }); });

      const meta = document.createElement('input');
      meta.className = 'admin-field';
      meta.placeholder = 'Описание (// Branding // 2026)';
      meta.value = p.meta || '';
      meta.addEventListener('change', () => { p.meta = meta.value; refreshBoards(); sbUpdateProject(p.id, { meta: p.meta }); });

      const category = document.createElement('select');
      category.className = 'admin-field';
      CATEGORIES.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.value;
        opt.textContent = c.label;
        if (p.category === c.value) opt.selected = true;
        category.appendChild(opt);
      });
      category.addEventListener('change', () => { p.category = category.value; refreshBoards(); sbUpdateProject(p.id, { category: p.category }); });

      const image = document.createElement('input');
      image.className = 'admin-field';
      image.placeholder = 'Изображение (images/...)';
      image.value = p.image || '';
      image.addEventListener('change', () => { p.image = image.value; refreshBoards(); sbUpdateProject(p.id, { image: p.image }); });

      const link = document.createElement('input');
      link.className = 'admin-field';
      link.placeholder = 'Ссылка (project.html?id=...)';
      link.value = p.link || '';
      link.addEventListener('change', () => { p.link = link.value; refreshBoards(); sbUpdateProject(p.id, { link: p.link }); });

      const del = document.createElement('button');
      del.className = 'admin-delete';
      del.textContent = '✕';
      del.title = 'Удалить проект';
      del.addEventListener('click', async () => {
        const ok = await sbDeleteProject(p.id);
        if (ok) {
          projects.splice(i, 1);
          refreshBoards();
          renderAdminList();
        } else {
          alert('Не удалось удалить проект в Supabase.');
        }
      });

      row.appendChild(del);
      row.appendChild(title);
      row.appendChild(meta);
      row.appendChild(category);
      row.appendChild(image);
      row.appendChild(link);
      list.appendChild(row);
    });
  }

  addBtn.addEventListener('click', async () => {
    const draft = { title: 'Новый проект', meta: '// Category // 2026', category: '3d', image: defaultCardImage, link: '' };
    const created = await sbInsertProject(draft);
    if (!created) {
      alert('Не удалось создать проект в Supabase. Проверьте, что вы авторизованы.');
      return;
    }
    normalizeProjectLink(created);
    await sbUpdateProject(created.id, { link: created.link });
    projects.push(created);
    refreshBoards();
    renderAdminList();
  });

  exportBtn.addEventListener('click', () => {
    const code = 'window.PROJECTS_DEFAULT = ' + JSON.stringify(projects, null, 2) + ';';
    exportOutput.value = code;
    exportOutput.focus();
    exportOutput.select();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => { /* clipboard blocked — text is still selected for manual copy */ });
    }
  });

  // Кнопка "Сбросить" теперь перечитывает актуальные данные из Supabase,
  // отменяя любые несинхронизированные локальные изменения в этой вкладке.
  resetBtn.addEventListener('click', async () => {
    if (!confirm('Перечитать данные из Supabase? Несохранённые локальные изменения будут потеряны.')) return;
    await loadProjects();
    refreshBoards();
    renderAdminList();
  });

  const projectAdminSave = document.getElementById('project-admin-save');
  const projectAdminClose = document.getElementById('admin-close');
  if (projectAdminSave) {
    projectAdminSave.addEventListener('click', saveProjectDetail);
  }
  if (projectAdminClose && document.getElementById('project-admin-panel')) {
    projectAdminClose.addEventListener('click', closeProjectAdminPanel);
    backdrop.addEventListener('click', closeProjectAdminPanel);
  }

  // --- LABORATORY TAB ---
  let laboratory = { content: '' };

  async function loadLaboratory() {
    laboratory = await sbFetchLaboratory();
  }

  function renderLaboratory() {
    const textArea = document.getElementById('admin-laboratory-text');
    if (textArea) {
      textArea.value = laboratory.content || '';
    }
  }

  const laboratorySave = document.getElementById('admin-laboratory-save');
  if (laboratorySave) {
    laboratorySave.addEventListener('click', async () => {
      const textArea = document.getElementById('admin-laboratory-text');
      laboratory.content = textArea.value;
      const ok = await sbSaveLaboratory(laboratory.content);
      alert(ok ? t('admin_lab_save') : 'Ошибка сохранения в Supabase — проверьте, что вы авторизованы.');
    });
  }

  // --- CONTACT TAB ---
  let contacts = [];

  async function loadContacts() {
    contacts = await sbFetchContacts();
  }

  function renderContact() {
    const contactList = document.getElementById('admin-contact-list');
    if (!contactList) return;
    contactList.innerHTML = '';

    contacts.forEach((contact, idx) => {
      const row = document.createElement('div');
      row.className = 'admin-row';

      const label = document.createElement('input');
      label.className = 'admin-field';
      label.placeholder = 'Название (Instagram, Telegram, Email)';
      label.value = contact.label || '';
      label.addEventListener('change', () => { contact.label = label.value; sbUpdateContact(contact.id, { label: contact.label }); });

      const url = document.createElement('input');
      url.className = 'admin-field';
      url.placeholder = 'Ссылка (https://... или mailto:...)';
      url.value = contact.url || '';
      url.addEventListener('change', () => { contact.url = url.value; sbUpdateContact(contact.id, { url: contact.url }); });

      const del = document.createElement('button');
      del.className = 'admin-delete';
      del.textContent = '✕';
      del.addEventListener('click', async () => {
        const ok = await sbDeleteContact(contact.id);
        if (ok) {
          contacts.splice(idx, 1);
          renderContact();
        } else {
          alert('Не удалось удалить контакт в Supabase.');
        }
      });

      row.appendChild(del);
      row.appendChild(label);
      row.appendChild(url);
      contactList.appendChild(row);
    });
  }

  const contactAdd = document.getElementById('admin-contact-add');
  if (contactAdd) {
    contactAdd.addEventListener('click', async () => {
      const created = await sbInsertContact({ label: 'Новая ссылка', url: '' });
      if (!created) {
        alert('Не удалось создать контакт в Supabase. Проверьте, что вы авторизованы.');
        return;
      }
      contacts.push(created);
      renderContact();
    });
  }

  // Вкладки админа
  const tabBtns = Array.from(document.querySelectorAll('.admin-tab-btn'));
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`admin-tab-${btn.dataset.tab}`).classList.add('active');
    });
  });

  // При открытии админа подгружаем актуальные Laboratory и Contact из Supabase
  const adminToggle = document.getElementById('admin-toggle');
  if (adminToggle) {
    adminToggle.addEventListener('click', async () => {
      await Promise.all([loadLaboratory(), loadContacts()]);
      renderLaboratory();
      renderContact();
    });
  }
});
