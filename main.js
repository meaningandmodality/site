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
  } else if (page === 'research') { //testing this!!
    loadResearch();
  } else if (page === 'publications') {
    loadPublications(); // <-- use the tabbed parser
  } else if (page === 'contact') {
    loadStructuredContent('data/contact.txt');
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

function loadStructuredContent(txtFile) {
  fetch(txtFile)
    .then(res => res.text())
    .then(text => {
      const lines = text.trim().split('\n');
      let html = '';
      let currentClass = '';
      let subheadingPrinted = false;

      lines.forEach(line => {
        const trimmed = line.trim();
        const keyword = trimmed.toLowerCase();

        if (!trimmed || trimmed.startsWith('#')) return;

        // Main section starters
        if (keyword === 'welcome') {
          if (currentClass) html += '</div>';
          html += '<div class="intro"><h2>Welcome</h2>';
          currentClass = 'intro';
          subheadingPrinted = false;
        } else if (keyword === 'publications') {
          if (currentClass) html += '</div>';
          html += '<div class="pubs"><h2>Publications</h2><ul>';
          currentClass = 'pubs';
          subheadingPrinted = false;
        } else if (keyword === 'team') {
          if (currentClass) html += '</div>';
          html += '<div class="team"><h2>Team</h2><ul class="people-list">';
          currentClass = 'team';
          subheadingPrinted = false;
        } 
        
        //else if (keyword === 'ongoing projects') {
        //  if (currentClass) html += '</div>';
        //  html += '<div class="projects"><h2>Ongoing Projects</h2><ul>';
        //  currentClass = 'projects';
        //  subheadingPrinted = false;
        //} 
        
        else if (keyword === 'how to get involved') {
          if (currentClass) html += '</div>';
          html += '<div class="contact"><h2>How to Get Involved</h2>';
          currentClass = 'contact';
          subheadingPrinted = false;
        } else if (/^\d{4}$/.test(trimmed)) {
          if (currentClass === 'pubs' || currentClass === 'projects') html += '</ul>';
          html += `<h3>${trimmed}</h3><ul>`;
          subheadingPrinted = false;
        }

        // Subheading that shouldn't duplicate main heading
        else if (
          trimmed &&
          !trimmed.includes('|') &&
          !subheadingPrinted &&
          trimmed.toLowerCase() !== currentClass &&
          trimmed.toLowerCase() !== 'ongoing projects'
        ) {
          html += `<h3>${trimmed}</h3>`;
          subheadingPrinted = true;
        }

        // Content rows
    else if (currentClass === 'pubs' || currentClass === 'projects') {
          const [a, b, c, d, e, f] = trimmed.split('|').map(p => p.trim());
        html += `<li><strong>${a}</strong> ${b} ${c || ''}`;

        if (d) {
          const label = d.endsWith('.pdf') ? 'pdf' : d.split('.').pop();
          html += ` <a href="documents/${d}">[${label}]</a>`;
        }

        if (e && e.startsWith('http')) {
          html += ` <a href="${e}" target="_blank" rel="noopener">[link]</a>`;
        }

        if (f) {
          const label = f.endsWith('.pdf') ? 'pdf' : f.split('.').pop();
          html += ` <a href="documents/${f}">[${label}]</a>`;
        }

        html += '</li>';
    } else if (currentClass === 'team') {
          const [name, role, email] = trimmed.split('|').map(p => p.trim());
          html += `<li><strong>${name}</strong> – ${role}<br><em>${email || ''}</em></li>`;
        } else {
          html += `<p>${trimmed}</p>`;
        }
      });

      if (currentClass) {
        if (['pubs', 'projects', 'team'].includes(currentClass)) html += '</ul>';
        html += '</div>';
      }

      document.getElementById("main-content").innerHTML = html;
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

// === RESEARCH === (testing this!!)
function loadResearch() {
  fetch('data/research.txt')
    .then(res => res.text())
    .then(text => {
      const lines = text.trim().split('\n');
      let html = '<h2>Ongoing Projects</h2><div class="project-grid">';

      lines.forEach((line, index) => {
        if (line.startsWith('#') || !line.trim()) return;

        const parts = line.split('|').map(p => p.trim());
        if (parts.length === 3) {
          const [title, mini, long] = parts;

          html += `
            <div class="project-card" tabindex="0" role="button" aria-expanded="false"
              onclick="toggleDescription(${index})"
              onkeydown="if(event.key==='Enter'||event.key===' ') toggleDescription(${index})">
              <h4>${title}</h4>
              <p class="description">
                ${mini}
                <span id="long-${index}" class="long-text" style="display: none;"> ${long}</span>
              </p>
              <p id="hint-${index}" class="toggle-hint">(More information)</p>
            </div>
          `;
        }
      });

      html += '</div>';
      document.getElementById('main-content').innerHTML = html;
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
  fetch('data/publications.txt')
    .then(r => r.text())
    .then(raw => {
      // -------- helpers --------
      const trim  = s => (s || '').trim();
      const scrub = s => trim(
        s.replace(/\uFEFF/g, '')
         .replace(/[\u200B-\u200D\u2060]/g, '')
         .replace(/\u00A0/g, ' ')
      );
      const toKey = s => scrub(s).replace(/[^A-Za-z]/g, '').toUpperCase(); // "== Talks ==" -> "TALKS"
      const isYear = s => /^\d{4}$/.test(s);
      const isBlankOrComment = s => !s || s.startsWith('#');

      const isURL = t => /^https?:\/\//i.test(t);
      const labeledURL = t => t.match(/^\[(.+?)\](https?:\/\/.+)$/i);
      const labeledFile = t => t.match(/^\[(.+?)\](.+)$/);
      const isFile = t => /\.(pdf|pptx?|docx?|zip|png|jpe?g)$/i.test(t);

      // -------- parse into two sections --------
      const lines = raw.split('\n');
      let section = 'pubs'; // 'pubs' or 'talks'
      let year = '';
      const buckets = { pubs: {}, talks: {} }; // e.g., buckets.pubs['2025'] = [liHTML, ...]

      const push = (sec, yr, li) => {
        if (!buckets[sec][yr]) buckets[sec][yr] = [];
        buckets[sec][yr].push(li);
      };

      for (let line0 of lines) {
        const line = scrub(line0);
        if (isBlankOrComment(line)) continue;

        const key = toKey(line);
        if (key === 'PUBLICATIONS') { section = 'pubs'; year = ''; continue; }
        if (key === 'TALKS')        { section = 'talks'; year = ''; continue; }

        if (isYear(line)) { year = line; continue; }

        // ----- tolerant entry parsing -----
        let authors = '', title = '', venue = '', extra = [];
        if (line.includes('|')) {
          const parts = line.split('|').map(trim);
          authors = parts[0] || '';
          title   = parts[1] || '';
          venue   = parts[2] || '';
          extra   = parts.slice(3).filter(Boolean);
        } else {
          title = line; // no pipes: treat as free-text title
        }

        const files = [];
        const links = [];
        for (const tok0 of extra) {
          const tok = trim(tok0);
          if (!tok) continue;
          let m;
          if ((m = labeledURL(tok))) { links.push({label: m[1], url: m[2]}); continue; }
          if (isURL(tok))            { links.push({label: 'link', url: tok}); continue; }
          if ((m = labeledFile(tok))){ files.push({label: m[1], path: m[2]}); continue; }
          if (isFile(tok))           { files.push({label: tok.split('.').pop().toLowerCase(), path: tok}); continue; }
          venue = venue ? `${venue} ${tok}` : tok; // fold unknown back into venue
        }

        let li = '<li>';
        if (authors) li += `<strong>${authors}</strong> `;
        if (title)   li += `${title}`;
        if (venue)   li += ` | ${venue}`;
        for (const f of files) li += ` <a href="documents/${f.path}" target="_blank" rel="noopener">[${f.label}]</a>`;
        for (const l of links) li += ` <a href="${l.url}" target="_blank" rel="noopener">[${l.label}]</a>`;
        li += '</li>';

        const yr = year || 'Misc';
        push(section, yr, li);
      }

      // -------- render tabs + panels --------
      const params = new URLSearchParams(window.location.search);
      const wantTab = (params.get('tab') || '').toLowerCase();
      const activeTab = (wantTab === 'talks') ? 'talks' : 'pubs';

      const renderSection = (secName, secKey) => {
        const years = Object.keys(buckets[secKey]).sort((a,b) => b.localeCompare(a)); // newest first
        if (years.length === 0) return `<p>No ${secName.toLowerCase()} yet.</p>`;
        let html = '';
        for (const y of years) {
          html += `<h3>${y}</h3><ul>${buckets[secKey][y].join('')}</ul>`;
        }
        return html;
      };

      const tabs = `
        <div class="tabs" role="tablist" aria-label="Publications / Talks">
          <button class="tab ${activeTab==='pubs'?'active':''}" role="tab" aria-selected="${activeTab==='pubs'}" data-tab="pubs">Publications</button>
          <button class="tab ${activeTab==='talks'?'active':''}" role="tab" aria-selected="${activeTab==='talks'}" data-tab="talks">Talks</button>
        </div>
      `;

      const panelPubs  = `<div class="tab-panel ${activeTab==='pubs'?'active':''}" role="tabpanel" data-panel="pubs"><div class="pubs">${renderSection('Publications','pubs')}</div></div>`;
      const panelTalks = `<div class="tab-panel ${activeTab==='talks'?'active':''}" role="tabpanel" data-panel="talks"><div class="pubs">${renderSection('Talks','talks')}</div></div>`;

      const outer = `
        <h2>Publications & Talks</h2>
        ${tabs}
        ${panelPubs}
        ${panelTalks}
      `;
      const mount = document.getElementById('main-content');
      mount.innerHTML = outer;

      // wire up tabs + update URL ?tab=
      document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-tab');

          document.querySelectorAll('.tab').forEach(b => {
            const on = b === btn;
            b.classList.toggle('active', on);
            b.setAttribute('aria-selected', on ? 'true':'false');
          });
          document.querySelectorAll('.tab-panel').forEach(p => {
            p.classList.toggle('active', p.getAttribute('data-panel') === target);
          });

          const q = new URLSearchParams(window.location.search);
          q.set('tab', target);
          history.replaceState(null, '', `${location.pathname}?${q.toString()}`);
        });
      });
    })
    .catch(err => {
      console.error(err);
      document.getElementById('main-content').innerHTML =
        '<p>Could not load Publications & Talks right now.</p>';
    });
}