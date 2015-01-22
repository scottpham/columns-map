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
        .addLayer(new L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
    attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>.'
    }));

    //initalize the svg layer
    // map._initPathRoot();

    //grab the svg layer from the map object

    var svg = d3.select(map.getPanes().overlayPane).append("svg"),

    // var svg = d3.select("#map").select("svg"),
        g = svg.append("g").attr("class", "leaflet-zoom-hide");

    ////loading geojson/////
    function loadFaults(){
        d3.json("js/faults.json", function(collection){
            //faultShape = topojson.feature(faultShape, faultShape.objects.faults)
            collection = topojson.feature(collection, collection.objects.faults);

            //console.log(collection);
            //make a transform for a path
            var transform = d3.geo.transform({point: projectPoint}),
                path = d3.geo.path().projection(transform);

            var faultFeatures = g.selectAll("path")
                .data(collection.features)
                .enter().append("path").attr("class", "faults");

            map.on("viewreset", reset);

            reset();

            function reset(){
                ///path related stuff/////
                bounds = path.bounds(collection);

                var topLeft = bounds[0],
                    bottomRight = bounds[1];

                svg.attr("width", bottomRight[0] - topLeft[0])
                    .attr("height", bottomRight[1] - topLeft[1])
                    .style("left", topLeft[0] + "px")
                    .style("top", topLeft[1] + "px");
                
                g.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");

                //initialize path data
                faultFeatures.attr("d", path).style("fill", "none")
                    .transition()
                    .delay(myDelay)
                    .duration(300)
                    .style("stroke", "darkred")
                    .style("stroke-width", 2);

                faultFeatures
                    .on("click", clickForFeatures)
                    .on("mouseover", function(d,i){ 

                        $(".info").append("<div class='fault-info'><p>Fault Name: " + d.properties.name);

                        //highlight on mouseover
                        d3.select(this)
                            .style("stroke-width", 5)
                            .style("stroke", colors.yellow3);
                        }
                        )
                    .on("mouseout", function(d,i){
                        $(".fault-info").empty();
                        //reset color
                        d3.select(this)
                            .style("stroke-width", 2)
                            .style("stroke", "darkred");
                        //faultTip.hide(d);
                        }
                    );

                //check button
                if( $("#faults").is(":checked")){
                    //make visible
                    faultFeatures.style("opacity", 1);
                }
                //if not
                else{
                    //make invisible
                    faultFeatures.style("opacity", 0);
                }
                //call update function for point data
                update();
            }

            //leaflet implements a geometric transformation
            function projectPoint(x, y){
                var point = map.latLngToLayerPoint(new L.LatLng(y,x));
                this.stream.point(point.x, point.y);}
    });
    }

    //load it
    loadFaults();

    ////////////////tooltip stuff////////////////
    //create tip container in d3 for local
    var div = d3.select("#map").append("div")
        .attr("class", "tooltip")
        .style("opacity", 1); //hide till called


    // //format for tooltip percentages
    var percentFormat = function(d){
        if (d) { return (d3.format("%"))(d) }
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
    //g.call(faultTip);

         //////////////end tooltip//////////////

    ////add colors to data////
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

    //get color sorted out for local.js
    local.features.forEach(function(d){
        +d.properties.current_construction_phase_complete > 0.79 ? d.properties.color = colorCompleted : d.properties.color = colorNotCompleted;
    });


    ////transition constants
    var myDelay = function(d,i){return i * 0.4;};
    var myDelaySlow = function (d,i){return i * 25;};

    ///////////////joins////////////////

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
            .style("fill", function(d){return d.properties.color; })
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

    //unhighlight
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
            .style("fill", function(d){return (d.properties.completed == "yes" ? colorCompleted : colorNotCompleted); })
            .style("opacity", 0.8)
            .style("stroke", "black")
            .style("stroke-width", 0.3);
            
        }

    //build bart circles
    bartFeature();

    //helper function sends properties to the console
    function clickForFeatures(d){ console.log(d.properties);}
   

    //my helper function
    map.on("click", showLocation);

    function showLocation(e){
        console.log(e.latlng);
    }

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
    }

	//helper function for buttons
	function mutuallyExclusive(id){
		$('input[type=checkbox]').each(function(){
			buttonID = $(this).attr("id");
			if ($(this).is(":checked")){
				//remove marks associated with that button
				d3.selectAll("." + buttonID).remove();
				//uncheck everything
				$(this).prop("checked", false);
			}	
		});
	$(id).prop("checked", true);
	}

    //////////////////filters//////////////////
    d3.select("#bart").on("click", function(){
        //log click value
        console.log($("#bart").is(':checked'));

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

        //if so
        if( $("#faults").is(":checked")){
            //make visible
            mutuallyExclusive("#faults");

            loadFaults();
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
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>Status</h4>';
};

 info.addTo(map);

var legend = d3.select(".info").append("svg")
    .attr("id", "legend")
    .attr("width", 150)
    .attr("height", 115);

legend.append("g")
        .attr("class", "circleKey")
    .selectAll("g")
        .data([{"color": colorNotCompleted, "text": "Incomplete"}, {"color": colorCompleted, "text":"Complete"}])
        .enter().append("g")
        .attr("class", "colorsGroup")
        .attr("transform", "translate(25, 30)");

//some key values that i'll repeat
var keyRadius = 15;
//make the circles
legend.selectAll(".colorsGroup").append("circle")
    .style("stroke-width", 2.0)
    .style("fill", function(d){ return d.color; })
    .style("stroke", "black")
    .attr("r", keyRadius)
    .attr("cy", function(d,i){ return i * keyRadius*3;});

// //add annotations
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






