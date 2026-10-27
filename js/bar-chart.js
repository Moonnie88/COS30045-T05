// Bar chart: mean energy use of 55-inch TVs by screen technology
// Data: data/Ex5_TV_energy_55inchtv_byScreenType.csv

const barContainer = d3.select("#bar-chart");
const barMessage = d3.select("#bar-comparison");

// The bar the user clicked (null = none). Kept outside drawBarChart so it survives a redraw on resize.
let selectedTech = null;

// 1. Load the CSV, rename the columns and turn the energy values from text into numbers
d3.csv("data/Ex5_TV_energy_55inchtv_byScreenType.csv", d => ({
    tech: d.Screen_Tech,
    energy: +d["Mean(Labelled energy consumption (kWh/year))"]
})).then(data => {
    console.log("bar chart data:", data);

    // 2. Redraw the chart whenever its container changes width (window resize, or 2 columns → 1 column)
    let lastWidth = 0;
    const observer = new ResizeObserver(entries => {
        const width = Math.floor(entries[0].contentRect.width);
        if (width === lastWidth) return;     // height changes (e.g. after drawing) don't need a redraw
        lastWidth = width;
        drawBarChart(data, width);
    });
    observer.observe(barContainer.node());
});

// 3. Draw the whole chart at the given width
function drawBarChart(data, width) {
    // Size: height follows the width, but stays between 240 and 340 px
    const height = Math.max(240, Math.min(340, width * 0.7));
    const margin = { top: 24, right: 10, bottom: 50, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Remove the old chart before drawing the new one
    barContainer.selectAll("*").remove();

    const svg = barContainer.append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("role", "img")
        .attr("aria-label", "Bar chart of mean energy use of 55-inch TVs: " +
            data.map(d => `${d.tech} ${Math.round(d.energy)} kWh per year`).join(", "))
        .on("click", () => selectBar(null, data));   // clicking the empty background clears the selection

    // Everything inside the margins goes in one group, moved in by the left and top margins
    const chart = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // 4. Scales: technology → x position, energy → y position
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.tech))
        .range([0, innerWidth])
        .padding(0.3);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.energy)])   // bars must start at 0
        .nice()                                      // round the top up to a tidy tick (e.g. 400)
        .range([innerHeight, 0]);                    // SVG y grows downwards, so 0 kWh is at the bottom

    // 5. Axes
    chart.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(d3.axisBottom(xScale).tickSize(0).tickPadding(8));

    chart.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(yScale).ticks(5))
        .call(g => g.select(".domain").remove());   // the ticks are enough, so drop the vertical line

    // Axis titles with units
    chart.append("text")
        .attr("class", "axis-title")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 42)
        .attr("text-anchor", "middle")
        .text("Screen technology");

    chart.append("text")
        .attr("class", "axis-title")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -margin.left + 16)
        .attr("text-anchor", "middle")
        .text("Energy use (kWh per year)");

    // 6. Bars: each technology has its own colour class (e.g. tech-oled), set in css/styles.css
    chart.selectAll(".bar")
        .data(data)
        .join("rect")
        .attr("class", d => `bar tech-${d.tech.toLowerCase()}`)
        .attr("x", d => xScale(d.tech))
        .attr("y", d => yScale(d.energy))
        .attr("width", xScale.bandwidth())
        .attr("height", d => innerHeight - yScale(d.energy))
        .attr("tabindex", 0)                         // can be reached with the Tab key
        .attr("role", "button")
        .on("click", (event, d) => {
            event.stopPropagation();                 // stop the click reaching the svg, which would clear it
            selectBar(d.tech, data);
        })
        .on("keydown", (event, d) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                selectBar(d.tech, data);
            }
        })
        .append("title")                             // tooltip on hover
        .text(d => `${d.tech}: ${Math.round(d.energy)} kWh per year (click to compare)`);

    // 7. Value labels just above each bar
    chart.selectAll(".bar-value")
        .data(data)
        .join("text")
        .attr("class", "bar-value")
        .attr("x", d => xScale(d.tech) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.energy) - 6)
        .attr("text-anchor", "middle")
        .text(d => Math.round(d.energy));

    // Put back any selection the user made before the redraw
    showSelection(data);
}

// 8. Click handling: clicking a bar selects it, clicking it again (or the background) clears it
function selectBar(tech, data) {
    selectedTech = (tech === selectedTech) ? null : tech;
    showSelection(data);
}

// Fade the other bars and write the comparison under the chart
function showSelection(data) {
    const isOther = d => selectedTech !== null && d.tech !== selectedTech;

    barContainer.selectAll(".bar")
        .classed("selected", d => d.tech === selectedTech)
        .classed("dimmed", isOther)
        .attr("aria-pressed", d => d.tech === selectedTech);

    barContainer.selectAll(".bar-value")
        .classed("dimmed", isOther);

    barMessage.text(compareText(data));
}

// e.g. "LCD uses 4 kWh less than LED and 61 kWh less than OLED per year."
function compareText(data) {
    if (selectedTech === null) return "Click a bar to compare it with the others.";

    // Use the rounded values shown on the bars, so the differences match what the reader sees
    const chosen = data.find(d => d.tech === selectedTech);
    const chosenValue = Math.round(chosen.energy);

    const comparisons = data
        .filter(d => d.tech !== selectedTech)
        .map(d => {
            const diff = chosenValue - Math.round(d.energy);
            return `${Math.abs(diff)} kWh ${diff < 0 ? "less" : "more"} than ${d.tech}`;
        });

    return `${chosen.tech} uses ${comparisons.join(" and ")} per year.`;
}
