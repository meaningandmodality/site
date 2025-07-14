# meaning-language

Website for the Meaning & Modality Linguistics Laboratory at Harvard University!

## Folder Structure

- `index.html` — main HTML file and site entry point
- `main.js` — all routing + loading logic
- `CSS/style.css` — styles for layout and design
- `partials/` — reusable HTML blocks (header, footer, home)
- `data/` — content files editable by lab members
- `images/` — team photos, news images, etc.
- `archive/`— old files to store without updating

## Updating the site

Lab members can edit content without touching code through `.txt` files in the folder called **data**:

- To update **people**: edit `data/people.txt`
- To update **news** (which lives on **home**): edit `data/news.txt`
- To update **publications**: edit `data/publications.txt`
- To update **research**: edit `data/research.txt`

Each `.txt` file uses a consistent format (see example inside the file). Comment lines beginning with `#` are ignored.

The opening welcome message on **home** is editable in HTML through `partials/home.html`.
