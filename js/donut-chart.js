// Donut chart: screen technologies across all TVs, in two views
//   "energy" (default, as the brief asks): average energy use per technology, all screen sizes
//            Data: data/Ex5_TV_energy_Allsizes_byScreenType.csv
//   "models": share of TV models per technology, with screen-size buttons
//            Data: data/Ex5_TV_energy.csv (the count column is the number of models in each row)
// Note: all the chart files share one global scope, so the names here must not repeat the ones
// in the other files (e.g. selectedTech is already used by bar-chart.js).

const donutContainer = d3.select("#donut-chart");
const donutControls = d3.select("#donut-controls");
const donutLegend = d3.select("#donut-legend");
const donutNote = d3.select("#donut-note");

// Same technologies and colour classes as the bar chart and scatter plot
const donutTechs = [
    { name: "LCD",  cssClass: "tech-lcd" },
    { name: "LED",  cssClass: "tech-led" },
    { name: "OLED", cssClass: "tech-oled" }
];

const donutViews = [
    { id: "energy", label: "Average energy use" },
    { id: "models", label: "Share of models" }
];

// Same size groups as the scatter plot (only used in the "models" view)
const donutSizeGroups = [
    { id: "all",    label: "All sizes", min: 0,  max: Infinity },
    { id: "small",  label: "Up to 32\"", min: 0,  max: 32 },
    { id: "medium", label: "33–50\"",    min: 33, max: 50 },
    { id: "large",  label: "51–65\"",    min: 51, max: 65 },
    { id: "xlarge", label: "Over 65\"",  min: 66, max: Infinity }
];

const formatCount = d3.format(",");      // 3703 → "3,703"
const formatShare = d3.format(".1%");    // 0.845 → "84.5%"

// What the user has chosen. Kept outside drawDonutChart so it survives a redraw on resize.
let donutView = "energy";
let donutSize = "all";
let donutSelectedTech = null;            // clicked slice (null = none)

// 1. Load both CSV files, then draw once both have arrived
Promise.all([
    d3.csv("data/Ex5_TV_energy_Allsizes_byScreenType.csv", d => ({
        tech: d.Screen_Tech,
        energy: +d["Mean(Labelled energy consumption (kWh/year))"]
    })),
    d3.csv("data/Ex5_TV_energy.csv", d => ({
        tech: d.screen_tech === "LCD (LED)" ? "LED" : d.screen_tech,
        size: +d.screensize,
        models: +d.count
    }))
]).then(([energyData, modelData]) => {
    console.log("donut energy data:", energyData);

    // 2. Redraw when the container changes width, or when a control changes
    let lastWidth = 0;
    const redraw = () => drawDonutChart(energyData, modelData, lastWidth);

    buildDonutControls(redraw);

    const observer = new ResizeObserver(entries => {
        const width = Math.floor(entries[0].contentRect.width);
        if (width === lastWidth) return;
        lastWidth = width;
        redraw();
    });
    observer.observe(donutContainer.node());
});

// 3. View buttons and size buttons, built once
function buildDonutControls(redraw) {
    donutControls.select(".view-buttons")
        .selectAll("button")
        .data(donutViews)
        .join("button")
        .attr("type", "button")
        .attr("class", "control-button")
        .text(v => v.label)
        .on("click", (event, v) => {
            donutView = v.id;
            redraw();
        });

    donutControls.select(".size-buttons")
        .selectAll("button")
        .data(donutSizeGroups)
        .join("button")
        .attr("type", "button")
        .attr("class", "control-button")
        .text(g => g.label)
        .on("click", (event, g) => {
            donutSize = g.id;
            redraw();
        });
}

// 4. The slices for the current view. Each item has the value that sets the slice size,
//    plus the text for the centre and the legend, so the drawing code works for both views.
function donutItems(energyData, modelData) {
    if (donutView === "energy") {
        return donutTechs.map(t => {
            const energy = energyData.find(d => d.tech === t.name).energy;
            return {
                ...t,
                value: energy,
                centreValue: Math.round(energy),
                centreLabel: `${t.name}: kWh per year`,
                legendText: `<strong>${t.name}</strong> ${Math.round(energy)} kWh per year`
            };
        });
    }

    // "models" view: count the models in the chosen size group
    const group = donutSizeGroups.find(g => g.id === donutSize);
    const inGroup = modelData.filter(d => d.size >= group.min && d.size <= group.max);
    const total = d3.sum(inGroup, d => d.models);

    return donutTechs.map(t => {
        const models = d3.sum(inGroup.filter(d => d.tech === t.name), d => d.models);
        return {
            ...t,
            value: models,
            centreValue: formatShare(models / total),
            centreLabel: `${t.name} (${formatCount(models)} models)`,
            legendText: `<strong>${t.name}</strong> ${formatCount(models)} models (${formatShare(models / total)})`
        };
    });
}

// Centre text when no slice is hovered or clicked
function donutDefaultCentre(items) {
    return donutView === "energy"
        ? { centreValue: "Average", centreLabel: "energy use per TV" }
        : { centreValue: formatCount(d3.sum(items, i => i.value)), centreLabel: "TV models" };
}

// 5. Draw the whole chart at the given width
function drawDonutChart(energyData, modelData, width) {
    const items = donutItems(energyData, modelData);

    // The donut is a circle, so its size is the smaller of the width and 320 px
    const size = Math.min(width, 320);
    const outerRadius = size / 2 - 4;
    const innerRadius = outerRadius * 0.6;   // the hole leaves room for the text in the middle

    donutContainer.selectAll("*").remove();

    const svg = donutContainer.append("svg")
        .attr("width", width)
        .attr("height", size)
        .attr("role", "img")
        .attr("aria-label", "Donut chart by screen technology: " +
            items.map(i => i.legendText.replace(/<[^>]+>/g, "")).join(", "));   // legend text without the <strong> tags

    // Move (0, 0) to the centre, because arcs are drawn around the origin
    const chart = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${size / 2})`);

    // d3.pie() works out each slice's start and end angle from its value.
    // sort(null) keeps the order LCD, LED, OLED instead of sorting by size.
    const pie = d3.pie()
        .value(i => i.value)
        .sort(null);

    // d3.arc() turns those angles into the SVG path of a ring segment
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(outerRadius)
        .padAngle(0.01);                       // thin gap between slices

    chart.selectAll(".slice")
        .data(pie(items.filter(i => i.value > 0)))     // no slice for a technology with 0 models
        .join("path")
        .attr("class", d => `slice ${d.data.cssClass}`)
        .attr("d", arc)
        .on("pointerenter", (event, d) => showDonutCentre(d.data))
        .on("pointerleave", () => showDonutCentre(selectedItem(items) || donutDefaultCentre(items)))
        .on("click", (event, d) => selectDonutTech(d.data.name, items));

    // Text in the hole: the default text, or the hovered / clicked technology
    chart.append("text")
        .attr("class", "donut-centre-value")
        .attr("text-anchor", "middle")
        .attr("y", -4);

    chart.append("text")
        .attr("class", "donut-centre-label")
        .attr("text-anchor", "middle")
        .attr("y", 20);

    // 6. Legend under the chart: one button per technology.
    //    Buttons can be reached with the keyboard, so the legend also works as the click target.
    donutLegend.selectAll("li")
        .data(items, i => i.name)
        .join(enter => {
            const li = enter.append("li");
            const button = li.append("button")
                .attr("type", "button")
                .attr("class", "legend-item");
            button.append("span").attr("class", "swatch");
            button.append("span").attr("class", "legend-text");
            return li;
        })
        .select("button")
        .on("click", (event, i) => selectDonutTech(i.name, items))
        .call(button => button.select(".swatch")
            .style("background-color", i => `var(--${i.cssClass})`))
        .call(button => button.select(".legend-text")
            .html(i => i.legendText));

    // Note under the legend, different for each view
    donutNote.text(donutView === "energy"
        ? "Slice sizes compare the three averages; they are not parts of a total. OLED TVs tend to be " +
          "larger, which adds to their average. The 55\" bar chart compares them at the same size."
        : "Each slice is the share of all registered TV models in the chosen screen size.");

    applyDonutSelection(items);
}

// The item of the clicked technology, or null
function selectedItem(items) {
    return items.find(i => i.name === donutSelectedTech) || null;
}

// 7. Clicking a slice or legend item selects it; clicking it again clears it
function selectDonutTech(name, items) {
    donutSelectedTech = (name === donutSelectedTech) ? null : name;
    applyDonutSelection(items);
}

// Fade the other slices and legend items, update the buttons and the centre text
function applyDonutSelection(items) {
    const isOther = name => donutSelectedTech !== null && name !== donutSelectedTech;

    donutContainer.selectAll(".slice")
        .classed("dimmed", d => isOther(d.data.name));

    donutLegend.selectAll(".legend-item")
        .classed("selected", i => i.name === donutSelectedTech)
        .classed("dimmed", i => isOther(i.name))
        .attr("aria-pressed", i => i.name === donutSelectedTech);

    donutControls.selectAll(".view-buttons button")
        .classed("active", v => v.id === donutView)
        .attr("aria-pressed", v => v.id === donutView);

    // Size buttons only apply to the "models" view
    donutControls.select(".size-buttons")
        .style("display", donutView === "models" ? null : "none");

    donutControls.selectAll(".size-buttons button")
        .classed("active", g => g.id === donutSize)
        .attr("aria-pressed", g => g.id === donutSize);

    showDonutCentre(selectedItem(items) || donutDefaultCentre(items));
}

// Write the centre text, e.g. "533" / "OLED: kWh per year", or "84.5%" / "LED (3,128 models)"
function showDonutCentre(item) {
    donutContainer.select(".donut-centre-value").text(item.centreValue);
    donutContainer.select(".donut-centre-label").text(item.centreLabel);
}
