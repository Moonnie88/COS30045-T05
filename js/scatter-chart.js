// Scatter plot: energy use against star rating
// Data: data/Ex5_TV_energy.csv (each row is a group of models: one brand + screen technology + size)

const scatterContainer = d3.select("#scatter-chart");
const scatterControls = d3.select("#scatter-controls");
const scatterReadout = d3.select("#scatter-readout");

// Screen technologies, with the same colour classes as the bar chart (css/styles.css)
const techs = [
    { name: "LCD",  cssClass: "tech-lcd" },
    { name: "LED",  cssClass: "tech-led" },
    { name: "OLED", cssClass: "tech-oled" }
];

// Screen size groups for the filter buttons (sizes in the data are whole inches, e.g. 32, 43, 55, 65)
const sizeGroups = [
    { id: "all",    label: "All sizes", min: 0,  max: Infinity },
    { id: "small",  label: "Up to 32\"", min: 0,  max: 32 },
    { id: "medium", label: "33–50\"",    min: 33, max: 50 },
    { id: "large",  label: "51–65\"",    min: 51, max: 65 },
    { id: "xlarge", label: "Over 65\"",  min: 66, max: Infinity }
];

// What the user has chosen. Kept outside drawScatterChart so it survives a redraw on resize.
let selectedSize = "all";
const shownTechs = new Set(techs.map(t => t.name));   // all three ticked at the start

// 1. Load the CSV. "LCD (LED)" is renamed "LED" to match the bar chart.
d3.csv("data/Ex5_TV_energy.csv", d => ({
    brand: d.brand.toUpperCase(),
    tech: d.screen_tech === "LCD (LED)" ? "LED" : d.screen_tech,
    size: +d.screensize,
    energy: +d.energy_consumpt,
    stars: +d.star2,
    models: +d.count
})).then(data => {
    console.log("scatter data:", data.length, "rows", data[0]);

    // 2. Redraw when the container changes width, or when a control changes
    let lastWidth = 0;
    const redraw = () => drawScatterChart(data, lastWidth);

    buildScatterControls(redraw);

    const observer = new ResizeObserver(entries => {
        const width = Math.floor(entries[0].contentRect.width);
        if (width === lastWidth) return;
        lastWidth = width;
        redraw();
    });
    observer.observe(scatterContainer.node());
});

// 3. Build the controls once: size buttons and technology checkboxes
function buildScatterControls(redraw) {
    scatterControls.select(".size-buttons")
        .selectAll("button")
        .data(sizeGroups)
        .join("button")
        .attr("type", "button")
        .attr("class", "control-button")
        .text(g => g.label)
        .on("click", (event, g) => {
            selectedSize = g.id;
            redraw();
        });

    const options = scatterControls.select(".tech-options")
        .selectAll("label")
        .data(techs)
        .join("label")
        .attr("class", "filter-option");

    options.append("input")
        .attr("type", "checkbox")
        .on("change", (event, t) => {
            if (event.target.checked) {
                shownTechs.add(t.name);
            } else {
                shownTechs.delete(t.name);
            }
            redraw();
        });

    options.append("span")
        .attr("class", "swatch")
        .style("background-color", t => `var(--${t.cssClass})`);   // e.g. var(--tech-oled)

    options.append("span")
        .text(t => t.name);
}

// Make the buttons and checkboxes match the current choices
function syncScatterControls() {
    scatterControls.selectAll(".size-buttons button")
        .classed("active", g => g.id === selectedSize)
        .attr("aria-pressed", g => g.id === selectedSize);

    scatterControls.selectAll(".tech-options input")
        .property("checked", t => shownTechs.has(t.name));
}

// 4. Draw the whole chart at the given width
function drawScatterChart(data, width) {
    const height = Math.max(260, Math.min(360, width * 0.75));
    const margin = { top: 16, right: 16, bottom: 50, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Keep only the rows that match the chosen size group and ticked technologies
    const group = sizeGroups.find(g => g.id === selectedSize);
    const filtered = data.filter(d =>
        d.size >= group.min && d.size <= group.max && shownTechs.has(d.tech));

    scatterContainer.selectAll("*").remove();

    const svg = scatterContainer.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("role", "img")
        .attr("aria-label", `Scatter plot of TV energy use against star rating, ${group.label}, ` +
            `${filtered.length} groups of models`);

    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // 5. Scales. x is fixed (stars always run 2 to 8), so dots can be compared between size groups.
    //    y fits the chosen size group, because small TVs (under 200 kWh) would be squashed flat
    //    under the biggest ones (over 2,600 kWh) on one shared axis.
    const xScale = d3.scaleLinear()
        .domain([1.5, 8.5])                          // half a star of space at each end, so edge dots aren't cut
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filtered, d => d.energy) || 100])   // 100 if nothing is shown
        .nice()
        .range([innerHeight, 0]);

    // Axes with light gridlines (same idea as the line chart)
    chart.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale).ticks(7).tickFormat(d3.format("d")));

    chart.append("g")
        .attr("class", "axis grid")
        .call(d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickPadding(8))
        .call(g => g.select(".domain").remove());

    chart.append("text")
        .attr("class", "axis-title")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 42)
        .attr("text-anchor", "middle")
        .text("Star rating (more stars = more efficient)");

    chart.append("text")
        .attr("class", "axis-title")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -margin.left + 16)
        .attr("text-anchor", "middle")
        .text("Energy use (kWh per year)");

    if (filtered.length === 0) {
        chart.append("text")
            .attr("class", "empty-message")
            .attr("x", innerWidth / 2)
            .attr("y", innerHeight / 2)
            .attr("text-anchor", "middle")
            .text("Tick a screen technology above to show its TVs");
    }

    // 6. Dots: one per group of models, coloured by screen technology
    const tooltip = scatterContainer.append("div")
        .attr("class", "chart-tooltip")
        .style("display", "none");

    const radius = width < 500 ? 3.5 : 4.5;

    chart.selectAll(".dot")
        .data(filtered)
        .join("circle")
        .attr("class", d => `dot ${techs.find(t => t.name === d.tech).cssClass}`)
        .attr("cx", d => xScale(d.stars))
        .attr("cy", d => yScale(d.energy))
        .attr("r", radius)
        .on("pointerenter", (event, d) => {
            d3.select(event.currentTarget).raise();  // bring the hovered dot to the front

            tooltip
                .style("display", null)
                .html(`<strong>${d.brand}</strong> · ${d.tech} · ${d.size}"<br>` +
                      `${d.stars.toFixed(1)} stars · <strong>${Math.round(d.energy)} kWh</strong> per year<br>` +
                      `${d.models} model${d.models === 1 ? "" : "s"} in this group`);

            // Place the tooltip beside the dot, on the side with more room, inside the chart
            const x = margin.left + xScale(d.stars);
            const y = margin.top + yScale(d.energy);
            const tooltipWidth = tooltip.node().offsetWidth;
            const tooltipHeight = tooltip.node().offsetHeight;
            const left = x < width / 2 ? x + 12 : x - tooltipWidth - 12;
            const top = Math.max(0, Math.min(y - tooltipHeight / 2, height - tooltipHeight));
            tooltip.style("left", `${Math.max(0, left)}px`).style("top", `${top}px`);
        })
        .on("pointerleave", () => tooltip.style("display", "none"));

    // 7. Text under the chart: what is being shown
    const modelCount = d3.sum(filtered, d => d.models);
    scatterReadout.text(`Showing ${filtered.length} groups (${d3.format(",")(modelCount)} models), ` +
        `${group.id === "all" ? "all screen sizes" : group.label + " screens"}. ` +
        `Hover over a dot for details.`);

    syncScatterControls();
}
