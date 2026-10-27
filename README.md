# COS30045 – T05: Four D3 Charts on One Page

**Live demo:** _(add the Vercel link here once deployed)_

Run it locally with VS Code **Live Server** (Go Live). `d3.csv()` cannot load the CSV files when `index.html` is opened by double-clicking.

## Aim

One web page with four D3.js charts (bar, donut, scatter and line) about TV energy use. The page is written for **Australian households buying a TV**, the same audience as my T03 data story. Each chart has a takeaway title and a short caption, and the conclusion links back to my T03 recommendations.

Every chart resizes with the browser window, and follows good data visualisation practice: labelled axes with units, sensible colours and no chart junk.

## Page structure

```
index.html            – Home page: intro, the four charts in a grid, conclusion linking to my T03 site
about.html            – About Us page
css/styles.css        – site styles (colours from the power logo); .chart-grid is 2 columns on wide screens, 1 on narrow
js/script.js          – builds the shared nav menu and footer, highlights the current page
js/line-chart.js      – line chart: average price line over grey state lines, first/last values labelled, hover tooltip per year
js/bar-chart.js       – bar chart: loads the 55" CSV, draws bars, axes and value labels, redraws on resize
js/scatter-chart.js   – scatter plot (to do)
js/donut-chart.js     – donut chart (to do)
data/                 – the CSV files provided with Exercise 5
images/PowerIcon.png  – logo and favicon
```

The charts appear in story order: power is getting more expensive → screen technology matters at the same size → stars predict energy use → what is in the shops.

## The four charts

| # | Chart | Data file | What it shows |
|---|-------|-----------|---------------|
| 1 | Line | `Ex5_ARE_Spot_Prices.csv` | Average yearly spot power price, 1998–2024 ($ per MWh) |
| 2 | Bar | `Ex5_TV_energy_55inchtv_byScreenType.csv` | Mean energy use of 55" TVs by screen technology (kWh per year) |
| 3 | Scatter | `Ex5_TV_energy.csv` | Energy use (kWh per year) against star rating |
| 4 | Donut | `Ex5_TV_energy.csv` | Share of TV models by screen technology |

**Why the donut shows models, not energy:** a donut shows parts of a whole. The mean energy figures in `Ex5_TV_energy_Allsizes_byScreenType.csv` (LCD 306, LED 356, OLED 533 kWh/year) are averages, so they do not add up to a meaningful whole, and a slice would wrongly suggest OLED is "45% of" something. Counting models per technology does make a whole (all registered TVs), so the donut answers "what will I mostly find in the shop?", and the bar chart compares energy use.

## Data files

All four files were provided with COS30045 Exercise 5.

| File | Rows | Columns |
|------|------|---------|
| `Ex5_TV_energy.csv` | 587 | `brand`, `screen_tech`, `screensize` (inches), `energy_consumpt` (kWh/year), `star2` (star rating), `count` (number of models) |
| `Ex5_TV_energy_55inchtv_byScreenType.csv` | 3 | `Screen_Tech`, `Mean(Labelled energy consumption (kWh/year))` – 55" TVs only |
| `Ex5_TV_energy_Allsizes_byScreenType.csv` | 3 | Same columns, all screen sizes |
| `Ex5_ARE_Spot_Prices.csv` | 27 (1998–2024) | `Year`, one column per region ($ per megawatt hour), `Average Price (notTas-Snowy)` |

### Data notes

- **Source:** _(add the original source given in the Exercise 5 brief)_.
- **"LED" vs "LCD (LED)":** the two summary files call LED-backlit LCD TVs `LED`, while `Ex5_TV_energy.csv` calls them `LCD (LED)`. They are the same technology; the charts label them "LED".
- **Rows are groups, not single TVs:** each row of `Ex5_TV_energy.csv` is one brand + screen technology + screen size. `count` is how many models were combined into that row (3,703 models in total), and `energy_consumpt` is their average.
- **`star2` is averaged:** because rows combine several models, star ratings are averages such as 4.05, not whole or half stars. They range from 2 to 8.
- **Tasmania and Snowy gaps:** Tasmania has no prices before 2005 and Snowy has none after 2007. The `Average Price` column is the mean of Queensland, New South Wales, Victoria and South Australia only, so it is consistent across all years.
- **Units:** $1 per MWh = 0.1 cents per kWh, so the 2024 average of $132.50/MWh is about 13 c/kWh (wholesale only; household prices also include network and retail costs).

## Use of GenAI

<!-- Keep notes here as you work. Be specific: what you asked, what it produced, what you changed. -->

| Date          | Tool        | What I asked for                 | What I changed / checked       |
|---------------|-------------|----------------------------------|--------------------------------|
|27/10/2026     | Claude Code | - describe the Exercise 5 CSV files; suggest a page layout and best-practice chart choices | - chose the donut to show the share of models (not mean energy) and redraw-on-resize with `ResizeObserver` |
|27/10/2026     | Claude Code | - make the repo T05 only: remove the T04 files, Televisions page and KNIME images; set up the four-chart layout, intro and conclusion; rewrite the README and About page | - checked the page layout on a wide and a narrow window and the link to my T03 site |
|27/10/2026     | Claude Code | - bar chart: add `bar-chart.js` (load the 55" CSV, band and linear scales, axes with units, value labels, OLED highlighted, redraw with `ResizeObserver`); explain each step | - checked the values against the CSV (326, 330, 387) and that the chart redraws when the window is resized |
|27/10/2026     | Claude Code | - bar chart: give each screen technology its own colour; click a bar to highlight it, fade the others and show how much more or less it uses than the others | - asked for the colours and the click comparison myself; checked the differences against the bar values and that the selection stays after resizing |
|27/10/2026     | Claude Code | - line chart: add `line-chart.js` (average price line over thin grey state lines, y axis from $0, light gridlines, first and last values labelled, hover tooltip with each year's prices); explain each step | - checked the 1998 and 2024 values ($41.50, $132.50) and a few tooltip years against the CSV, and the resize |

### Reflection

<!-- Write a short reflection: how helpful was the tool, what did it get wrong, what did you learn? -->
AI tools still do some mistake in design such as using the same colours for the chart like the bar chart or the line chart. It focused more on the data showing but not user friendly design. Data are there but the design and visualization is more towards a simple design. I have learnt to not mainly following with what was given but test it in the first place and change it accordingly. Other than that, AI tool does not know what user want and I act as one and think more on humanly side on what feels like easy to use and understand.