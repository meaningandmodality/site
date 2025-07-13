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

// === SMART ROUTER ===
function handleRouting() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('page') || 'home';

  if (page === 'people') {
    loadPeople();
  } else if (page === 'publications' || page === 'research') {
    loadStructuredContent(`data/${page}.txt`);
  } else {
    loadPage(`partials/${page}.html`);
    if (page === 'home') setTimeout(loadNews, 150);
  }
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

      lines.forEach(line => {
        if (line.startsWith('#') || !line.trim()) return;
        const trimmed = line.trim();
        const keyword = trimmed.toLowerCase();

        if (/^\d{4}$/.test(trimmed)) {
          if (['pubs', 'projects', 'team'].includes(currentClass)) html += '</ul>';
          html += `<h3>${trimmed}</h3><ul>`;
          return;
        }

        if (keyword === 'welcome') {
          if (currentClass) html += '</div>';
          html += '<div class="intro"><h2>Welcome</h2>';
          currentClass = 'intro';
        } else if (keyword === 'publications') {
          if (currentClass) html += '</div>';
          html += '<div class="pubs"><h2>Publications</h2><ul>';
          currentClass = 'pubs';
        } else if (keyword === 'team') {
          if (currentClass) html += '</div>';
          html += '<div class="team"><h2>Team</h2><ul class="people-list">';
          currentClass = 'team';
        } else if (keyword === 'research') {
          if (currentClass) html += '</div>';
          html += '<div class="projects"><h2>Research</h2><ul>';
          currentClass = 'projects';
        } else if (trimmed) {
          if (currentClass === 'pubs' || currentClass === 'projects') {
            const [a, b, c, d] = trimmed.split('|').map(p => p.trim());
            html += `<li><strong>${a}</strong> ${b} ${c || ''}`;
            if (d) html += ` <a href="Documents/${d}">[${d.split('.').pop()}]</a>`;
            html += '</li>';
          } else if (currentClass === 'team') {
            const [name, role, email] = trimmed.split('|').map(p => p.trim());
            html += `<li><strong>${name}</strong> – ${role}<br><em>${email || ''}</em></li>`;
          } else {
            html += `<p>${trimmed}</p>`;
          }
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
          html += `
            <div class="news-post">
              <img src="images/${image}" alt="${altText}">
              <div class="news-text">
                <h4>${title}</h4>
                <p class="news-date">${date}</p>
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
      let html = '<div class="people-grid">';

      lines.forEach(line => {
        if (line.startsWith('#') || !line.trim()) return;
        const parts = line.split('|').map(p => p.trim());
        if (parts.length === 5) {
          const [name, role, description, image, altPart] = parts;
          const altText = altPart.replace(/^alt=/i, '').trim();
          html += `
            <div class="person-card">
              <img src="images/${image}" alt="${altText}">
              <h4>${name}</h4>
              <p class="role">${role}</p>
              <p>${description}</p>
            </div>
          `;
        }
      });

      html += '</div>';
      document.getElementById('main-content').innerHTML = html;
    });
}