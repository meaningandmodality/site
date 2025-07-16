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

## Adding images, links, and pdfs

- Add images by dragging your file (.jpeg, .svg, .jpg, .png) into the folder called **images**. Then, type the exact filename that you see in **images** to call your file in `.txt` files where the format allows images
- Add pdfs by dragging your file (.pdf) into the folder called **documents**. Then, type the exact filename that you see in **documents** to call your file in `.txt` files where the format allows pdfs
- Add links by pasting the entire link in `.txt` files where the format allows a link

Please retitle your files to a simple and informative name before adding them to the folders! This makes it easy for everyone!

Good examples of filenames:
avi.jpeg (a photo of Avi Zimmerman, where there are no others named Avi)
harvardlogo.svg (the Harvard logo)
Sevgi_IMPRS_2024.pdf (a poster by Hande Sevgi at IMPRS in 2024)
