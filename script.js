console.log("Assignment 5");

var margin = {t:50,r:100,b:50,l:50};
var width = document.getElementById('map').clientWidth - margin.r - margin.l,
    height = document.getElementById('map').clientHeight - margin.t - margin.b;

var canvas = d3.select('.canvas');
var map = canvas
    .append('svg')
    .attr('width',width+margin.r+margin.l)
    .attr('height',height + margin.t + margin.b)
    .append('g')
    .attr('class','canvas')
    .attr('transform','translate('+margin.l+','+margin.t+')');

//TODO: set up a mercator projection, and a d3.geo.path() generator
//Center the projection at the center of Boston
var bostonLngLat = [-71.088066,42.315520]; //from http://itouchmap.com/latlong.html
var projection = d3.geo.mercator()
    //...
    .center(bostonLngLat)
    .translate([width/2, height/2])
    .scale(200000);


var path1 = d3.geo.path().projection(projection);

//TODO: create a color scale
var scaleColor = d3.scale.linear().domain([0,100000]).range(['white','purple']);

//TODO: create a d3.map() to store the value of median HH income per block group
var HHIncome = d3.map();

//TODO: import data, parse, and draw
queue()
    .defer(d3.json, "data/bos_census_blk_group.geojson")
    .defer(d3.json, "data/bos_neighborhoods.geojson")
    .defer(d3.csv, "data/acs2013_median_hh_income.csv", parseData)
    .await(function(err,neighborhood,neighborhoods){
        console.log(neighborhood);
        console.log(neighborhoods);

        draw (neighborhood,neighborhoods);
    });

function draw (neighborhood,neighborhoods){

    map.selectAll('.block-groups')
        .data(neighborhood.features)
        .enter()
        .append('path')
        .attr('class','block-groups')
        .attr('d',path1)
        .style('fill',function(d){
            //console.log(d);
            var income = HHIncome.get(d.properties.geoid).income;

            return scaleColor(income)
        })
        .call(attachTooltip);

    map.append('path')
        .datum(neighborhoods)
        .attr('class','boundaries')
        .attr('d',path1)
        .style('stroke','white')
        .style('stroke-width','1.5px')
        .style('fill','none');

    map.selectAll('.label')
        .data(neighborhoods.features)
        .enter()
        .append('text')
        .attr('class','label')
        .text(function(d){
            return (d.properties.Name)
        })
        .attr('x',function(d){
            return path1.centroid(d)[0];
        })
        .attr('y',function(d){
            return path1.centroid(d)[1];
        })
}



function parseData(d) {
    HHIncome.set(d.geoid, {
        nameBlock: d.name,
        income: +d.B19013001
    })
}

//Tooltip

function attachTooltip(selection) {
    selection
        .on('mouseenter', function (d) {

            var tooltip = d3.select('.custom-tooltip');

            tooltip.transition().style('opacity', 1);

            var income = HHIncome.get(d.properties.geoid).income;

            tooltip.select('#HHIncome').html(income);

            //console.log(income)
        })

        .on('mousemove', function () {

            var xy = d3.mouse(canvas.node());

            var tooltip = d3.select('.custom-tooltip');

            tooltip
                .style('left', xy[0] + 20 + 'px')
                .style('top', xy[1] + 20 + 'px');
        })
        .on('mouseleave', function () {
           d3.select('.custom-tooltip')
                .transition()
                .style('opacity', 0);

        })
}