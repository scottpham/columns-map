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
        .addLayer(new L.TileLayer('http://api.tiles.mapbox.com/v4/nbclocal.8621e715/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibmJjbG9jYWwiLCJhIjoiS3RIUzNQOCJ9.le_LAljPneLpb7tBcYbQXQ', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
    }));

    //grab svg from map
    var svg = d3.select(map.getPanes().overlayPane).append("svg"),
        //create an svg grouping that temporarily hides on zoom
        g = svg.append("g").attr("class", "leaflet-zoom-hide");

    //convert topojson back to geojson    
    var collection = topojson.feature(faults, faults.objects.faults);

    //convert geojson to svg
    var transform = d3.geo.transform({point: projectPoint}),
        path = d3.geo.path().projection(transform);

    //reset paths on zoom
    map.on("viewreset", reset);

   //leaflet implements a geometric transformation
    function projectPoint(x, y){
        var point = map.latLngToLayerPoint(new L.LatLng(y,x));
        this.stream.point(point.x, point.y);}

    function reset(){
        //reset paths on zoom
        bounds = path.bounds(collection);

        var topLeft = bounds[0],
            bottomRight = bounds[1];

        svg.attr("width", bottomRight[0] - topLeft[0])
            .attr("height", bottomRight[1] - topLeft[1])
            .style("left", topLeft[0] + "px")
            .style("top", topLeft[1] + "px");
        
        g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

        //rebuild entirely on zoom
        if ($("#faults").is(":checked")){

            d3.selectAll(".faults").remove();

            buildFaults();}

        update();
        
    };

    //build out faultlines
    function buildFaults(){

        var faultFeatures = g.selectAll("path")
            .data(collection.features)
            .enter().append("path").attr("class", "faults");

       //initialize path data
        faultFeatures.attr("d", path).style("fill", "none")
            .transition()
            .delay(myDelay)
            .duration(300)
            .style("stroke", "darkred")
            .style("stroke-width", 2);

        //add mouseover effects
        faultFeatures
            .on("click", clickForFeatures)
            .on("mouseover", function(d,i){ 
                //empty text
                $(".info").empty();
                //write fault data
                $(".info").append("<div class='fault-info'><h4><strong>Fault Name: </strong></h4><p>" + d.properties.name + "</p></div>");
                //highlight on mouseover
                d3.select(this)
                    .style("stroke-width", 10)
                    .style("stroke", colors.yellow3);
                })
            .on("mouseout", function(d,i){
                //reset text in legend box
                $(".info").empty()
                    .append("<h4>Hover over a Fault Line</h4>");
                //reset color
                d3.select(this)
                    .style("stroke-width", 2)
                    .style("stroke", "darkred");
                }
            );
    }//end buildFaults

    //call it for good measure
    reset();

    ////////////////tooltip stuff////////////////
    //create tip container in d3 for local
    var div = d3.select("#map").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0); //hide till called


    // //format for tooltip percentages
    var percentFormat = function(d){
        if (d) { return (d3.format("%"))(d); }
        else { return "0%"}
        }

    // //define tip
    var localTip = d3.tip()
        .attr("class", 'd3-tip')
        .offset([-10, 0])
        .html(function(d) { return "Locally owned bridge</br>" + percentFormat(d.properties.current_construction_phase_complete) + " complete.</br>" + d.properties.description + "</br>Completion Date: " + (d.properties.end_construction ? d.properties.end_construction : "Not Available.")
    });
    //define tip for bart
    var bartTip = d3.tip()
        .attr("class", 'd3-tip')
        .offset([-10, 0])
        .html(function(d) { return "BART owned Pier</br>" + (d.properties.completed == "yes" ? "Complete</br>" : "Incomplete</br>") + "City: " + d.properties.city + ".</br>" + (d.properties.name ? d.properties.name + "</br>" : "" ) + 
            (d.properties.line == "A" ? "Fremont Bound Trains" : (d.properties.line == "R" ? "Richmond Bound Trains" : (d.properties.line == "M" ? "Milbrae Bound Trains" : (d.properties.line == "C" ? "Pitsburg/Bay Point Bound Trains" : "")))) 
        });

    // //call both tips
    g.call(localTip);
    g.call(bartTip);    

         //////////////end tooltip//////////////


    ////transition constants
    var myDelay = function(d,i){return i * 0.4;};
    var myDelaySlow = function (d,i){return i * 25;};

///////////////massaging data/////////////////
    // //add a latlng object to each item in the dataset
    //var local is from local.js
    local.features.forEach(function(d) {
        d.LatLng = new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
    });

    //add latlng object to each item in bart dataset
    bart.features.forEach(function(d){
        d.LatLng = new L.LatLng(d.geometry.coordinates[1], d.geometry.coordinates[0]);
    });

    // //color constants
    var colorCompleted = colors.blue1,
        colorNotCompleted = colors.orange2;

    ///////////////data joins////////////////

    //building circles from local.js
    function localFeature(){
        //store selection
        var feature = g.selectAll(".local")
            .data(local.features);

        //perform enter
        feature.enter().append("circle")
            .attr("class", "local")
            .on("mouseover", function(d,i){ 
                localTip.show(d);
                d3.select(this).each(highlight);})
            .on("mouseout", function(d,i){ 
                localTip.hide(d);
                d3.select(this).each(unhighlight);})
            .on("click", clickForFeatures);

        //transition entries
        feature.transition()
            .delay(myDelaySlow)
            .duration(0)
            .attr("r", 8)
            .style("fill", colorNotCompleted)
            .style("opacity", 0.8)
            .style("stroke", "black")
            .style("stroke-width", 0.3);
    };


    // highlight function for mouseover
    var highlight = function(){
        //redraw the selection
        this.parentNode.appendChild(this);
        //generate an actual d3 selection and do stuff
        d3.select(this).attr("r", 15).style("opacity", 1).style("stroke-width", 1.5);
    };

    //unhighlight and send to back
    var unhighlight = function(){
        var firstChild = this.parentNode.firstChild;
        if(firstChild) {
            this.parentNode.insertBefore(this, firstChild);
        }
        d3.select(this).attr("r", 8).style("opacity", 0.8).style("stroke-width", .5);
    }

    //circles for bart.js
    function bartFeature(){
        //store selection
        var bartFeature = g.selectAll(".bart")
            .data(bart.features);

        //perform enter
        bartFeature.enter()
            .append("circle")
            .attr("class", "bart")
            .on("click", clickForFeatures)
            .on("mouseover", function(d,i){
                d3.select(this).each(highlight);
                bartTip.show(d); 
            })
            .on("mouseout", function(d,i){
                d3.select(this).each(unhighlight);
                bartTip.hide(d);
            });

        //perform transition
        bartFeature
            .transition()
            .delay(myDelay)
            .duration(0)
            .attr("r", 8)
            .style("fill", function(d){return (d.properties.completed === "yes" ? colorCompleted : colorNotCompleted); })
            .style("opacity", 0.8)
            .style("stroke", "black")
            .style("stroke-width", 0.3);
            
        }

    // build bart circles
    bartFeature();
    update();

    //helper function sends properties to the console
    function clickForFeatures(d){ console.log(d.properties);}

    //define update: (called on reset)
    function update() {
        //transform local points to go
        g.selectAll(".local").attr("transform",
            function(d){
                return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
            }
        );
        //transform bart points
        g.selectAll(".bart")
            .attr("transform", function(d) {
            return "translate(" + map.latLngToLayerPoint(d.LatLng).x + "," + map.latLngToLayerPoint(d.LatLng).y + ")";
        });

    }//end update


  //////////////////BUTTONS//////////////////

    function checkWidth(width){
        if (width<475){
            $("#btn-group").attr("class", "btn-group-vertical");
        }
    }
    
    checkWidth(width);

	//helper function for buttons
	function mutuallyExclusive(id){
		$('input[type=checkbox]').each(function(){
            //store all the button ids
			var buttonID = $(this).attr("id");

			if ($(this).is(":checked")){
				//remove marks associated with that button
				d3.selectAll("." + buttonID).remove();
				//uncheck everything but itself
				$(this).prop("checked", false);
                $(this).parent().removeClass("active");
			}	
		});
        //check itself
	   $(id).prop("checked", true);
        $(id).parent().addClass("active");

	}

  
    d3.select("#bart").on("click", function(){
        //log click value
        console.log($("#bart").is(':checked'));

        //change legend
        buildBridgesLegend();

        //check bart
        if($("#bart").is(':checked')) {
			//one at a time
			mutuallyExclusive("#bart");
            //data() enter() and append
            bartFeature();
            //clone of update + fancy stuff
            //transUpdate();
            update();
        }
        else{
            //remove bart
			console.log("else fired");
            d3.selectAll(".bart")
                .remove(); 
            }
        });

    d3.select("#local").on("click", function(){

        console.log($("#local").is(':checked'));

        //change legend
        buildBridgesLegend();

        //check checkbox status
        if( $("#local").is(':checked')){
			mutuallyExclusive("#local");
			//data() enter() and append
            localFeature();
            //call fancy update to correctly map geo points
            update();
        }

        else{
            //remove local
            d3.selectAll(".local")
                .remove(); 
        }
    });

    d3.select("#faults").on("click", function(){
        //is the button on?
        console.log($("#faults").is(":checked"));

        buildFaultsLegend();
        //if so
        if( $("#faults").is(":checked")){
            //make visible
            mutuallyExclusive("#faults");
            reset();
        }
        //if not
        else{
            //make invisible
            d3.selectAll("path")
                .style("opacity", 0);
        }
    });

/////////////key//////////////

// strategy:
    // use L.control() to generate a div that is positioned right (.info)
    // add an svg to that div (#legend)
    // add a g to that svg and then more d3 stuff to those gs
    // append dynamic info using jquery
//defaults to position: topright
var info = L.control({position: 'topright'});

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    // this.update();
    return this._div;
};

info.addTo(map);

function buildBridgesLegend(){

    //empty out legend
    $(".info").empty();

    //append an svg
    var legend = d3.select(".info").append("svg")
        .attr("id", "legend")
        .attr("width", 150)
        .attr("height", 85);

    //bind circle data to groups
    legend.append("g")
            .attr("class", "circleKey")
        .selectAll("g")
            .data([{"color": colorNotCompleted, "text": "Incomplete"}, {"color": colorCompleted, "text":"Complete"}])
            .enter().append("g")
            .attr("class", "colorsGroup")
            .attr("transform", "translate(20, 20)");
    //size of legend circles
    var keyRadius = 15;
    
    //draw the circles
    legend.selectAll(".colorsGroup").append("circle")
        .style("stroke-width", 2.0)
        .style("fill", function(d){ return d.color; })
        .style("stroke", "black")
        .attr("r", keyRadius)
        .attr("cy", function(d,i){ return i * keyRadius*3;});

    //add the text
    legend.selectAll(".colorsGroup").append("text")
        .style("font-size", 15)
        .attr("x", keyRadius*1.5)
        .attr("y", function(d,i){ return keyRadius*3 * i + 5;})
        .text(function(d){return d.text;});
    }//end build Legend

//build the legend
buildBridgesLegend();

//legend only for paths
function buildFaultsLegend(){
    $(".info").empty()
        .append("<h4>Hover over a Fault Line</h4>")
        //shrink the legend box a bit
        .css("min-height", "50px");
    }//end legend

} //end render

/*
 * NB: Use window.load instead of document.ready
 * to ensure all images have loaded
 */
$(window).load(function() {
    draw_graphic();
});






