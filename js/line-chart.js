// Line chart: yearly electricity spot prices, 1998–2024
// Data: data/Ex5_ARE_Spot_Prices.csv

const lineContainer = d3.select("#line-chart");

// The four states included in the average column (Tasmania and Snowy are left out because of their gaps)
const stateColumns = {
    "Queensland": "Queensland ($ per megawatt hour)",
    "New South Wales": "New South Wales ($ per megawatt hour)",
    "Victoria": "Victoria ($ per megawatt hour)",
    "South Australia": "South Australia ($ per megawatt hour)"
};
const stateNames = Object.keys(stateColumns);

const formatPrice = d3.format("$.2f");   // 41.5 → "$41.50"

// 1. Load the CSV: one object per year, with short state names as keys
d3.csv("data/Ex5_ARE_Spot_Prices.csv", d => {
    const row = {
        year: +d.Year,
        average: +d["Average Price (notTas-Snowy)"]
    };
    stateNames.forEach(name => {
        row[name] = +d[stateColumns[name]];
    });
    return row;
}).then(data => {
    console.log("line chart data:", data);

    // 2. Redraw when the container changes width (same pattern as the bar chart)
    let lastWidth = 0;
    const observer = new ResizeObserver(entries => {
        const width = Math.floor(entries[0].contentRect.width);
        if (width === lastWidth) return;
        lastWidth = width;
        drawLineChart(data, width);
    });
    observer.observe(lineContainer.node());
});

// 3. Draw the whole chart at the given width
function drawLineChart(data, width) {
    const height = Math.max(240, Math.min(340, width * 0.7));
    const margin = { top: 28, right: 64, bottom: 50, left: 64 };   // right margin leaves room for the "Average" label
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

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

    // 4. Scales: year → x, price → y
    const xScale = d3.scaleLinear()
        .domain(d3.extent(data, d => d.year))   // [1998, 2024]
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d3.max(stateNames, name => d[name]))])   // highest state price
        .nice()
        .range([innerHeight, 0]);

    // 5. Axes. The y ticks stretch across the chart (tickSize = -innerWidth) to make light gridlines
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

    // 6. Lines. lineFor("average") returns a line generator that reads d.average for each year
    const lineFor = key => d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d[key]));

    // Thin grey state lines first, so the average line is drawn on top
    chart.selectAll(".line-state")
        .data(stateNames)
        .join("path")
        .attr("class", "line-state")
        .attr("d", name => lineFor(name)(data));

    chart.append("path")
        .attr("class", "line-average")
        .attr("d", lineFor("average")(data));

    // 7. Labels: name the average line at its end, and mark the first and last values
    const first = data[0];
    const last = data[data.length - 1];

    chart.append("text")
        .attr("class", "line-label")
        .attr("x", xScale(last.year) + 8)
        .attr("y", yScale(last.average))
        .attr("dominant-baseline", "middle")
        .text("Average");

    chart.selectAll(".end-point")
        .data([first, last])
        .join("circle")
        .attr("class", "end-point")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.average))
        .attr("r", 4);

    chart.selectAll(".end-value")
        .data([first, last])
        .join("text")
        .attr("class", "end-value")
        .attr("x", d => xScale(d.year))
        .attr("y", d => yScale(d.average) - 10)
        .attr("text-anchor", (d, i) => i === 0 ? "start" : "end")   // keep both labels inside the chart
        .text(d => formatPrice(d.average));

    // 8. Hover: a guide line, a dot on the average and a tooltip with every value for that year
    const hoverLine = chart.append("line")
        .attr("class", "hover-line")
        .attr("y1", 0)
        .attr("y2", innerHeight)
        .style("display", "none");

    const hoverDot = chart.append("circle")
        .attr("class", "hover-dot")
        .attr("r", 5)
        .style("display", "none");

    const tooltip = lineContainer.append("div")
        .attr("class", "chart-tooltip")
        .style("display", "none");

    // An invisible rectangle over the plot area catches the mouse (and touch) movements
    chart.append("rect")
        .attr("class", "hover-area")
        .attr("width", innerWidth)
        .attr("height", innerHeight)
        .on("pointermove", event => {
            const [mouseX] = d3.pointer(event);
            const year = Math.round(xScale.invert(mouseX));   // nearest whole year
            const d = data.find(row => row.year === year);
            if (!d) return;

            const x = xScale(year);
            hoverLine.attr("x1", x).attr("x2", x).style("display", null);
            hoverDot.attr("cx", x).attr("cy", yScale(d.average)).style("display", null);

            // States listed from highest to lowest price that year
            const states = stateNames
                .map(name => ({ name, price: d[name] }))
                .sort((a, b) => b.price - a.price);

            tooltip
                .style("display", null)
                .html(`<strong>${year}</strong><br>` +
                      `Average: <strong>${formatPrice(d.average)}</strong> ` +
                      `(≈ ${(d.average / 10).toFixed(1)} c/kWh)<br>` +
                      states.map(s => `${s.name}: ${formatPrice(s.price)}`).join("<br>"));

            // Show the tooltip on the side of the guide line with more room
            const tooltipWidth = tooltip.node().offsetWidth;
            const left = x < innerWidth / 2
                ? margin.left + x + 12
                : margin.left + x - tooltipWidth - 12;
            const clampedLeft = Math.max(0, Math.min(left, width - tooltipWidth));   // never past the chart edges
            tooltip.style("left", `${clampedLeft}px`).style("top", `${margin.top}px`);
        })
        .on("pointerleave", () => {
            hoverLine.style("display", "none");
            hoverDot.style("display", "none");
            tooltip.style("display", "none");
        });
}
