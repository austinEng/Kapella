'use strict';

var kapellaDirectives = angular.module('kapellaDirectives', []);

kapellaDirectives.directive('kapellaRecorder', function() {
    return {
        restrict: 'E',
        templateUrl: 'views/recorderDirectiveTemplate.html',
        scope: {
            onComplete: '&',
            audioSrc: '@'
        },
        link: function(scope, element, attrs) {
            var maxtime = 3024;
            var measure = 192;
            var measures=[];
            for (var i=0 ; measure*i<=maxtime+measure; i++) {
                measures.push(i*measure);
            }
            var conversion =180;
            maxtime = maxtime/conversion;
            var maxtimeceil = Math.ceil(maxtime);
            var secondLength = 100;
            var widthceil = maxtimeceil*secondLength;
            var width=maxtime*secondLength;
            var height=100;
            var margin = {top: 20, right: 0, bottom: 60, left: 0};

            var x = d3.scale.linear()
                .range([0, widthceil]);

            var y = d3.scale.linear()
                .range([height, 0]);

            var color = d3.scale.category10();

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("bottom");

            var yAxis = d3.svg.axis()
                .scale(y)
                .orient("left");

            scope.notesContainer = d3.select(element[0]).select('.notes-container');

            var notes = scope.notesContainer.append("svg")
                .attr("width", widthceil + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                /*.attr('viewbox', "0 0 "+width+" "+height)
                 .attr('preserveAspectRatio', "xMidYMid")*/
                .attr('id', 'notes')
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            d3.tsv("views/output.tsv", function(error, data) {
                data.forEach(function(d) {
                    d.midi = +d.midi;
                    d.t = +d.t;
                    d.dur = +d.dur;
                    d.vocal = d.vocal;
                });

                x.domain(d3.extent(data, function(d) { return d.t; })).nice();
                y.domain(d3.extent(data, function(d) { return d.midi; })).nice();

                notes.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + parseInt(height+40) + ")")
                    .call(xAxis
                        //.ticks(maxtimeceil)
                        .tickValues(measures)
                        .tickSize(-(height+60), 0, 0)
                        .tickFormat("")
                    )
                    .append("text")
                    .attr("class", "label")
                    .attr("x", widthceil)
                    .attr("y", -6)
                    .style("text-anchor", "end");

                notes.selectAll(".dot")
                    .data(data)
                    .enter().append("rect")
                    .attr("class", "rect")
                    .attr("height", 5)
                    .attr("width", function(d) { return x(d.dur); })
                    .attr("x", function(d) { return x(d.t); })
                    .attr("y", function(d) { return y(d.midi); })
                    .attr('rx', '2.5')
                    .attr('ry', '2.5');

                notes.selectAll("text")
                    .data(data)
                    .enter().append("text")
                    .text(function(d) { return d.vocal; })
                    .attr("x", function(d) { return x(d.t); })
                    .attr("y", function(d) { return y(d.midi); })
                    .attr('class','note-label');
            });

            var svg = scope.notesContainer.append("svg")
                .attr("width", widthceil + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .attr('id', 'chart')
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            d3.tsv("views/output.tsv", function(error, data) {
                data.forEach(function(d) {
                    d.midi = +d.midi;
                    d.t = +d.t;
                    d.dur = +d.dur;
                    d.vocal = d.vocal;
                });

                x.domain(d3.extent(data, function(d) { return d.t; })).nice();
                y.domain(d3.extent(data, function(d) { return d.midi; })).nice();

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0," + parseInt(height+40) + ")")
                    .call(xAxis
                        .ticks(1)
                        .tickSize(-(height+60), 0, 0)
                        .tickFormat("")
                    )
                    .append("text")
                    .attr("class", "label")
                    .attr("x", widthceil)
                    .attr("y", -6)
                    .style("text-anchor", "end");

            });

            // TODO: delay until after variable interpolation
            element.find('audio')[0].load();

            scope.start = function() {
                $(element).find('#notes').stop(true, false);
                $(element).find('#notes').css('left',0);
                $(element).find('#notes').animate({
                    left: -1*widthceil
                }, maxtimeceil*1000, 'linear', function() {
                    scope.onComplete();
                });
            }
        }
    }
});

kapellaDirectives.directive('kapellaPlayer', function() {
    return {
        restrict: 'E',
        templateUrl: 'views/playerDirectiveTemplate.html',
        scope: {
            song: '='
        },
        link: function(scope, element, attrs) {
            var loaded = false;
            var load = function(done) {
                if (loaded) {
                    done();
                    return;
                }
                var numLoaded = 0;
                createjs.Sound.addEventListener("fileload", function() {
                    numLoaded++;
                    if (numLoaded == scope.song.recordings.length) {
                        loaded = true;
                        createjs.Sound.removeAllEventListeners(); // TODO: find better way of detaching sound load listener
                        done();
                    }
                });
                var files = [];
                var recording;
                for (var i=0; i<scope.song.recordings.length; i++) {
                    files.push({id: scope.song.recordings[i]._id, src: scope.song.recordings[i].filename});
                }
                console.log(files);
                var result = createjs.Sound.registerManifest(files, '/uploads/');
                for (var j=0; j<result.length; j++) {
                    if (result[i] == true) {
                        numLoaded++;
                    }
                }
                if (numLoaded == scope.song.recordings.length) {
                    loaded = true;
                    createjs.Sound.removeAllEventListeners(); // TODO: find better way of detaching sound load listener
                    done();
                }
            };

            scope.play = function() {
                scope.stop();
                load(function() {
                    var recording;
                    for (var i=0; i<scope.song.recordings.length; i++) {
                        createjs.Sound.play(scope.song.recordings[i]._id);
                    }
                });
                return false;
            };

            scope.pause = function() {
                return false;
            };

            scope.stop = function() {
                createjs.Sound.stop();
                return false;
            };
        }
    }
});