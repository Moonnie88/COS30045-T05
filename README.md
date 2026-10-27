# COS30045 – T05: Four D3 Charts on One Page

**Live demo:** [https://cos30045-t05-ivory.vercel.app/](https://cos30045-t05-ivory.vercel.app/)

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
js/line-chart.js      – line chart: average price line; region checkboxes, "show all" and year menu; click a year to compare regions
js/bar-chart.js       – bar chart: loads the 55" CSV, draws bars, axes and value labels, redraws on resize
js/scatter-chart.js   – scatter plot: dots coloured by screen tech; screen-size buttons and tech checkboxes; hover tooltip
js/donut-chart.js     – donut chart: average energy by screen tech (default) or share of models with size buttons; click a slice or legend item
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
| 4 | Donut | `Ex5_TV_energy_Allsizes_byScreenType.csv` and `Ex5_TV_energy.csv` | Average energy use by screen technology, all TVs (kWh per year), with a second view for the share of TV models |

**Why the donut has two views:** the brief asks for the donut to show energy consumption by screen technology across all TVs, so that is the default view (LCD 306, LED 356, OLED 533 kWh/year). These are averages, so they do not add up to a meaningful whole: the slices only compare the three values, and the chart labels them in kWh, not as percentages, so OLED is not read as "45% of" something. The **Share of models** view is a true part-to-whole (all registered TVs), and answers "what will I mostly find in the shop?". The all-sizes averages also show why the bar chart uses 55" TVs only: OLED TVs tend to be larger, so across all sizes OLED looks 177 kWh worse than LED, but at 55" the gap is 57 kWh.

## Data files

All four files were provided with COS30045 Exercise 5.

| File | Rows | Columns |
|------|------|---------|
| `Ex5_TV_energy.csv` | 587 | `brand`, `screen_tech`, `screensize` (inches), `energy_consumpt` (kWh/year), `star2` (star rating), `count` (number of models) |
| `Ex5_TV_energy_55inchtv_byScreenType.csv` | 3 | `Screen_Tech`, `Mean(Labelled energy consumption (kWh/year))` – 55" TVs only |
| `Ex5_TV_energy_Allsizes_byScreenType.csv` | 3 | Same columns, all screen sizes |
| `Ex5_ARE_Spot_Prices.csv` | 27 (1998–2024) | `Year`, one column per region ($ per megawatt hour), `Average Price (notTas-Snowy)` |

### Data notes

- **Source:** the four CSV files were provided by my COS30045 tutor for Exercise 5.
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
|27/10/2026     | Claude Code | - line chart: start with the average line only; add region checkboxes (one colour each, more than one at a time), "Show all regions" and "Average only" buttons and a year menu; click a year to show every region's value in that year | - suggested these changes myself because the grey lines were confusing and showed too much at once; checked the region values for a few years against the CSV |
|27/10/2026     | Claude Code | - line chart: add an Average checkbox to hide the average line; when regions are ticked, a chosen year lists only those regions under the hint text; hover shows every line that is switched on | - asked for both changes myself; checked the readout with two regions ticked and with the average hidden |
|27/10/2026     | Claude Code | - scatter plot: add `scatter-chart.js` (stars vs energy, dots in the bar chart's technology colours, screen-size buttons, technology checkboxes, hover tooltip); check whether the pattern is clearer within one screen size | - kept the screen-size filter because the correlation is much stronger within a size group (about −0.7 to −0.8) than for all sizes (−0.47), which matches my T03 advice to compare stars within a size; changed the title to say so |
|27/10/2026     | Claude Code | - donut chart: add `donut-chart.js` (share of models by screen technology in the same colours, total in the centre, screen-size buttons like the scatter plot, click a slice or legend item to see its share) | - checked the shares against the CSV (all sizes: LED 84.5%, LCD 8.6%, OLED 6.9%; no OLED up to 32") |
|27/10/2026     | Claude Code | - donut chart: compare it with the task brief; add the brief's "average energy use, all TVs" view from `Ex5_TV_energy_Allsizes_byScreenType.csv` as the default, keep "share of models" as a second view, and update the README | - I noticed the donut did not match the brief (energy, not model counts) and chose to keep both views; checked the energy values (306, 356, 533) against the CSV |
|27/10/2026     | Claude Code | - review the conclusion wording; rewrite it so each recommendation points to a chart and a number, in the site's voice | - agreed to the rewrite; checked the numbers (all TVs up to 32" under 200 kWh, the 17 groups over 1,000 kWh are all 75" or larger) |

### Reflection

<!-- Write a short reflection: how helpful was the tool, what did it get wrong, what did you learn? -->
AI tools still do some mistake in design such as using the same colours for the chart like the bar chart or the line chart. It focused more on the data showing but not user friendly design. Data are there but the design and visualization is more towards a simple design. I have learnt to not mainly following with what was given but test it in the first place and change it accordingly. Other than that, AI tool does not know what user want and I act as one and think more on humanly side on what feels like easy to use and understand.