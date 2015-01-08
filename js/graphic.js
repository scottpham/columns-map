var circleSize = 70;

var colors = {
    'red1': '#6C2315', 'red2': '#A23520', 'red3': '#D8472B', 'red4': '#E27560', 'red5': '#ECA395', 'red6': '#F5D1CA',
    'orange1': '#714616', 'orange2': '#AA6A21', 'orange3': '#E38D2C', 'orange4': '#EAAA61', 'orange5': '#F1C696', 'orange6': '#F8E2CA',
    'yellow1': '#77631B', 'yellow2': '#B39429', 'yellow3': '#EFC637', 'yellow4': '#F3D469', 'yellow5': '#F7E39B', 'yellow6': '#FBF1CD',
    'teal1': '#0B403F', 'teal2': '#11605E', 'teal3': '#17807E', 'teal4': '#51A09E', 'teal5': '#8BC0BF', 'teal6': '#C5DFDF',
    'blue1': '#28556F', 'blue2': '#3D7FA6', 'blue3': '#51AADE', 'blue4': '#7DBFE6', 'blue5': '#A8D5EF', 'blue6': '#D3EAF7'
};

/*
 * Render the graphic
 */
//check for svg
function draw_graphic(){
    if (Modernizr.svg){
        $('#map').empty();
        var width = $('#map').width();
        render(width);
        //window.onresize = draw_graphic; /
        //very important! the key to responsiveness
    }
}


function render(width) {

 //leaflet stuff

    //make a map                        
    var map = new L.Map("map", {
        center: [37.74, -122.31], //lat, long, not long, lat
        zoom: 10,
        scrollWheelZoom: false}) 
        //stamen tiles
        .addLayer(new L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
}));

    //initalize the svg layer
    map._initPathRoot()

    //grab the svg layer from the map object
    var svg = d3.select("#map").select("svg"),
        g = svg.append("g");


         //tooltip declaration
        var div = d3.select("#map").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        //format for tooltip
        var percentFormat = function(d){
            if (d) { return (d3.format(".1%"))(d) }
            else { return "0%"}
            }

        //format for # of vaccines
        var commaFormat = d3.format(",f")

        //define tip
        var tip = d3.tip()
            .attr("class", 'd3-tip')
            .offset([-10, 0])
            .html(function(d) { return d.properties.description + "</br> Status: " + (d.properties.current_construction_phase_complete != "" ? "Under Construction" : "Under design phase") + "</br>Estimated Date of Completion: " + d.properties.end_construction

        });

        g.call(tip);

        //add a latlng object to each item in the dataset
        //var local is from local.js
        local.features.forEach(function(d) {
            d.LatLng = new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
        });

        //threshold scale for key and circles
        var color = d3.scale.quantize() //colorscale
        .range(colorbrewer.Reds[5]);

        //circles
        var feature = g.selectAll("circle")
            .data(local.features)
            .enter().append("circle")
            .attr("r", 12)
            .style("fill", function(d){return color(d.properties.current_construction_phase_complete)})
            .style("stroke", "black")
            .style("stroke-width", 0.5)
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide)
            .on("click", clickForFeatures);


        function clickForFeatures(d){ console.log(d);}
       
        //transform cirlces on update
        map.on("viewreset", update);

        //call update manually
        update();

        //my helper function
        //map.on("click", showLocation);

        function showLocation(e){
            console.log(e.latlng);
        }

        //define update:
        function update() {
            feature.attr("transform",
                function(d){
                    return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
                }
            )
        }




    //define scales
    var y = d3.scale.linear()
        .domain([0, 1]) //input data
        .range([0, width/3]); //height of the key

    //define a second svg for the key and attach it to the map div
    var legend = d3.select("#map").append("svg")
        .attr("width", "125")
        .attr("height", "500");

    //create group for color bar and attach to second svg
    var colorBar = legend.append("g")
        .attr("class", "key")
        .attr("transform", "translate(15, 120)")
        .selectAll("rect")
        .data(color.range().map(function(col) {
            var d = color.invertExtent(col);
            if (d[0] == null) d[0] = y.domain()[0];
            if (d[1] == null) d[1] = y.domain()[1];
            return d;
        }));

    //create color rects
    colorBar.enter()
        .append("rect")
            .attr("width", 15)
            .attr("y", function(d) { 
                return y(d[0]); })
            .attr("height", function(d) { return y(d[1]) - y(d[0]); })
            .attr("fill", function(d) { return color(d[0]); });

    //get array of legend domain
    var colorDomain = color.domain();

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("right")
        .tickSize(16)
        .ticks(5) //defaults to 10
        .tickFormat(percentFormat);

    d3.select(".key")
        .call(yAxis);

    //add label
    d3.select(".key")
        .call(yAxis)
        .append("text")
        .attr("y", -30)
        .text("Percent of")
        .style("font-size", "14");

    d3.select(".key")
        .append("text")
        .attr("y", -10)
        .text("Bridge Complete")
        .style("font-size", "14")
        ;

} //end render

/*
 * NB: Use window.load instead of document.ready
 * to ensure all images have loaded
 */
$(window).load(function() {
    draw_graphic();
});






