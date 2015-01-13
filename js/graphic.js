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
        .html(function(d) { return "Locally owned bridge</br>" + d.properties.description + "</br> Status: " + (d.properties.current_construction_phase_complete != "" ? "Under Construction" : "Under design phase") + "</br>Estimated Date of Completion: " + d.properties.end_construction

    });

    var tipCaltrans = d3.tip()
        .attr("class", 'd3-tip')
        .offset([-10, 0])
        .html(function(d) { return "CalTrans-owned Pier" + "</br>City: " + d.properties.city + ".</br>" + (d.properties.name ? d.properties.name + "</br>" : "" ) + 
            (d.properties.line == "A" ? "Fremont Bound Trains" : (d.properties.line == "R" ? "Richmond Bound Trains" : (d.properties.line == "M" ? "Milbrae Bound Trains" : (d.properties.line == "C" ? "Pitsburg/Bay Point Bound Trains" : "")))) 

        });

    //call both tips
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

    //color constants
    var colorCompleted = colors.red1,
        colorNotCompleted = "darkgreen";

    //get color sorted out for local.js
    local.features.forEach(function(d){
        +d.properties.current_construction_phase_complete > 0.79 ? d.properties.color = colorCompleted : d.properties.color = colorNotCompleted;
    });

    //circles for local.js
    function localFeature(){
        var feature = g.selectAll(".local")
            .data(local.features)
            .enter().append("circle")
            .attr("r", 8)
            .attr("class", "local")
            .style("fill", function(d){return d.properties.color; })
            .style("opacity", 0.8)
            .style("stroke", "black")
            .style("stroke-width", 0.3)
            .on("mouseover", function(d,i){ 
                tip.show(d);
                d3.select(this).each(highlight);})
            .on("mouseout", function(d,i){ 
                tip.hide(d);
                d3.select(this).each(unhighlight);})
            .on("click", clickForFeatures);
        };

    localFeature();


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
    function caltransFeature(){
        var caltransFeature = g.selectAll(".caltrans")
            .data(caltrans.features)
            .enter().append("circle")
            .attr("class", "caltrans")
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
            });}

    caltransFeature();

    //helper function sends properties to the console
    function clickForFeatures(d){ console.log(d.properties);}
   
    //transform cirlces on update
    map.on("viewreset", update);

    //call update manually
    update();

    //my helper function
    map.on("click", showLocation);

    function showLocation(e){
        console.log(e.latlng);
    }


    //define update:
    function update() {
        //transform local points to go
        g.selectAll(".local").attr("transform",
            function(d){
                return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
            }
        );
        //transform caltrans points
        g.selectAll(".caltrans")
            .attr("transform", function(d) {
            return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
        });

    }

    ////delay constants
    var myDelay = function(d,i){return i * 0.8;};
    var myDuration = 5;

    function transUpdate() {
        //transform local points to go
        g.selectAll(".local")
            .transition()
            .delay(myDelay)
            .duration(myDuration)
        .attr("transform",
            function(d){
                return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
            }
        );
        //transform caltrans points
        g.selectAll(".caltrans")
            .transition()
            .delay(myDelay)
            .duration(myDuration)
            .attr("transform", function(d) {
            return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
        });
    }

        //////////////////filters//////////////////
    d3.select("#local").on("click", function(){

        console.log($("#local").is(':checked'));

        //check local
        if($("#local").is(':checked')) {
            //add latlng object to each item in caltrans dataset
            caltrans.features.forEach(function(d){
                d.LatLng = new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
            });

            //data() enter() and append
            caltransFeature();

            //clone of update + 
            transUpdate();

        }
        else{
            //remove caltrans
            d3.selectAll(".caltrans")
                .transition()
                .delay(myDelay)
                .duration(myDuration)
                .remove(); 
            }
        });

    d3.select("#caltrans").on("click", function(){

        console.log($("#caltrans").is(':checked'));

        if( $("#caltrans").is(':checked')){
            //add a latlng object to each item in the dataset
            local.features.forEach(function(d) {
                d.LatLng = new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
            });

            //get color sorted out for local.js
            local.features.forEach(function(d){
                +d.properties.current_construction_phase_complete > 0.79 ? d.properties.color = colorCompleted : d.properties.color = colorNotCompleted;
            });

            //data() enter() and append
            localFeature();

            //call fancy update to correctly map geo points
            transUpdate();
        }

        else{
            //remove caltrans
            d3.selectAll(".local")
                .transition()
                .delay(myDelay)
                .duration(myDuration)
                .remove(); 
        }
    });

d3.select("#extra").on("click", function(){ console.log($("#caltrans").is(':checked'));})



/////////////key//////////////

    var legend = d3.select("#map").append("svg")
        .attr("width", 250)
        .attr("height", 115);

    legend.append("rect")
        .style("fill", "white")
        .attr("width", 190)
        .attr("height", 100)
        .attr("x", "50")
        .attr("y", "2")
        .style("opacity", 0.8)
        ;

    legend.append("g")
            .attr("class", "circleKey")
        .selectAll("g")
            .data([{"color": colors.red1, "text": "Incomplete (0-10%)"}, {"color": "darkgreen", "text":"Complete (80-100%)"}])
            .enter().append("g")
            .attr("class", "colorsGroup")
            .attr("transform", "translate(75, 30)");

    //some key values that i'll repeat
    var keyRadius = 15;
    //make the circles
    legend.selectAll(".colorsGroup").append("circle")
        .style("stroke-width", 2.0)
        .style("fill", function(d){ return d.color; })
        .style("stroke", "black")
        .attr("r", keyRadius)
        .attr("cy", function(d,i){ return i * keyRadius*3;});

    //add annotations
    legend.selectAll(".colorsGroup").append("text")
        .style("font-size", 15)
        .attr("x", keyRadius*1.5)
        .attr("y", function(d,i){ return keyRadius*3 * i + 5;})
        .text(function(d){return d.text;});

} //end render

/*
 * NB: Use window.load instead of document.ready
 * to ensure all images have loaded
 */
$(window).load(function() {
    draw_graphic();
});






