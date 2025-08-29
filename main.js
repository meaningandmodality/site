// === HEADER + FOOTER LOADING ===
fetch("partials/header.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("header").innerHTML = data;
  });

fetch("partials/footer.html")
  .then(res => res.text())
  .then(data => {
    document.getElementById("footer").innerHTML = data;
  });

  // Sticky nav after scroll
window.addEventListener('scroll', () => {
  const nav = document.getElementById('main-nav');
  const spacer = document.querySelector('.nav-spacer');
  const headerHeight = document.querySelector('header')?.offsetHeight || 100;

  if (window.scrollY > headerHeight) {
    nav.classList.add('fixed');
    if (spacer) spacer.style.display = 'block';  // prevent layout jump
  } else {
    nav.classList.remove('fixed');
    if (spacer) spacer.style.display = 'none';
  }
});

// === SMART ROUTER ===
function handleRouting() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page') || 'home';

  updatePageTitle(page);

  document.querySelectorAll('nav a').forEach(a => {
    const isActive = (new URL(a.href)).searchParams.get('page') === page;
    a.classList.toggle('active', isActive);
    if (isActive) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  
  if (page === 'people') {
    loadPeople();
  } else if (page === 'research') {
    loadResearch();
  } else if (page === 'publications') {
    loadPublications();
  } else if (page === 'contact') {
    // loadStructuredContent('data/contact.txt');
    loadContacts();
  } else {
    loadPage(`partials/${page}.html`);
    if (page === 'home') setTimeout(loadNews, 150);
  }
}


function updatePageTitle(page) {
  const titles = {
    home: 'Home | Meaning & Modality Lab',
    people: 'People | Meaning & Modality Lab',
    publications: 'Publications | Meaning & Modality Lab',
    research: 'Research | Meaning & Modality Lab',
    contact: 'Contact | Meaning & Modality Lab',
  };

  document.title = titles[page] || 'Meaning & Modality Lab';
}

window.onpopstate = handleRouting;

window.onload = () => {
  handleRouting();

  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const url = this.getAttribute('href');
      history.pushState({}, '', url);
      handleRouting();
    });
  });
};

// === PAGE LOADERS ===
function loadPage(file) {
  fetch(file)
    .then(res => res.text())
    .then(data => {
      document.getElementById("main-content").innerHTML = data;
    });
}

// === CONTACT ===
function loadContacts() {
  const mount = document.getElementById('main-content');
  mount.innerHTML = '<div class="loading">Loading…</div>';

  fetch('data/contacts.txt', { cache: 'no-cache' })
    .then(r => r.text())
    .then(text => {
      const lines = text.split(/\r?\n/).map(l => l.trim());

      let title = 'How to Get Involved';
      const intros = [];
      const contacts = [];
      let address = '';

      const escape = s => String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');

      // Convert [label](url) into <a href="url">label</a>
      const parseMarkdownLinks = s =>
        s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
          (m, label, url) => `<a href="${escape(url)}" target="_blank" rel="noopener">${escape(label)}</a>`);

      let sawTitle = false;

      for (const raw of lines) {
        if (!raw || raw.startsWith('#')) continue;

        // Title: first line without pipes or prefixes
        if (!sawTitle && !raw.includes('|') && !/^intro:|^address:|^contact\s*\|/i.test(raw)) {
          title = raw;
          sawTitle = true;
          continue;
        }

        // Intro: free text (with markdown link support)
        if (/^intro\s*:/i.test(raw)) {
          const para = raw.replace(/^intro\s*:/i, '').trim();
          if (para) intros.push(parseMarkdownLinks(para));
          continue;
        }

        // Contact | Name | Role | Email
        if (/^contact\s*\|/i.test(raw)) {
          const parts = raw.split('|').map(s => s.trim());
          const [, name = '', role = '', email = ''] = parts;
          if (name && email) contacts.push({ name, role, email });
          continue;
        }

        // Address
        if (/^address\s*:/i.test(raw)) {
          address = raw.replace(/^address\s*:/i, '').trim();
          continue;
        }
      }

      // Build HTML
      const introHTML = intros.map(p => `<p>${p}</p>`).join('');
      const contactsHTML = contacts.map(c => `
        <div class="contact-card">
          <h3>${escape(c.name)}${c.role ? `, ${escape(c.role)}` : ''}</h3>
          <p>Email: <a href="mailto:${escape(c.email)}">${escape(c.email)}</a></p>
        </div>
      `).join('');
      const addressHTML = address
        ? `<p class="snailmail"><em>Snail mail:</em> ${escape(address)}</p>`
        : '';

      mount.innerHTML = `
        <h2>${escape(title)}</h2>
        ${introHTML}
        <div class="contact-grid">
          ${contactsHTML || '<p>No contacts listed.</p>'}
        </div>
        ${addressHTML}
      `;
    })
    .catch(err => {
      console.error(err);
      mount.innerHTML = '<p class="error">Couldn’t load contacts.txt.</p>';
    });
}


// === NEWS ===
function loadNews() {
  const userLocale = navigator.language || 'en-US';

  function parseUSDate(dateStr) {
    const [month, day, year] = dateStr.split('/');
    return new Date(`${year}-${month}-${day}`);
  }

  fetch('data/news.txt')
    .then(res => res.text())
    .then(text => {
      const lines = text.trim().split('\n');
      let html = '';

      lines.forEach(line => {
        if (line.startsWith('#') || !line.trim()) return;

        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 5) {
          const [title, date, description, image='', altTag='', maybeLink=''] = parts;
          const linkUrl = (maybeLink || '').startsWith('news_link=') ? maybeLink.replace(/^news_link=/i, '').trim() : '';
          const altText = (altTag || '').replace(/^alt=/i, '').trim() || '';

          const hasImage = image && image.trim() && image.trim() !== '-';
          const media = hasImage
            ? `<img class="news-thumb" src="images/${image.trim()}" alt="${altText}">`
            : `<div class="news-thumb placeholder" aria-hidden="true"></div>`;

          const linkHtml = linkUrl ? `<p><a href="${linkUrl}" target="_blank" rel="noopener">Read more →</a></p>` : '';

          const rawDate = parseUSDate(date);
          const formattedDate = isNaN(rawDate)
            ? 'Date unavailable'
            : new Intl.DateTimeFormat(userLocale, {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              }).format(rawDate);

          html += `
            <div class="news-post">
              ${media}
              <div class="news-text">
                <h4>${title}</h4>
                <p class="news-date">${formattedDate}</p>
                <p>${description}</p>
                ${linkHtml}
              </div>
            </div>
          `;
        }
      });

      document.getElementById('news-list').innerHTML = html;
    });
}

// === PEOPLE ===
function loadPeople() {
  fetch('data/people.txt')
    .then(res => res.text())
    .then(text => {
      const lines = text.trim().split('\n');
      const buckets = { current: [], alumni: [], collab: [] };

      lines.forEach((line, index) => {
        if (line.startsWith('#') || !line.trim()) return;
        const parts = line.split('|').map(p => p.trim());
        // Group | Name | Role | Description | Image | alt=... | [optional] site=...
        const [group, name, role, description, image, altPart, maybeSite] = parts;
        const altText = (altPart || '').replace(/^alt=/i, '').trim() || `${name} headshot`;
        const site = (maybeSite || '').startsWith('site=') ? maybeSite.replace(/^site=/i, '').trim() : '';

        const isLong = description.length > 120;
        const short = isLong ? description.slice(0, 120) + '…' : description;

        const titleHtml = site
          ? `<a href="${site}" target="_blank" rel="noopener">${name}</a>`
          : name;

        const card = `
          <div class="person-card" tabindex="0" role="button" aria-expanded="false"
            onclick="togglePersonDescription(${index})"
            onkeydown="if(event.key==='Enter'||event.key===' ') togglePersonDescription(${index})">
            <img src="images/${image}" alt="${altText}">
            <h4>${titleHtml}</h4>
            <p class="role">${role}</p>
            <p id="desc-${index}" class="description" data-full="${description}">${short}</p>
            ${isLong ? `<p id="hint-${index}" class="toggle-hint">(Click to expand)</p>` : ''}
          </div>
        `;

        if ((group || '').toLowerCase() === 'alumni') buckets.alumni.push(card);
        else if ((group || '').toLowerCase() === 'collab') buckets.collab.push(card);
        else buckets.current.push(card); // default
      });

      const tabs = `
        <div class="tabs" role="tablist" aria-label="People sections">
          <button class="tab active" role="tab" aria-selected="true" data-tab="current">Current</button>
          <button class="tab" role="tab" aria-selected="false" data-tab="alumni">Alumni</button>
          <button class="tab" role="tab" aria-selected="false" data-tab="collab">Collaborators</button>
        </div>
      `;

      const makePanel = (name, cards) => `
        <div class="tab-panel ${name === 'current' ? 'active' : ''}" role="tabpanel" data-panel="${name}">
          <div class="people-grid">${cards.join('')}</div>
        </div>
      `;

      const html = `
        <h2>Our People</h2>
        ${tabs}
        ${makePanel('current', buckets.current)}
        ${makePanel('alumni', buckets.alumni)}
        ${makePanel('collab', buckets.collab)}
      `;

      document.getElementById('main-content').innerHTML = html;

      // tab wiring
      document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tab').forEach(b => {
            b.classList.toggle('active', b === btn);
            b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
          });
          const target = btn.getAttribute('data-tab');
          document.querySelectorAll('.tab-panel').forEach(p => {
            p.classList.toggle('active', p.getAttribute('data-panel') === target);
          });
        });
      });
    });
}

// JS function to toggle full/short description
function togglePersonDescription(index) {
  const desc = document.getElementById(`desc-${index}`);
  const hint = document.getElementById(`hint-${index}`);
  const full = desc.getAttribute('data-full');
  const short = full.length > 120 ? full.slice(0, 120) + '…' : full;


  const isShowingFull = desc.textContent === full;

  if (isShowingFull) {
    desc.textContent = short;
    if (hint) hint.textContent = '(Click to expand)';
  } else {
    desc.textContent = full;
    if (hint) hint.textContent = '(Click to collapse)';
  }

  const card = document.querySelector(`.person-card[onclick*="${index}"]`);
  if (card) {
    card.setAttribute('aria-expanded', isShowingFull ? 'false' : 'true');
  }
}

// === RESEARCH ===
function loadResearch() {
  const mount = document.getElementById('main-content');
  mount.innerHTML = '<div class="loading">Loading projects…</div>';

  fetch('data/research.txt', { cache: 'no-cache' })
    .then(r => r.text())
    .then(text => {
      // Small helpers
      const escape = s => String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');

      // Turn [label](url) into anchor tags
      const mdLinks = s =>
        String(s).replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
          (m, label, url) => `<a href="${escape(url)}" target="_blank" rel="noopener">${escape(label)}</a>`);

      // Parse research.txt into sections
      const sections = [];
      let current = { title: 'Projects', items: [] };

      text.split(/\r?\n/).forEach(raw => {
        const line = raw.trim();
        if (!line || line.startsWith('#')) return;

        // Section header: non-empty line w/ no pipes
        if (!line.includes('|')) {
          if (current.items.length) sections.push(current);
          current = { title: line, items: [] };
          return;
        }

        // Row: Title | Short | Long | (optional) Pubs
        const parts = line.split('|').map(s => s.trim());
        if (!parts[0]) return;

        let [title, mini = '', long = '', pubs = ''] = parts;

        // Also support "Select publications:" embedded in long text
        // Example: "... Sentences ... Select publications: [Paper](url), [Slides](url)"
        if (!pubs && /(^|\s)select publications\s*:/i.test(long)) {
          const match = long.match(/(^|\s)select publications\s*:\s*(.*)$/i);
          if (match) {
            pubs = match[2].trim();
            long = long.replace(match[0], '').trim();
          }
        }

        current.items.push({ title, mini, long, pubs });
      });
      if (current.items.length) sections.push(current);

      // Render tabs + panels
      let idx = 0; // unique ids for toggles across sections
      const tabs = sections
        .map((s, i) =>
          `<button class="tab ${i === 0 ? 'active' : ''}" data-tab="panel-${i}" role="tab" aria-selected="${i===0?'true':'false'}">${escape(s.title)}</button>`
        ).join('');

      const panels = sections
        .map((sec, i) => {
          const cards = sec.items.map(item => {
            const id = idx++;

            const shortHTML = mdLinks(item.mini || '');
            const longHTML  = item.long ? mdLinks(item.long) : '';
            const pubsHTML  = item.pubs
              ? `<div class="project-pubs"><strong>Select publications:</strong> ${mdLinks(item.pubs)}</div>`
              : '';

            return `
              <div class="project-card" tabindex="0" role="button" aria-expanded="false"
                   onclick="toggleDescription(${id})"
                   onkeydown="if(event.key==='Enter'||event.key===' ') toggleDescription(${id})">
                <h4>${escape(item.title)}</h4>
                <p class="description">
                  ${shortHTML}
                  ${item.long ? `<span id="long-${id}" class="long-text" style="display:none;"> ${longHTML}</span>` : ''}
                </p>
                ${pubsHTML}
                ${item.long ? `<p id="hint-${id}" class="toggle-hint">(More information)</p>` : ''}
              </div>
            `;
          }).join('');

          return `
            <div id="panel-${i}" class="tab-panel ${i === 0 ? 'active' : ''}" role="tabpanel">
              <div class="project-grid">${cards || '<p>No projects listed.</p>'}</div>
            </div>
          `;
        }).join('');

      mount.innerHTML = `
        <h2>Research</h2>
        <div class="tabs" role="tablist">${tabs}</div>
        ${panels}
      `;

      // Tabs behavior
      const tabBtns = mount.querySelectorAll('.tab');
      const tabPanels = mount.querySelectorAll('.tab-panel');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-tab');
          tabBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
          tabPanels.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          btn.setAttribute('aria-selected','true');
          mount.querySelector('#' + target).classList.add('active');
        });
      });

      // Minimal toggle if missing globally
      if (typeof window.toggleDescription !== 'function') {
        window.toggleDescription = function(i) {
          const span = document.getElementById(`long-${i}`);
          const hint = document.getElementById(`hint-${i}`);
          if (!span) return;
          const show = span.style.display === 'none';
          span.style.display = show ? 'inline' : 'none';
          if (hint) hint.textContent = show ? '(Show less)' : '(More information)';
        };
      }
    })
    .catch(() => {
      mount.innerHTML = '<p class="error">Couldn’t load research.txt.</p>';
    });
}

// JS function to toggle full/short description
function toggleDescription(index) {
  const full = document.getElementById(`long-${index}`);
  const hint = document.getElementById(`hint-${index}`);
  const card = document.querySelector(`.project-card[onclick*="${index}"]`);


  if (full.style.display === 'none') {
    full.style.display = 'inline';
    if (hint) hint.textContent = '(Less information)';
  } else {
    full.style.display = 'none';
    if (hint) hint.textContent = '(More information)';
  }

  if (card) {
    const isExpanded = full.style.display === 'inline';
    card.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
  }
}

// === PUBLICATIONS with custom link labels ===
function loadPublications() {
  const mount = document.getElementById('main-content');
  mount.innerHTML = '<div class="loading">Loading…</div>';

  // 1) Fetch people first to build a set of lab names
  Promise.all([
    fetch('data/people.txt', { cache: 'no-cache' }).then(r => r.text()),
    fetch('data/publications.txt', { cache: 'no-cache' }).then(r => r.text())
  ])
  .then(([peopleText, pubsText]) => {
    // --- helpers ---
    const isComment = s => /^\s*#/.test(s);
    const escapeHtml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isYear = s => /^\d{4}\s*$/.test(s);
    const isSection = s => /^=+/.test(s);

    // Build name list from people.txt (column 2 is Name)
    const names = [];
    peopleText.split(/\r?\n/).forEach(line => {
      const t = line.trim();
      if (!t || isComment(t)) return;
      if (/^people$/i.test(t)) return; // possible header "People"
      const parts = t.split('|').map(x => x.trim());
      // Expect: group | Name | Role | ...
      if (parts.length >= 2) {
        const name = parts[1];
        if (name) names.push(name);
      }
    });

    // Sort names by length desc to avoid partial shadowing (e.g., "Kate" within "Kathryn")
    names.sort((a, b) => b.length - a.length);

    // Bold any name occurrences in an author string (after HTML escaping)
    function boldLabMembers(authorsEscaped) {
      let out = authorsEscaped;
      for (const n of names) {
        const pat = new RegExp(`(^|[^\\w])(${escRe(n)})(?=$|[^\\w])`, 'g');
        out = out.replace(pat, (_, pre, match) => `${pre}<strong>${match}</strong>`);
      }
      return out;
    }

    // Parse publications
    const byYear = Object.create(null);
    const yearOrder = [];
    let currentYear = '';

    function parseEntry(line) {
      const parts = line.split('|').map(s => s.trim());
      const authors = parts[0] || '';
      const title   = parts[1] || '';
      const where   = parts[2] || '';
      const files = [];
      let extLink = '';
      for (let i = 3; i < parts.length; i++) {
        const tok = parts[i];
        if (!tok) continue;
        if (/^https?:\/\//i.test(tok)) { extLink = tok; continue; }
        if (/\.(pdf)$/i.test(tok)) files.push(tok);
      }
      return { authors, title, where, files, extLink };
    }

    pubsText.split(/\r?\n/).forEach(raw => {
      const line = raw.trim();
      if (!line || isComment(line) || isSection(line)) return;
      if (isYear(line)) {
        currentYear = line.match(/\d{4}/)[0];
        if (!byYear[currentYear]) { byYear[currentYear] = []; yearOrder.push(currentYear); }
        return;
      }
      if (!currentYear) return; // skip items not under a year (no "Other")
      byYear[currentYear].push(parseEntry(line));
    });

    // Build HTML (Harvard-like bullets, quotes, italic venue)
    const labelFor = f => {
      const lc = f.toLowerCase();
      if (lc.includes('poster')) return '[poster]';
      if (lc.includes('slides')) return '[slides]';
      if (lc.includes('paper'))  return '[paper]';
      return '[pdf]';
    };

    let html = `<h2>Publications &amp; Talks</h2>`;
    yearOrder.forEach(yr => {
      const items = byYear[yr];
      if (!items || !items.length) return;

      html += `<section class="pubs-year"><h3>${yr}</h3><ul class="pubs-list">`;
      
      // helper: add trailing period only if missing
      const ensurePeriod = s =>
        s ? (/[.?!]\s*$/.test(s) ? s : s + '.') : '';

      items.forEach(it => {
        const authorsEsc = escapeHtml(it.authors);
        const boldedAuthors = boldLabMembers(authorsEsc);

        const links = [];
        (it.files || []).forEach(f => {
          const href = /^https?:\/\//i.test(f) ? f : `documents/${f}`;
          links.push(`<a href="${href}" target="_blank" rel="noopener">${labelFor(f)}</a>`);
        });
        if (it.extLink) links.push(`<a href="${it.extLink}" target="_blank" rel="noopener">[link]</a>`);

        // Normalize punctuation for each field
        const authorsPart = boldedAuthors ? `${boldedAuthors}.` : '';
        const titlePart   = it.title ? ` “${ensurePeriod(escapeHtml(it.title))}”` : '';
        const wherePart   = it.where ? ` ${ensurePeriod(escapeHtml(it.where))}` : '';

        html += `
          <li class="pub-entry">
            <span class="pub-authors">${authorsPart}</span>${titlePart}${wherePart}
            ${links.length ? ` ${links.join(' ')}` : ''}
          </li>
        `;
      });

      html += `</ul></section>`;
    });

    document.getElementById('main-content').innerHTML = html;
  })
  .catch(err => {
    console.error(err);
    mount.innerHTML = '<p class="error">Couldn’t load publications.</p>';
  });
}