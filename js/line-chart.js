// Line chart: yearly electricity spot prices, 1998–2024
// Data: data/Ex5_ARE_Spot_Prices.csv
// Starts with the average line only. The controls above the chart add region lines and pick a year.

const lineContainer = d3.select("#line-chart");
const lineControls = d3.select("#line-controls");
const yearReadout = d3.select("#line-year-readout");

// The four regions in the average column (Tasmania and Snowy are left out because of their gaps).
// Colours are from the Okabe-Ito colour-blind-safe palette, and are not the screen technology colours.
const regions = [
    { name: "Queensland",      column: "Queensland ($ per megawatt hour)",      colour: "#cc79a7" },   // pink-purple
    { name: "New South Wales", column: "New South Wales ($ per megawatt hour)", colour: "#0072b2" },   // blue
    { name: "Victoria",        column: "Victoria ($ per megawatt hour)",        colour: "#009e73" },   // green
    { name: "South Australia", column: "South Australia ($ per megawatt hour)", colour: "#d55e00" }    // red-orange
];
const averageColour = "#5a4630";   // same as --brown-dark in css/styles.css

const formatPrice = d3.format("$.2f");   // 41.5 → "$41.50"

// What the user has chosen. Kept outside drawLineChart so it survives a redraw on resize.
let showAverage = true;           // the Average checkbox
const shownRegions = new Set();   // names of the ticked regions (empty = no region lines)
let selectedYear = null;          // clicked or chosen year (null = all years)

// The regions to list when a year is chosen: the ticked ones, or all four if none are ticked
const regionsToCompare = () =>
    shownRegions.size > 0 ? regions.filter(r => shownRegions.has(r.name)) : regions;

// 1. Load the CSV: one object per year, with the region names as keys
d3.csv("data/Ex5_ARE_Spot_Prices.csv", d => {
    const row = {
        year: +d.Year,
        average: +d["Average Price (notTas-Snowy)"]
    };
    regions.forEach(r => {
        row[r.name] = +d[r.column];
    });
    return row;
}).then(data => {
    console.log("line chart data:", data);

    // 2. Redraw when the container changes width. redraw() is also called when a control changes.
    let lastWidth = 0;
    const redraw = () => drawLineChart(data, lastWidth, redraw);

    buildLineControls(data, redraw);

    const observer = new ResizeObserver(entries => {
        const width = Math.floor(entries[0].contentRect.width);
        if (width === lastWidth) return;
        lastWidth = width;
        redraw();
    });
    observer.observe(lineContainer.node());
});

// 3. Build the controls once: Average and region checkboxes, two buttons and the year menu
function buildLineControls(data, redraw) {
    const options = lineControls.select(".region-options");

    // Average checkbox first
    const averageOption = options.append("label")
        .attr("class", "region-option");

    averageOption.append("input")
        .attr("type", "checkbox")
        .attr("id", "show-average")
        .on("change", event => {
            showAverage = event.target.checked;
            redraw();
        });

    averageOption.append("span")
        .attr("class", "swatch")
        .style("background-color", averageColour);

    averageOption.append("span")
        .text("Average");

    // Then one checkbox per region, with a colour swatch that doubles as the legend
    const regionOptions = options.selectAll("label.region")
        .data(regions)
        .join("label")
        .attr("class", "region-option region");

    regionOptions.append("input")
        .attr("type", "checkbox")
        .attr("class", "region-checkbox")
        .on("change", (event, r) => {
            if (event.target.checked) {
                shownRegions.add(r.name);
            } else {
                shownRegions.delete(r.name);
            }
            redraw();
        });

    regionOptions.append("span")
        .attr("class", "swatch")
        .style("background-color", r => r.colour);

    regionOptions.append("span")
        .text(r => r.name);

    lineControls.select("#show-all-regions").on("click", () => {
        showAverage = true;
        regions.forEach(r => shownRegions.add(r.name));
        redraw();
    });

    lineControls.select("#average-only").on("click", () => {
        showAverage = true;
        shownRegions.clear();
        redraw();
    });

    // Year menu: "All years" is already in the HTML, one <option> per year is added here
    const yearSelect = lineControls.select("#line-year");
    yearSelect.selectAll("option.year-option")
        .data(data)
        .join("option")
        .attr("class", "year-option")
        .attr("value", d => d.year)
        .text(d => d.year);

    yearSelect.on("change", event => {
        selectedYear = event.target.value === "all" ? null : +event.target.value;
        redraw();
    });
}

// Make the checkboxes and the year menu match the current choices
// (needed because the buttons and chart clicks change the choices too)
function syncLineControls() {
    lineControls.select("#show-average")
        .property("checked", showAverage);

    lineControls.selectAll(".region-checkbox")
        .property("checked", r => shownRegions.has(r.name));

    lineControls.select("#line-year")
        .property("value", selectedYear === null ? "all" : selectedYear);
}

// 4. Draw the whole chart at the given width
function drawLineChart(data, width, redraw) {
    const height = Math.max(240, Math.min(340, width * 0.7));
    const margin = { top: 28, right: 64, bottom: 50, left: 64 };   // right margin leaves room for the "Average" label
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Every line that is switched on, as { name, key, colour }. Used by the hover dots and tooltip.
    const shownLines = [];
    if (showAverage) {
        shownLines.push({ name: "Average", key: "average", colour: averageColour });
    }
    regions.filter(r => shownRegions.has(r.name)).forEach(r => {
        shownLines.push({ name: r.name, key: r.name, colour: r.colour });
    });

    lineContainer.selectAll("*").remove();

    const svg = lineContainer.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("role", "img")
        .attr("aria-label", "Line chart of the average yearly electricity spot price, from " +
            formatPrice(data[0].average) + " per MWh in " + data[0].year + " to " +
            formatPrice(data[data.length - 1].average) + " in " + data[data.length - 1].year);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Scales: year → x, price → y
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))   // [1998, 2024]
        .range([0, innerWidth]);

    // The top is the highest REGION price, even when only the average is shown,
    // so the axis doesn't jump when lines are switched on and off
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(regions, r => d[r.name]))])
        .nice()
        .range([innerHeight, 0]);

    // Axes. The y ticks stretch across the chart (tickSize = -innerWidth) to make light gridlines
    chart.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale)
            .ticks(width < 500 ? 5 : 8)          // fewer year labels on narrow screens
            .tickFormat(d3.format("d")));        // "1998", not "1,998"

    chart.append("g")
        .attr("class", "axis grid")
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickPadding(8))
        .call(g => g.select(".domain").remove());

    chart.append("text")
        .attr("class", "axis-title")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 42)
        .attr("text-anchor", "middle")
        .text("Year");

    chart.append("text")
        .attr("class", "axis-title")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -margin.left + 16)
        .attr("text-anchor", "middle")
        .text("Spot price ($ per MWh)");

    // Nothing ticked: say so instead of showing an empty chart
    if (shownLines.length === 0) {
        chart.append("text")
            .attr("class", "empty-message")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight / 2)
            .attr("text-anchor", "middle")
            .text("Tick Average or a region above to show a line");
    }

    // 5. Lines. lineFor("average") returns a line generator that reads d.average for each year
    const lineFor = key => d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d[key]));

    // Only the ticked regions, each in its own colour, drawn before the average so it stays on top
    chart.selectAll(".line-region")
        .data(regions.filter(r => shownRegions.has(r.name)))
        .join("path")
        .attr("class", "line-region")
        .style("stroke", r => r.colour)
        .attr("d", r => lineFor(r.name)(data));

    const last = data[data.length - 1];

    if (showAverage) {
        chart.append("path")
            .attr("class", "line-average")
            .attr("d", lineFor("average")(data));

        chart.append("text")
            .attr("class", "line-label")
            .attr("x", xScale(last.year) + 8)
            .attr("y", yScale(last.average))
            .attr("dominant-baseline", "middle")
            .text("Average");
    }

    // 6. One year chosen: a guide line and a dot for each region being compared (no average dot)
    if (selectedYear !== null) {
        const d = data.find(row => row.year === selectedYear);
        const x = xScale(selectedYear);

        chart.append("line")
            .attr("class", "year-line")
            .attr("x1", x)
            .attr("x2", x)
            .attr("y1", 0)
            .attr("y2", innerHeight);

        chart.selectAll(".year-dot")
            .data(regionsToCompare())
            .join("circle")
            .attr("class", "year-dot")
            .attr("cx", x)
            .attr("cy", r => yScale(d[r.name]))
            .attr("r", 6)
            .style("fill", r => r.colour);
    }

    // 7. Hover and click: an invisible rectangle over the plot area catches the mouse (and touch)
    const hoverLine = chart.append("line")
        .attr("class", "hover-line")
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .style("display", "none");

    // One hover dot per line that is switched on
    const hoverDots = chart.selectAll(".hover-dot")
        .data(shownLines)
        .join("circle")
        .attr("class", "hover-dot")
        .attr("r", 5)
        .style("fill", s => s.colour)
        .style("display", "none");

    const tooltip = lineContainer.append("div")
        .attr("class", "chart-tooltip")
        .style("display", "none");

    // Turns the mouse position into the nearest whole year
    const yearAt = event => Math.round(xScale.invert(d3.pointer(event)[0]));

    chart.append("rect")
        .attr("class", "hover-area")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .on("pointermove", event => {
            const d = data.find(row => row.year === yearAt(event));
            if (!d) return;

            const x = xScale(d.year);
            hoverLine.attr("x1", x).attr("x2", x).style("display", null);
            hoverDots.attr("cx", x).attr("cy", s => yScale(d[s.key])).style("display", null);

            // Tooltip: the value of each line that is switched on, then what a click does
            const values = shownLines.map(s =>
                s.key === "average"
                    ? `Average: <strong>${formatPrice(d.average)}</strong> (≈ ${(d.average / 10).toFixed(1)} c/kWh)`
                    : `${s.name}: ${formatPrice(d[s.key])}`);

            tooltip
                .style("display", null)
                .html(`<strong>${d.year}</strong><br>` +
                      values.map(v => v + "<br>").join("") +
                      `<em>${d.year === selectedYear ? "Click to show all years" : "Click to compare regions"}</em>`);

            // Show the tooltip on the side of the guide line with more room, never past the chart edges
            const tooltipWidth = tooltip.node().offsetWidth;
            const left = x < innerWidth / 2
                ? margin.left + x + 12
                : margin.left + x - tooltipWidth - 12;
            const clampedLeft = Math.max(0, Math.min(left, width - tooltipWidth));
            tooltip.style("left", `${clampedLeft}px`).style("top", `${margin.top}px`);
        })
        .on("pointerleave", () => {
            hoverLine.style("display", "none");
            hoverDots.style("display", "none");
            tooltip.style("display", "none");
        })
        .on("click", event => {
            const year = yearAt(event);
            selectedYear = (year === selectedYear) ? null : year;   // clicking the same year again clears it
            redraw();
        });

    // 8. Text under the chart, and keep the controls in step with the chart
    showYearReadout(data);
    syncLineControls();
}

// The hint always stays on the first line; when a year is chosen its values go on the line below, e.g.
// "2004 (average $36.25): New South Wales $46.00 · Victoria $29.00"
function showYearReadout(data) {
    const hint = `<span class="readout-hint">Click a year on the chart, or choose one from the Year menu, to compare the regions.</span>`;

    if (selectedYear === null) {
        yearReadout.html(hint);
        return;
    }

    const d = data.find(row => row.year === selectedYear);

    // The regions being compared, from highest to lowest price that year, each with its colour swatch
    const items = regionsToCompare()
        .map(r => ({ ...r, price: d[r.name] }))
        .sort((a, b) => b.price - a.price)
        .map(r => `<span class="readout-item"><span class="swatch" style="background-color:${r.colour}"></span>` +
                  `${r.name} ${formatPrice(r.price)}</span>`);

    const heading = showAverage
        ? `${selectedYear} (average ${formatPrice(d.average)}):`
        : `${selectedYear}:`;

    yearReadout.html(`${hint}<br>${heading} ${items.join(" ")}`);
}
