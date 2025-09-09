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

// Bold lab-member names inside already-rendered HTML,
// operating only on TEXT NODES to avoid attributes/tags.
function boldNamesInHTML(html, names) {
  if (!html || !names?.length) return html;

  // 1) sort longest-first to avoid partial shadowing
  const sorted = [...names].sort((a, b) => b.length - a.length);

  // Escapes for building a regex from names
  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 2) single alternation pattern with word-ish boundaries
  // Using \b works well for ASCII; for broader alphabets consider \p{L}\p{N} with the 'u' flag.
  const pattern = new RegExp(`\\b(?:${sorted.map(escRe).join('|')})\\b`, 'g');

  const container = document.createElement('div');
  container.innerHTML = html;

  const walk = (node) => {
    // Skip anything already bolded
    if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'STRONG') return;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      let last = 0;
      const frag = document.createDocumentFragment();

      text.replace(pattern, (match, offset) => {
        if (offset > last) frag.appendChild(document.createTextNode(text.slice(last, offset)));
        const strong = document.createElement('strong');
        strong.textContent = match;
        frag.appendChild(strong);
        last = offset + match.length;
      });

      // no matches → leave as-is
      if (last === 0) return;

      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
      return;
    }

    // Recurse
    Array.from(node.childNodes).forEach(walk);
  };

  walk(container);
  return container.innerHTML;
}

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
    research: 'Ongoing Projects | Meaning & Modality Lab',
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
    const [month, day, year] = (dateStr || '').split('/');
    return new Date(`${year}-${month}-${day}`);
  }

  const escapeHtml = (s) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  function renderMarkdownSafe(md) {
    if (!md) return '';
    let html = escapeHtml(md);

    // Links
    html = html.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      (_m, label, url) => `<a href="${url}" target="_blank" rel="noopener">${label}</a>`
    );

    // Bold
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

    // Paragraphs + line breaks
    const paragraphs = html
      .split(/\n{2,}/)
      .map(block => block.replace(/\n/g, '<br>'))
      .map(block => `<p>${block}</p>`)
      .join('');

    return paragraphs;
  }

  const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  Promise.all([
    fetch('data/people.txt', { cache: 'no-cache' }).then(r => r.text()),
    fetch('data/news.txt', { cache: 'no-cache' }).then(r => r.text())
  ]).then(([peopleText, newsText]) => {
    // Build names + aliases from people.txt
    const names = [];
    peopleText.split(/\r?\n/).forEach(line => {
      const t = line.trim();
      if (!t || t.startsWith('#')) return;
      if (/^people$/i.test(t)) return;

      const parts = t.split('|').map(x => x.trim());
      if (parts.length >= 2) {
        const baseName = parts[1];
        if (baseName) names.push(baseName);

        // look for alias=... in the remaining columns
        for (let i = 2; i < parts.length; i++) {
          const p = parts[i] || '';
          if (/^alias=/i.test(p)) {
            const aliases = p.replace(/^alias=/i, '')
              .split(',')
              .map(s => s.trim())
              .filter(Boolean);
            names.push(...aliases);
          }
        }
      }
    });

    // longer names first to avoid partial overlaps
    names.sort((a, b) => b.length - a.length);


    // Parse news
    const lines = newsText.trim().split('\n');
    let html = '';

    lines.forEach(line => {
      if (!line || line.trim().startsWith('#')) return;

      const parts = line.split('|').map(p => p.trim());
      if (parts.length >= 5) {
        const [rawTitle, rawDateStr, rawDesc, image = '', altTag = '', maybeLink = ''] = parts;

        const linkUrl = (maybeLink || '').startsWith('news_link=')
          ? maybeLink.replace(/^news_link=/i, '').trim()
          : '';

        const altText = (altTag || '').replace(/^alt=/i, '').trim() || '';

        const hasImage = image && image !== '-';
        const media = hasImage
          ? `<img class="news-thumb" src="images/${image}" alt="${escapeHtml(altText)}">`
          : `<div class="news-thumb placeholder" aria-hidden="true"></div>`;

        const dateObj = parseUSDate(rawDateStr);
        const formattedDate = isNaN(dateObj)
          ? 'Date unavailable'
          : new Intl.DateTimeFormat(userLocale, {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }).format(dateObj);

        const linkHtml = linkUrl
          ? `<p><a href="${escapeHtml(linkUrl)}" target="_blank" rel="noopener">Read more →</a></p>`
          : '';

        // Render markdown safely
        const titleHtml = renderMarkdownSafe(rawTitle);
        const descHtml  = renderMarkdownSafe(rawDesc);

        // Apply robust bolding that avoids partial overlaps/double-wrapping
        const titleOut = boldNamesInHTML(titleHtml, names);
        const descOut  = boldNamesInHTML(descHtml, names);

        html += `
          <div class="news-post">
            ${media}
            <div class="news-text">
              <h4 class="news-title">${titleOut}</h4>
              <p class="news-date">${formattedDate}</p>
              ${descOut}
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
      const buckets = { current: [], alumni: [] };

      const escapeHtml = s => String(s)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;')
        .replace(/'/g,'&#39;');

      const DOC_BASE = 'documents/';

      function resolveDocHref(val) {
        if (!val) return '';
        const v = val.trim();

        // 1) Absolute URLs or site-absolute paths: return as-is
        if (/^https?:\/\//i.test(v)) return v;
        if (v.startsWith('/')) return v;

        // 2) Strip any leading "./" or "/" first
        let clean = v.replace(/^\.?\/*/, '');

        // 3) If it already starts with our base, don't add it again
        if (clean.toLowerCase().startsWith(DOC_BASE.toLowerCase())) {
          return clean; // e.g., "documents/Yuhan-dissertation_2024.pdf"
        }

        // 4) Otherwise, treat as a filename under documents/
        return DOC_BASE + clean; // e.g., "Yuhan-..." -> "documents/Yuhan-..."
      }


      lines.forEach((line, index) => {
        // skip comments / blank lines
        if (!line || line.trim().startsWith('#')) return;

        // Split and trim, but don't assume all columns exist
        const parts = line.split('|').map(p => p.trim());

        // Expected base columns (any may be missing)
        const group = (parts[0] || '').toLowerCase();
        const name = parts[1] || '';
        const role = parts[2] || '';
        const description = parts[3] || '';

        // Remaining fields may include: image filename, alt=..., site=..., doc=...
        // Accept them in any order. First non key=value after index 3 is treated as image.
        let image = '';
        let altText = '';
        let site = '';
        let dissertation = ''; // NEW

        for (let i = 4; i < parts.length; i++) {
          const p = parts[i];
          if (/^alt=/i.test(p)) {
            altText = p.replace(/^alt=/i, '').trim();
          } else if (/^site=/i.test(p)) {
            site = p.replace(/^site=/i, '').trim();
          } else if (/^doc=/i.test(p)) {               // NEW
            dissertation = p.replace(/^doc=/i, '').trim();
          } else if (!image && p) {
            // treat as image filename if it looks like one; otherwise ignore quietly
            image = p;
          }
        }

        // Default alt text only if we actually have an image to label
        if (!altText && image) {
          altText = name ? `${name} headshot` : 'Headshot';
        }

        // Description handling
        const isLong = description && description.length > 120;
        const short = isLong ? description.slice(0, 120) + '…' : (description || '');

        // Click/keyboard handlers only when there’s something to expand
        const interactiveAttrs = isLong
          ? `tabindex="0" role="button" aria-expanded="false"
             onclick="togglePersonDescription(${index})"
             onkeydown="if(event.key==='Enter'||event.key===' ') togglePersonDescription(${index})"`
          : '';

        const titleHtml = site
          ? `<a href="${site}" target="_blank" rel="noopener">${name}</a>`
          : name;

        // Render image tag only if we have an image filename
        const imageHtml = image
          ? `<img src="images/${image}" alt="${altText}" loading="lazy" decoding="async">`
          : '';

        // Render description block only if there’s any description text
        const descriptionHtml = description
          ? `<p id="desc-${index}" class="description" data-full="${description}">${short}</p>`
          : '';

        // Render hint only when expandable
        const hintHtml = isLong
          ? `<p id="hint-${index}" class="toggle-hint">(Click to expand)</p>`
          : '';

        const roleHtml = role
          ? `<p class="role">${
              role.split(';')
                  .map(s => s.trim())
                  .filter(Boolean)
                  .map(escapeHtml)
                  .join('<br>')
            }</p>`
          : '';

        // NEW: dissertation link only for alumni rows; supports URL or local file
        const dissertationHref = resolveDocHref(dissertation);
        const dissertationHtml =
          group === 'alumni' && dissertationHref
            ? `<p class="dissertation"><a href="${escapeHtml(dissertationHref)}" target="_blank" rel="noopener">Dissertation</a></p>`
            : '';


        const card = `
          <div class="person-card" ${interactiveAttrs}>
            ${imageHtml}
            <h4>${titleHtml || 'Unnamed'}</h4>
            ${roleHtml}
            ${descriptionHtml}
            ${dissertationHtml}
            ${hintHtml}
          </div>
        `;

        if (group === 'alumni') buckets.alumni.push(card);
        else buckets.current.push(card); // default bucket
      });

      const tabs = `
        <div class="tabs" role="tablist" aria-label="People sections">
          <button class="tab active" role="tab" aria-selected="true" data-tab="current">Current Lab Members</button>
          <button class="tab" role="tab" aria-selected="false" data-tab="alumni">Alumni and Friends</button>
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
      `;

      document.getElementById('main-content').innerHTML = html;

      // tab wiring
      document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.tab').forEach(b => {
            const on = b === btn;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', on ? 'true' : 'false');
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
              ? `<div class="project-pubs"><strong>Select works:</strong> ${mdLinks(item.pubs)}</div>`
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
        <h2>Ongoing Projects</h2>
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
    // --- helpers (unchanged) ---
    const isComment = s => /^\s*#/.test(s);
    const escapeHtml = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const isYear = s => /^\d{4}\s*$/.test(s);
    const isSection = s => /^=+/.test(s);
    const isHeader = s => /^>>\s*(.+)$/.test(s);   // NEW: custom header marker

    // author splitting
    function formatAuthors(raw) {
      if (!raw) return '';
      // split on commas, "&", or "and" (with spaces), collapsing extras
      const parts = raw
        .replace(/\bet\s+al\.?$/i, '').trim()            // (optional) drop trailing "et al."
        .split(/\s*,\s*|\s*&\s*|\s+\band\b\s+/i)
        .map(s => s.trim())
        .filter(Boolean);
      if (parts.length <= 1) return parts[0] || '';
      if (parts.length === 2) return `${parts[0]} & ${parts[1]}`;
      return `${parts.slice(0, -1).join(', ')}, & ${parts[parts.length - 1]}`;
    }

    // Build lab names
    const names = [];
    peopleText.split(/\r?\n/).forEach(line => {
      const t = line.trim();
      if (!t || isComment(t)) return;
      if (/^people$/i.test(t)) return;
      const parts = t.split('|').map(x => x.trim());
      if (parts.length >= 2) {
        const name = parts[1];
        if (name) names.push(name);
      }
    });
    names.sort((a, b) => b.length - a.length);

    function boldLabMembers(authorsEscaped) {
      let out = authorsEscaped;
      for (const n of names) {
        const pat = new RegExp(`(^|[^\\w])(${escRe(n)})(?=$|[^\\w])`, 'g');
        out = out.replace(pat, (_, pre, match) => `${pre}<strong>${match}</strong>`);
      }
      return out;
    }

    // --- parsing groups by either custom header or year ---
    const byGroup = Object.create(null);  // key -> entries[]
    const groupOrder = [];                // display order
    const groupLabel = Object.create(null); // key -> <h3> label text
    let currentKey = '';

    function ensureGroup(key, label) {
      if (!byGroup[key]) {
        byGroup[key] = [];
        groupOrder.push(key);
        groupLabel[key] = label;
      }
      currentKey = key;
    }

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

      if (isHeader(line)) {
        const label = line.match(/^>>\s*(.+)$/)[1];
        ensureGroup(`h:${groupOrder.length+1}`, label);
        return;
      }

      if (isYear(line)) {
        const yr = line.match(/\d{4}/)[0];
        ensureGroup(`y:${yr}`, yr);
        return;
      }

      if (!currentKey) return; // ignore entries before the first header/year
      byGroup[currentKey].push(parseEntry(line));
    });

    // --- rendering (mostly same, but iterate groups) ---
    const labelFor = f => {
      const lc = f.toLowerCase();
      if (lc.includes('abstract')) return '[abstract]';
      if (lc.includes('poster')) return '[poster]';
      if (lc.includes('presentation'))  return '[slides]';
      if (lc.includes('slides')) return '[slides]';
      if (lc.includes('paper'))  return '[paper]';
      return '[pdf]';
    };

    let html = `<h2>Publications &amp; Talks</h2>`;

    const ensurePeriod = s => s ? (/[.?!]\s*$/.test(s) ? s : s + '.') : '';

    groupOrder.forEach(key => {
      const items = byGroup[key];
      if (!items || !items.length) return;

      html += `<section class="pubs-year"><h3>${escapeHtml(groupLabel[key])}</h3><ul class="pubs-list">`;

      items.forEach(it => {
        //normalize first, then escape + bold
        const normalizedAuthors = formatAuthors(it.authors);
        const authorsEsc = escapeHtml(normalizedAuthors);
        const boldedAuthors = boldLabMembers(authorsEsc);


        const links = [];
        (it.files || []).forEach(f => {
          const href = /^https?:\/\//i.test(f) ? f : `documents/${f}`;
          links.push(`<a href="${href}" target="_blank" rel="noopener">${labelFor(f)}</a>`);
        });
        if (it.extLink) links.push(`<a href="${it.extLink}" target="_blank" rel="noopener">[link]</a>`);

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