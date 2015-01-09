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

        ////////////////tooltip stuff////////////////
        //create tip container in d3 for local
        var div = d3.select("#map").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0); //hide till called

        //tip container for caltrans
        var divCaltrans = d3.select("#map").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        //format for tooltip percentages
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

        var tipCaltrans = d3.tip()
            .attr("class", 'd3-tip')
            .offset([-10, 0])
            .html(function(d) { return "CalTrans-controlled pier.</br>" + (d.properties.name ? d.properties.name : "" ) + d.properties.line + " line train."});

        g.call(tip);
        g.call(tipCaltrans);

        //////////////end tooltip//////////////



        //add a latlng object to each item in the dataset
        //var local is from local.js
        local.features.forEach(function(d) {
            d.LatLng = new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
        });

        //add latlng object to each item in caltrans dataset
        caltrans.features.forEach(function(d){
            d.LatLng = new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);

        });

        //threshold scale for key and circles
        var color = d3.scale.quantize() //colorscale
        .range(colorbrewer.Greens[5]);

        //color constants
        var colorCompleted = colors.red1,
            colorNotCompleted = "darkgreen";

        //get color sorted out for local.js
        local.features.forEach(function(d){
            +d.properties.current_construction_phase_complete > 0.79 ? d.properties.color = colorCompleted : d.properties.color = colorNotCompleted;
        });

        //circles for local.js
        var feature = g.selectAll("circle")
            .attr("class", ".local")
            .data(local.features)
            .enter().append("circle")
            .attr("r", 8)
            .style("fill", function(d){return d.properties.color; })
            .style("stroke", "black")
            .style("stroke-width", 0.3)
            .on("mouseover", function(d,i){ 
                tip.show(d);
                d3.select(this).each(highlight);})
            .on("mouseout", function(d,i){ 
                tip.hide(d);
                d3.select(this).each(unhighlight);})
            .on("click", clickForFeatures);

    //bind highlight on both datasets
    d3.selectAll(".local", "")


    // highlight function for mouseover
    var highlight = function(){
        //redraw the selection
        this.parentNode.appendChild(this);
        //generate an actual d3 selection and do stuff
        d3.select(this).attr("r", 15).style("opacity", 1).style("stroke-width", 1.5);
    };

    var unhighlight = function(){
        var firstChild = this.parentNode.firstChild;
        if(firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
        d3.select(this).attr("r", 8).style("opacity", 0.8).style("stroke-width", .5);
    }

    //circles for caltrans.js
    var caltransFeature = g.selectAll(".caltrans")
        .data(caltrans.features)
        .enter().append("circle")
        .attr("r", 8)
        .style("fill", function(d){return (d.properties.completed == "yes" ? colorCompleted : colorNotCompleted); })
        .style("opacity", "0.8")
        .style("stroke", "black")
        .style("stroke-width", 0.3)
        .on("click", clickForFeatures)
        .on("mouseover", function(d,i){
            d3.select(this).each(highlight);
            tipCaltrans.show(d); 
        })
        .on("mouseout", function(d,i){
            d3.select(this).each(unhighlight);
            tipCaltrans.hide(d);
        });

        //helper function sends properties to the console
        function clickForFeatures(d){ console.log(d.properties);}
       
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
            //transform local points to go
            feature.attr("transform",
                function(d){
                    return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
                }
            );
            //transform caltrans points
            caltransFeature.attr("transform", function(d) {
                return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
            });

        }



/////////////key//////////////

    // //define scales
    // var y = d3.scale.linear()
    //     .domain([0, 1]) //input data
    //     .range([0, width/3]); //height of the key

    // //define a second svg for the key and attach it to the map div
    // var legend = d3.select("#map").append("svg")
    //     .attr("width", "125")
    //     .attr("height", "500");

    //make an svg, put a group in it, make a sub group for each circle (2), translate it
    var legend2 = d3.select("#map").append("svg")
        .attr("width", 200)
        .attr("height", 300)
        .append("g")
            .attr("class", "circleKey")
        .selectAll("g")
            .data([{"color": colors.red1, "text": "0-10% Complete"}, {"color": "darkgreen", "text":"80-100% Complete"}])
            .enter().append("g")
            .attr("transform", "translate(30, 120)");

    //some key values that i'll repeat
    var keyRadius = 15;
    //make the circles
    legend2.append("circle")
        .style("stroke-width", 2.0)
        .style("fill", function(d){ return d.color; })
        .style("stroke", "black")
        .attr("r", keyRadius)
        .attr("cy", function(d,i){ return i * keyRadius*3;});

    //add annotations
    legend2.append("text")
        .style("font-size", 15)
        .attr("x", keyRadius*1.5)
        .attr("y", function(d,i){ return keyRadius*3 * i + 5;})
        .text(function(d){return d.text;});

    // //create group for color bar and attach to second svg
    // var colorBar = legend.append("g")
    //     .attr("class", "key")
    //     .attr("transform", "translate(15, 120)")
    //     .selectAll("rect")
    //     .data(color.range().map(function(col) {
    //         var d = color.invertExtent(col);
    //         if (d[0] == null) d[0] = y.domain()[0];
    //         if (d[1] == null) d[1] = y.domain()[1];
    //         return d;
    //     }));

    // //create color rects
    // colorBar.enter()
    //     .append("rect")
    //         .attr("width", 15)
    //         .attr("y", function(d) { 
    //             return y(d[0]); })
    //         .attr("height", function(d) { return y(d[1]) - y(d[0]); })
    //         .attr("fill", function(d) { return color(d[0]); });

    // //get array of legend domain
    // var colorDomain = color.domain();

    // var yAxis = d3.svg.axis()
    //     .scale(y)
    //     .orient("right")
    //     .tickSize(16)
    //     .ticks(5) //defaults to 10
    //     .tickFormat(percentFormat);

    // d3.select(".key")
    //     .call(yAxis);

    // //add label
    // d3.select(".key")
    //     .call(yAxis)
    //     .append("text")
    //     .attr("y", -30)
    //     .text("Percent of")
    //     .style("font-size", "14");

    // d3.select(".key")
    //     .append("text")
    //     .attr("y", -10)
    //     .text("Bridge Complete")
    //     .style("font-size", "14")
    //     ;

} //end render

/*
 * NB: Use window.load instead of document.ready
 * to ensure all images have loaded
 */
$(window).load(function() {
    draw_graphic();
});






