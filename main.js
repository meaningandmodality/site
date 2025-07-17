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
  
  if (page === 'people') {
    loadPeople();
  } else if (page === 'research') { //testing this!!
    loadResearch();
  } else if (['publications', 'contact'].includes(page)) {
    loadStructuredContent(`data/${page}.txt`);
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
        
        else if (keyword === 'contact information') {
          if (currentClass) html += '</div>';
          html += '<div class="contact"><h2>Contact Information</h2>';
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
          const [a, b, c, d] = trimmed.split('|').map(p => p.trim());
          html += `<li><strong>${a}</strong> ${b} ${c || ''}`;
          if (d) html += ` <a href="documents/${d}">[${d.split('.').pop()}]</a>`;
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
          const [title, date, description, image, altTag] = parts;
          const altText = altTag.replace(/^alt=/i, '').trim();

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
              <img src="images/${image}" alt="${altText}">
              <div class="news-text">
                <h4>${title}</h4>
                <p class="news-date">${formattedDate}</p>
                <p>${description}</p>
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
      let html = '<h2>Our Team</h2><div class="people-grid">';

      lines.forEach((line, index) => {
        if (line.startsWith('#') || !line.trim()) return;

        const parts = line.split('|').map(p => p.trim());
        if (parts.length === 5) {
          const [name, role, description, image, altPart] = parts;
          const altText = altPart.replace(/^alt=/i, '').trim();
          const isLong = description.length > 120;
          const short = isLong ? description.slice(0, 120) + '…' : description;

          html += `
            <div class="person-card" onclick="toggleDescription(${index}, ${isLong})">
              <img src="images/${image}" alt="${altText}">
              <h4>${name}</h4>
              <p class="role">${role}</p>
              <p id="desc-${index}" class="description" data-full="${description}">${short}</p>
              ${isLong ? `<p id="hint-${index}" class="toggle-hint">(Click to expand)</p>` : ''}
            </div>
          `;
        }
      });

      html += '</div>';
      document.getElementById('main-content').innerHTML = html;
    });
}

// JS function to toggle full/short description
function toggleDescription(index, isLong) {
  if (!isLong) return;

  const desc = document.getElementById(`desc-${index}`);
  const hint = document.getElementById(`hint-${index}`);
  const full = desc.getAttribute('data-full');
  const isShort = desc.textContent.endsWith('…');

  if (isShort) {
    desc.textContent = full;
    if (hint) hint.textContent = '(Click to collapse)';
  } else {
    desc.textContent = full.length > 120 ? full.slice(0, 120) + '…' : full;
    if (hint) hint.textContent = '(Click to expand)';
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
            <div class="project-card" onclick="toggleDescription(${index})">
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

  if (full.style.display === 'none') {
    full.style.display = 'inline';
    if (hint) hint.textContent = '(Less information)';
  } else {
    full.style.display = 'none';
    if (hint) hint.textContent = '(More information)';
  }
}