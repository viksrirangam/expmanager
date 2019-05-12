(function ($) {
    $.fn.extend({
        //plugin name - piechart         
        piechart: function (options, series) {
            var p = {
                chartSizePercent: 80,
                sliceBorderWidth: 1,
                sliceBorderStyle: "#fff",
                sliceGradientColour: "#ddd",
                maxPullOutDistance: 10,
                pullOutFrameStep: 4,
                pullOutFrameInterval: 40,
                pullOutLabelPadding: 65,
                pullOutLabelFont: "bold 16px 'Roboto', Verdana, sans-serif",
                pullOutValueFont: "bold 12px 'Roboto', Verdana, sans-serif",
                pullOutValuePrefix: "$",
                pullOutShadowColour: "rgba( 0, 0, 0, .5 )",
                pullOutShadowOffsetX: 5,
                pullOutShadowOffsetY: 5,
                pullOutShadowBlur: 5,
                pullOutBorderWidth: 2,
                pullOutBorderStyle: "#333",
                chartStartAngle: -.5 * Math.PI,
                tableId: "chartData"
            };

            var canvas;
            var currentPullOutSlice = -1;
            var currentPullOutDistance = 0;
            var animationId = 0;
            var chartData = [];
            var chartColours = [];
            var totalValue = 0;
            var canvasWidth;
            var canvasHeight;
            var centreX;
            var centreY;
            var chartRadius;
            var defaultColours = [
                [30,174,219],
                [60,204,249],
                [50,194,239],
                [40,184,229]
            ];

            var g = {
                /**
                * Set up the chart data and colours, as well as the chart and table click handlers,
                * and draw the initial pie chart
                */
                init: function () {
                    // Exit if the browser isn't canvas-capable
                    if (typeof canvas.getContext === 'undefined') return;

                    // Initialise some properties of the canvas and chart
                    canvasWidth = canvas.width;
                    canvasHeight = canvas.height;
                    centreX = canvasWidth / 2;
                    centreY = canvasHeight / 2;
                    chartRadius = Math.min(canvasWidth, canvasHeight) / 2 * (p.chartSizePercent / 100);

                    // Grab the data from the table,
                    // and assign click handlers to the table data cells

                    var currentRow = -1;
                    var currentCell = 0;

                    if (series !== undefined) {
                        for(var item in series){
                            chartData[item] = [];
                            chartData[item]['label'] = series[item][0];
                            chartData[item]['value'] = series[item][1];
                            chartColours[item]=defaultColours[item%4];
                            totalValue += series[item][1];
                        }
                    }
                    else {
                        $('#chartData td').each(function () {
                            currentCell++;
                            if (currentCell % 2 != 0) {
                                currentRow++;
                                chartData[currentRow] = [];
                                chartData[currentRow]['label'] = $(this).text();
                            } else {
                                var value = parseFloat($(this).text());
                                totalValue += value;
                                value = value.toFixed(2);
                                chartData[currentRow]['value'] = value;
                            }

                            // Store the slice index in this cell, and attach a click handler to it
                            $(this).data('slice', currentRow);
                            $(this).click(g.handleTableClick);

                            // Extract and store the cell colour
                            if (rgb = $(this).css('color').match(/rgb\((\d+), (\d+), (\d+)/)) {
                                chartColours[currentRow] = [rgb[1], rgb[2], rgb[3]];
                            } else if (hex = $(this).css('color').match(/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/)) {
                                chartColours[currentRow] = [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
                            } else {
                                alert("Error: Colour could not be determined! Please specify table colours using the format '#xxxxxx'");
                                return;
                            }
                        });
                    }

                    // Now compute and store the start and end angles of each slice in the chart data

                    var currentPos = 0; // The current position of the slice in the pie (from 0 to 1)

                    for (var slice in chartData) {
                        chartData[slice]['startAngle'] = 2 * Math.PI * currentPos;
                        chartData[slice]['endAngle'] = 2 * Math.PI * (currentPos + (chartData[slice]['value'] / totalValue));
                        currentPos += chartData[slice]['value'] / totalValue;
                    }

                    // All ready! Now draw the pie chart, and add the click handler to it
                    g.drawChart();
                    $('#chart').click(g.handleChartClick);
                },


                /**
                * Process mouse clicks in the chart area.
                *
                * If a slice was clicked, toggle it in or out.
                * If the user clicked outside the pie, push any slices back in.
                *
                * param Event The click event
                */

                handleChartClick: function (clickEvent) {
                    // Get the mouse cursor position at the time of the click, relative to the canvas
                    var mouseX = clickEvent.pageX - this.offsetLeft;
                    var mouseY = clickEvent.pageY - this.offsetTop;

                    // Was the click inside the pie chart?
                    var xFromCentre = mouseX - centreX;
                    var yFromCentre = mouseY - centreY;
                    var distanceFromCentre = Math.sqrt(Math.pow(Math.abs(xFromCentre), 2) + Math.pow(Math.abs(yFromCentre), 2));

                    if (distanceFromCentre <= chartRadius) {

                        // Yes, the click was inside the chart.
                        // Find the slice that was clicked by comparing angles relative to the chart centre.

                        var clickAngle = Math.atan2(yFromCentre, xFromCentre) - p.chartStartAngle;
                        if (clickAngle < 0) clickAngle = 2 * Math.PI + clickAngle;

                        for (var slice in chartData) {
                            if (clickAngle >= chartData[slice]['startAngle'] && clickAngle <= chartData[slice]['endAngle']) {

                                // Slice found. Pull it out or push it in, as required.
                                g.toggleSlice(slice);
                                return;
                            }
                        }
                    }

                    // User must have clicked outside the pie. Push any pulled-out slice back in.
                    g.pushIn();
                },


                /**
                * Process mouse clicks in the table area.
                *
                * Retrieve the slice number from the jQuery data stored in the
                * clicked table cell, then toggle the slice
                *
                * param Event The click event
                */

                handleTableClick: function (clickEvent) {
                    var slice = $(this).data('slice');
                    g.toggleSlice(slice);
                },


                /**
                * Push a slice in or out.
                *
                * If it's already pulled out, push it in. Otherwise, pull it out.
                *
                * param Number The slice index (between 0 and the number of slices - 1)
                */

                toggleSlice: function (slice) {
                    if (slice == currentPullOutSlice) {
                        g.pushIn();
                    } else {
                        g.startPullOut(slice);
                    }
                },


                /**
                * Start pulling a slice out from the pie.
                *
                * param Number The slice index (between 0 and the number of slices - 1)
                */

                startPullOut: function (slice) {

                    // Exit if we're already pulling out this slice
                    if (currentPullOutSlice == slice)
                        return;

                    // Record the slice that we're pulling out, clear any previous animation, then start the animation
                    currentPullOutSlice = slice;
                    currentPullOutDistance = 0;
                    clearInterval(animationId);
                    animationId = setInterval(function () { g.animatePullOut(slice); }, p.pullOutFrameInterval);

                    // Highlight the corresponding row in the key table
                    $('#chartData td').removeClass('highlight');
                    var labelCell = $('#chartData td:eq(' + (slice * 2) + ')');
                    var valueCell = $('#chartData td:eq(' + (slice * 2 + 1) + ')');
                    labelCell.addClass('highlight');
                    valueCell.addClass('highlight');
                },


                /**
                * Draw a frame of the pull-out animation.
                *
                * param Number The index of the slice being pulled out
                */

                animatePullOut: function (slice) {

                    // Pull the slice out some more
                    currentPullOutDistance += p.pullOutFrameStep;

                    // If we've pulled it right out, stop animating
                    if (currentPullOutDistance >= p.maxPullOutDistance) {
                        clearInterval(animationId);
                        return;
                    }

                    // Draw the frame
                    g.drawChart();
                },


                /**
                * Push any pulled-out slice back in.
                *
                * Resets the animation variables and redraws the chart.
                * Also un-highlights all rows in the table.
                */

                pushIn: function () {
                    currentPullOutSlice = -1;
                    currentPullOutDistance = 0;
                    clearInterval(animationId);
                    g.drawChart();
                    $('#chartData td').removeClass('highlight');
                },


                /**
                * Draw the chart.
                *
                * Loop through each slice of the pie, and draw it.
                */

                drawChart: function () {

                    // Get a drawing context
                    var context = canvas.getContext('2d');

                    // Clear the canvas, ready for the new frame
                    context.clearRect(0, 0, canvasWidth, canvasHeight);

                    // Draw each slice of the chart, skipping the pull-out slice (if any)
                    for (var slice in chartData) {
                        if (slice != currentPullOutSlice) g.drawSlice(context, slice);
                    }

                    // If there's a pull-out slice in effect, draw it.
                    // (We draw the pull-out slice last so its drop shadow doesn't get painted over.)
                    if (currentPullOutSlice != -1)
                        g.drawSlice(context, currentPullOutSlice);
                },


                /**
                * Draw an individual slice in the chart.
                *
                * param Context A canvas context to draw on  
                * param Number The index of the slice to draw
                */

                drawSlice: function (context, slice) {

                    // Compute the adjusted start and end angles for the slice
                    var startAngle = chartData[slice]['startAngle'] + p.chartStartAngle;
                    var endAngle = chartData[slice]['endAngle'] + p.chartStartAngle;

                    if (slice == currentPullOutSlice) {

                        // We're pulling (or have pulled) this slice out.
                        // Offset it from the pie centre, draw the text label,
                        // and add a drop shadow.

                        var midAngle = (startAngle + endAngle) / 2;
                        var actualPullOutDistance = currentPullOutDistance * g.easeOut(currentPullOutDistance / p.maxPullOutDistance, .8);
                        startX = centreX + Math.cos(midAngle) * actualPullOutDistance;
                        startY = centreY + Math.sin(midAngle) * actualPullOutDistance;
                        context.fillStyle = 'rgb(' + chartColours[slice].join(',') + ')';
                        context.textAlign = "center";
                        context.font = p.pullOutLabelFont;
                        context.fillText(chartData[slice]['label'], centreX + Math.cos(midAngle) * (chartRadius + p.maxPullOutDistance + p.pullOutLabelPadding), centreY + Math.sin(midAngle) * (chartRadius + p.maxPullOutDistance + p.pullOutLabelPadding));
                        context.font = p.pullOutValueFont;
                        context.fillText(p.pullOutValuePrefix + chartData[slice]['value'] + " (" + (parseInt(chartData[slice]['value'] / totalValue * 100 + .5)) + "%)", centreX + Math.cos(midAngle) * (chartRadius + p.maxPullOutDistance + p.pullOutLabelPadding), centreY + Math.sin(midAngle) * (chartRadius + p.maxPullOutDistance + p.pullOutLabelPadding) + 20);
                        context.shadowOffsetX = p.pullOutShadowOffsetX;
                        context.shadowOffsetY = p.pullOutShadowOffsetY;
                        context.shadowBlur = p.pullOutShadowBlur;

                    } else {

                        // This slice isn't pulled out, so draw it from the pie centre
                        startX = centreX;
                        startY = centreY;
                    }

                    // Set up the gradient fill for the slice
                    var sliceGradient = context.createLinearGradient(0, 0, canvasWidth * .75, canvasHeight * .75);
                    sliceGradient.addColorStop(0, p.sliceGradientColour);
                    sliceGradient.addColorStop(1, 'rgb(' + chartColours[slice].join(',') + ')');

                    // Draw the slice
                    context.beginPath();
                    context.moveTo(startX, startY);
                    context.arc(startX, startY, chartRadius, startAngle, endAngle, false);
                    context.lineTo(startX, startY);
                    context.closePath();
                    context.fillStyle = sliceGradient;
                    context.shadowColor = (slice == currentPullOutSlice) ? p.pullOutShadowColour : "rgba( 0, 0, 0, 0 )";
                    context.fill();
                    context.shadowColor = "rgba( 0, 0, 0, 0 )";

                    // Style the slice border appropriately
                    if (slice == currentPullOutSlice) {
                        context.lineWidth = p.pullOutBorderWidth;
                        context.strokeStyle = p.pullOutBorderStyle;
                    } else {
                        context.lineWidth = p.sliceBorderWidth;
                        context.strokeStyle = p.sliceBorderStyle;
                    }

                    // Draw the slice border
                    context.stroke();
                },


                /**
                * Easing function.
                *
                * A bit hacky but it seems to work! (Note to self: Re-read my school maths books sometime)
                *
                * param Number The ratio of the current distance travelled to the maximum distance
                * param Number The power (higher numbers = more gradual easing)
                * return Number The new ratio
                */

                easeOut: function (ratio, power) {
                    return (Math.pow(1 - ratio, power) + 1);
                }
            }

            var options = $.extend(p, options);
            // Set things up and draw the chart
            // Get the canvas element in the page
            canvas = $(this)[0];
            g.init();
        },

        //plugin name - barchart         
        barchart: function (options) {
            var p = {
                isStackedChart: false,
                isVertical: true,
                distanceBetweenBars: 10,
                chartSizePercent: 80,
                barWidth: 25,
                barBorderWidth: 1,
                barBorderStyle: "#fff",
                barGradientColour: "#ddd",
                maxPullOutDistance: 10,
                pullOutFrameStep: 4,
                pullOutFrameInterval: 40,
                pullOutLabelPadding: 65,
                pullOutLabelFont: "bold 16px 'Roboto', Verdana, sans-serif",
                pullOutValueFont: "bold 12px 'Roboto', Verdana, sans-serif",
                pullOutValuePrefix: "$",
                pullOutShadowColour: "rgba( 0, 0, 0, .5 )",
                pullOutShadowOffsetX: 5,
                pullOutShadowOffsetY: 5,
                pullOutShadowBlur: 5,
                pullOutBorderWidth: 2,
                pullOutBorderStyle: "#333",
                chartStartAngle: -.5 * Math.PI,
                tableId: "chartData",
                sliceBorderWidth: 1,
                sliceBorderStyle: "#fff",
                sliceGradientColour: "#ddd"
            };

            var canvas;
            var currentPullOutBar = -1;
            var currentPullOutDistance = 0;
            var animationId = 0;
            var chartData = [];
            var chartColours = [];
            var canvasWidth;
            var canvasHeight;
            var centreX;
            var centreY;
            var chartHeight;
            var chartWidth;

            var g = {
                /**
                * Set up the chart data and colours, as well as the chart and table click handlers,
                * and draw the initial pie chart
                */
                init: function () {
                    // Exit if the browser isn't canvas-capable
                    if (typeof canvas.getContext === 'undefined') return;

                    // Initialise some properties of the canvas and chart
                    canvasWidth = canvas.width;
                    canvasHeight = canvas.height;
                    
                    chartHeight = canvasHeight * (p.chartSizePercent / 100);
                    chartWidth = canvasWidth * (p.chartSizePercent / 100);

                    centreX = (canvasWidth - chartWidth) / 2;
                    centreY = canvasHeight - (canvasHeight - chartHeight) / 2;
                    // Grab the data from the table,
                    // and assign click handlers to the table data cells

                    var currentRow = -1;
                    var currentCell = 0;

                    $('#chartData td').each(function () {
                        currentCell++;
                        if (currentCell % 2 != 0) {
                            currentRow++;
                            chartData[currentRow] = [];
                            chartData[currentRow]['label'] = $(this).text();
                        } else {
                            var value = parseFloat($(this).text());
                            value = value.toFixed(2);
                            chartData[currentRow]['value'] = value;
                        }

                        // Store the slice index in this cell, and attach a click handler to it
                        $(this).data('bar', currentRow);
                        $(this).click(g.handleTableClick);

                        // Extract and store the cell colour
                        if (rgb = $(this).css('color').match(/rgb\((\d+), (\d+), (\d+)/)) {
                            chartColours[currentRow] = [rgb[1], rgb[2], rgb[3]];
                        } else if (hex = $(this).css('color').match(/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/)) {
                            chartColours[currentRow] = [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
                        } else {
                            alert("Error: Colour could not be determined! Please specify table colours using the format '#xxxxxx'");
                            return;
                        }
                    });

                    // Now compute and store the start and end angles of each slice in the chart data

                    var currentPos = 0; // The current position of the slice in the pie (from 0 to 1)

                    for (var bar in chartData) {
                        chartData[bar]['startPos'] = centreX + currentPos;
                        chartData[bar]['barHeight'] = (chartData[bar]['value'] * chartHeight / 8000).toFixed(0);
                        currentPos += (p.barWidth + p.distanceBetweenBars);
                    }

                    // All ready! Now draw the pie chart, and add the click handler to it
                    g.drawChart();
                    $('#chart').click(g.handleChartClick);
                },


                /**
                * Process mouse clicks in the chart area.
                *
                * If a slice was clicked, toggle it in or out.
                * If the user clicked outside the pie, push any slices back in.
                *
                * param Event The click event
                */

                handleChartClick: function (clickEvent) {
                    // Get the mouse cursor position at the time of the click, relative to the canvas
                    var mouseX = clickEvent.pageX - this.offsetLeft;
                    var mouseY = clickEvent.pageY - this.offsetTop;

                    // Was the click inside the pie chart?
                    // Find the slice that was clicked by comparing angles relative to the chart centre.

                    for (var slice in chartData) {
                        if (mouseX >= chartData[slice]['startPos'] && mouseX <= (chartData[slice]['startPos'] + p.barWidth)
                            && mouseY >= (centreY - chartData[slice]['barHeight']) && mouseY <= centreY) {

                            // Slice found. Pull it out or push it in, as required.
                            g.toggleSlice(slice);
                            return;
                        }
                    }

                    // User must have clicked outside the pie. Push any pulled-out slice back in.
                    g.pushIn();
                },


                /**
                * Process mouse clicks in the table area.
                *
                * Retrieve the slice number from the jQuery data stored in the
                * clicked table cell, then toggle the slice
                *
                * param Event The click event
                */

                handleTableClick: function (clickEvent) {
                    var bar = $(this).data('bar');
                    g.toggleSlice(bar);
                },


                /**
                * Push a slice in or out.
                *
                * If it's already pulled out, push it in. Otherwise, pull it out.
                *
                * param Number The slice index (between 0 and the number of slices - 1)
                */

                toggleSlice: function (bar) {
                    if (bar == currentPullOutBar) {
                        g.pushIn();
                    } else {
                        g.startPullOut(bar);
                    }
                },


                /**
                * Start pulling a slice out from the pie.
                *
                * param Number The slice index (between 0 and the number of slices - 1)
                */

                startPullOut: function (slice) {

                    // Exit if we're already pulling out this slice
                    if (currentPullOutBar == slice)
                        return;

                    // Record the slice that we're pulling out, clear any previous animation, then start the animation
                    currentPullOutBar = slice;
                    currentPullOutDistance = 0;
                    clearInterval(animationId);
                    animationId = setInterval(function () { g.animatePullOut(slice); }, p.pullOutFrameInterval);

                    // Highlight the corresponding row in the key table
                    $('#chartData td').removeClass('highlight');
                    var labelCell = $('#chartData td:eq(' + (slice * 2) + ')');
                    var valueCell = $('#chartData td:eq(' + (slice * 2 + 1) + ')');
                    labelCell.addClass('highlight');
                    valueCell.addClass('highlight');
                },


                /**
                * Draw a frame of the pull-out animation.
                *
                * param Number The index of the slice being pulled out
                */

                animatePullOut: function (slice) {

                    // Pull the slice out some more
                    currentPullOutDistance += p.pullOutFrameStep;

                    // If we've pulled it right out, stop animating
                    if (currentPullOutDistance >= p.maxPullOutDistance) {
                        clearInterval(animationId);
                        return;
                    }

                    // Draw the frame
                    g.drawChart();
                },


                /**
                * Push any pulled-out slice back in.
                *
                * Resets the animation variables and redraws the chart.
                * Also un-highlights all rows in the table.
                */

                pushIn: function () {
                    currentPullOutBar = -1;
                    currentPullOutDistance = 0;
                    clearInterval(animationId);
                    g.drawChart();
                    $('#chartData td').removeClass('highlight');
                },


                /**
                * Draw the chart.
                *
                * Loop through each slice of the pie, and draw it.
                */

                drawChart: function () {

                    // Get a drawing context
                    var context = canvas.getContext('2d');

                    // Clear the canvas, ready for the new frame
                    context.clearRect(0, 0, canvasWidth, canvasHeight);

                    // Draw each slice of the chart, skipping the pull-out slice (if any)
                    for (var slice in chartData) {
                        if (slice != currentPullOutBar) g.drawSlice(context, slice);
                    }

                    // If there's a pull-out slice in effect, draw it.
                    // (We draw the pull-out slice last so its drop shadow doesn't get painted over.)
                    if (currentPullOutBar != -1)
                        g.drawSlice(context, currentPullOutBar);
                },


                /**
                * Draw an individual slice in the chart.
                *
                * param Context A canvas context to draw on  
                * param Number The index of the slice to draw
                */

                drawSlice: function (context, slice) {
                
                    if (slice == currentPullOutBar) {

                        // We're pulling (or have pulled) this slice out.
                        // Offset it from the pie centre, draw the text label,
                        // and add a drop shadow.
                        
                        startX = chartData[slice]['startPos'];
                        startY = centreY;

                        context.fillStyle = 'rgb(' + chartColours[slice].join(',') + ')';
                        context.textAlign = "center";
                        context.font = p.pullOutLabelFont;
                        context.fillText(chartData[slice]['label'], startX, 
                                                                    (startY - chartData[slice]['barHeight'] - 50));
                        context.font = p.pullOutValueFont;
                        context.fillText(" (" + p.pullOutValuePrefix + chartData[slice]['value'] + ")", 
                                    startX, 
                                    (startY - chartData[slice]['barHeight'] - 50) + 20);

                        context.shadowOffsetX = p.pullOutShadowOffsetX;
                        context.shadowOffsetY = p.pullOutShadowOffsetY;
                        context.shadowBlur = p.pullOutShadowBlur;

                    } else {

                        // This slice isn't pulled out, so draw it from the pie centre
                        startX = chartData[slice]['startPos'];
                        startY = centreY;
                    }

                    // Set up the gradient fill for the slice
                    var sliceGradient = context.createLinearGradient(0, 0, canvasWidth * .75, canvasHeight * .75);
                    sliceGradient.addColorStop(0, p.sliceGradientColour);
                    sliceGradient.addColorStop(1, 'rgb(' + chartColours[slice].join(',') + ')');

                    // Draw the slice
                    context.beginPath();
                    context.moveTo(startX, startY);
                    context.rect(startX, startY - chartData[slice]['barHeight'], p.barWidth, chartData[slice]['barHeight']);
                    context.closePath();
                    context.fillStyle = sliceGradient;
                    context.shadowColor = (slice == currentPullOutBar) ? p.pullOutShadowColour : "rgba( 0, 0, 0, 0 )";
                    context.fill();
                    context.shadowColor = "rgba( 0, 0, 0, 0 )";

                    // Style the slice border appropriately
                    if (slice == currentPullOutBar) {
                        context.lineWidth = p.pullOutBorderWidth;
                        context.strokeStyle = p.pullOutBorderStyle;
                    } else {
                        context.lineWidth = p.sliceBorderWidth;
                        context.strokeStyle = p.sliceBorderStyle;
                    }

                    // Draw the slice border
                    context.stroke();
                },


                /**
                * Easing function.
                *
                * A bit hacky but it seems to work! (Note to self: Re-read my school maths books sometime)
                *
                * param Number The ratio of the current distance travelled to the maximum distance
                * param Number The power (higher numbers = more gradual easing)
                * return Number The new ratio
                */

                easeOut: function (ratio, power) {
                    return (Math.pow(1 - ratio, power) + 1);
                }
            }

            var options = $.extend(p, options);
            // Set things up and draw the chart
            // Get the canvas element in the page
            canvas = $(this)[0];
            g.init();
        },

        //plugin name - donutchart
        donutchart: function (options, series) {
            var p = {
                chartSizePercent: 80,
                sliceBorderWidth: 1,
                sliceBorderStyle: "#fff",
                sliceGradientColour: "#ddd",
                maxPullOutDistance: 10,
                pullOutFrameStep: 4,
                pullOutFrameInterval: 40,
                pullOutLabelPadding: 65,
                pullOutLabelFont: "bold 16px 'Roboto', Verdana, sans-serif",
                pullOutValueFont: "bold 12px 'Roboto', Verdana, sans-serif",
                pullOutValuePrefix: "$",
                pullOutShadowColour: "rgba( 0, 0, 0, .5 )",
                pullOutShadowOffsetX: 5,
                pullOutShadowOffsetY: 5,
                pullOutShadowBlur: 5,
                pullOutBorderWidth: 2,
                pullOutBorderStyle: "#333",
                chartStartAngle: -.5 * Math.PI,
                tableId: "chartData"
            };

            var canvas;
            var currentPullOutSlice = -1;
            var currentPullOutDistance = 0;
            var animationId = 0;
            var chartData = [];
            var chartColours = [];
            var defaultColours = [
                [30,174,219],
                [40,184,229],
                [50,194,239],
                [60,204,249]
            ];
            var totalValue = 0;
            var canvasWidth;
            var canvasHeight;
            var centreX;
            var centreY;
            var chartRadius;
            var ringWidth;

            var g = {
                /**
                 * Set up the chart data and colours, as well as the chart and table click handlers,
                 * and draw the initial pie chart
                 */
                init: function () {
                    // Exit if the browser isn't canvas-capable
                    if (typeof canvas.getContext === 'undefined') return;

                    // Initialise some properties of the canvas and chart
                    canvasWidth = canvas.width;
                    canvasHeight = canvas.height;
                    centreX = canvasWidth / 2;
                    centreY = canvasHeight / 2;
                    chartRadius = Math.min(canvasWidth, canvasHeight) / 2 * (p.chartSizePercent / 100);
                    ringWidth = chartRadius / 2;
                    chartRadius -= ringWidth / 2;

                    // Grab the data from the table,
                    // and assign click handlers to the table data cells

                    var currentRow = -1;
                    var currentCell = 0;

                    if (series !== undefined) {
                        for(var item in series){
                            chartData[item] = [];
                            chartData[item]['label'] = series[item][0];
                            chartData[item]['value'] = series[item][1];
                            chartColours[item]=defaultColours[item%4];
                            totalValue += series[item][1];
                        }
                    }
                    else {
                        $('#chartData td').each(function () {
                            currentCell++;
                            if (currentCell % 2 != 0) {
                                currentRow++;
                                chartData[currentRow] = [];
                                chartData[currentRow]['label'] = $(this).text();
                            } else {
                                var value = parseFloat($(this).text());
                                totalValue += value;
                                value = value.toFixed(2);
                                chartData[currentRow]['value'] = value;
                            }

                            // Store the slice index in this cell, and attach a click handler to it
                            $(this).data('slice', currentRow);
                            $(this).click(g.handleTableClick);

                            // Extract and store the cell colour
                            if (rgb = $(this).css('color').match(/rgb\((\d+), (\d+), (\d+)/)) {
                                chartColours[currentRow] = [rgb[1], rgb[2], rgb[3]];
                            } else if (hex = $(this).css('color').match(/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/)) {
                                chartColours[currentRow] = [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
                            } else {
                                alert("Error: Colour could not be determined! Please specify table colours using the format '#xxxxxx'");
                                return;
                            }
                        });
                    }
                    // Now compute and store the start and end angles of each slice in the chart data

                    var currentPos = 0; // The current position of the slice in the pie (from 0 to 1)

                    for (var slice in chartData) {
                        chartData[slice]['startAngle'] = 2 * Math.PI * currentPos;
                        chartData[slice]['endAngle'] = 2 * Math.PI * (currentPos + (chartData[slice]['value'] / totalValue));
                        currentPos += chartData[slice]['value'] / totalValue;
                    }

                    // All ready! Now draw the pie chart, and add the click handler to it
                    g.drawChart();
                    $('#chart').click(g.handleChartClick);
                },


                /**
                 * Process mouse clicks in the chart area.
                 *
                 * If a slice was clicked, toggle it in or out.
                 * If the user clicked outside the pie, push any slices back in.
                 *
                 * param Event The click event
                 */

                handleChartClick: function (clickEvent) {
                    // Get the mouse cursor position at the time of the click, relative to the canvas
                    var mouseX = clickEvent.pageX - this.offsetLeft;
                    var mouseY = clickEvent.pageY - this.offsetTop;

                    // Was the click inside the pie chart?
                    var xFromCentre = mouseX - centreX;
                    var yFromCentre = mouseY - centreY;
                    var distanceFromCentre = Math.sqrt(Math.pow(Math.abs(xFromCentre), 2) + Math.pow(Math.abs(yFromCentre), 2));

                    if (distanceFromCentre <= chartRadius) {

                        // Yes, the click was inside the chart.
                        // Find the slice that was clicked by comparing angles relative to the chart centre.

                        var clickAngle = Math.atan2(yFromCentre, xFromCentre) - p.chartStartAngle;
                        if (clickAngle < 0) clickAngle = 2 * Math.PI + clickAngle;

                        for (var slice in chartData) {
                            if (clickAngle >= chartData[slice]['startAngle'] && clickAngle <= chartData[slice]['endAngle']) {

                                // Slice found. Pull it out or push it in, as required.
                                g.toggleSlice(slice);
                                return;
                            }
                        }
                    }

                    // User must have clicked outside the pie. Push any pulled-out slice back in.
                    g.pushIn();
                },


                /**
                 * Process mouse clicks in the table area.
                 *
                 * Retrieve the slice number from the jQuery data stored in the
                 * clicked table cell, then toggle the slice
                 *
                 * param Event The click event
                 */

                handleTableClick: function (clickEvent) {
                    var slice = $(this).data('slice');
                    g.toggleSlice(slice);
                },


                /**
                 * Push a slice in or out.
                 *
                 * If it's already pulled out, push it in. Otherwise, pull it out.
                 *
                 * param Number The slice index (between 0 and the number of slices - 1)
                 */

                toggleSlice: function (slice) {
                    if (slice == currentPullOutSlice) {
                        g.pushIn();
                    } else {
                        g.startPullOut(slice);
                    }
                },


                /**
                 * Start pulling a slice out from the pie.
                 *
                 * param Number The slice index (between 0 and the number of slices - 1)
                 */

                startPullOut: function (slice) {

                    // Exit if we're already pulling out this slice
                    if (currentPullOutSlice == slice)
                        return;

                    // Record the slice that we're pulling out, clear any previous animation, then start the animation
                    currentPullOutSlice = slice;
                    currentPullOutDistance = 0;
                    clearInterval(animationId);
                    animationId = setInterval(function () { g.animatePullOut(slice); }, p.pullOutFrameInterval);

                    // Highlight the corresponding row in the key table
                    $('#chartData td').removeClass('highlight');
                    var labelCell = $('#chartData td:eq(' + (slice * 2) + ')');
                    var valueCell = $('#chartData td:eq(' + (slice * 2 + 1) + ')');
                    labelCell.addClass('highlight');
                    valueCell.addClass('highlight');
                },


                /**
                 * Draw a frame of the pull-out animation.
                 *
                 * param Number The index of the slice being pulled out
                 */

                animatePullOut: function (slice) {

                    // Pull the slice out some more
                    currentPullOutDistance += p.pullOutFrameStep;

                    // If we've pulled it right out, stop animating
                    if (currentPullOutDistance >= p.maxPullOutDistance) {
                        clearInterval(animationId);
                        return;
                    }

                    // Draw the frame
                    g.drawChart();
                },


                /**
                 * Push any pulled-out slice back in.
                 *
                 * Resets the animation variables and redraws the chart.
                 * Also un-highlights all rows in the table.
                 */

                pushIn: function () {
                    currentPullOutSlice = -1;
                    currentPullOutDistance = 0;
                    clearInterval(animationId);
                    g.drawChart();
                    $('#chartData td').removeClass('highlight');
                },


                /**
                 * Draw the chart.
                 *
                 * Loop through each slice of the pie, and draw it.
                 */

                drawChart: function () {

                    // Get a drawing context
                    var context = canvas.getContext('2d');

                    // Clear the canvas, ready for the new frame
                    context.clearRect(0, 0, canvasWidth, canvasHeight);

                    // Draw each slice of the chart, skipping the pull-out slice (if any)
                    for (var slice in chartData) {
                        if (slice != currentPullOutSlice) g.drawSlice(context, slice);
                    }

                    // If there's a pull-out slice in effect, draw it.
                    // (We draw the pull-out slice last so its drop shadow doesn't get painted over.)
                    if (currentPullOutSlice != -1)
                        g.drawSlice(context, currentPullOutSlice);
                },


                /**
                 * Draw an individual slice in the chart.
                 *
                 * param Context A canvas context to draw on
                 * param Number The index of the slice to draw
                 */

                drawSlice: function (context, slice) {

                    // Compute the adjusted start and end angles for the slice
                    var startAngle = chartData[slice]['startAngle'] + p.chartStartAngle;
                    var endAngle = chartData[slice]['endAngle'] + p.chartStartAngle;

                    if (slice == currentPullOutSlice) {

                        // We're pulling (or have pulled) this slice out.
                        // Offset it from the pie centre, draw the text label,
                        // and add a drop shadow.

                        var midAngle = (startAngle + endAngle) / 2;
                        var actualPullOutDistance = currentPullOutDistance * g.easeOut(currentPullOutDistance / p.maxPullOutDistance, .8);
                        startX = centreX + Math.cos(midAngle) * actualPullOutDistance;
                        startY = centreY + Math.sin(midAngle) * actualPullOutDistance;
                        context.fillStyle = 'rgb(' + chartColours[slice].join(',') + ')';
                        context.textAlign = "center";
                        context.font = p.pullOutLabelFont;
                        context.fillText(chartData[slice]['label'], centreX + Math.cos(midAngle) * (chartRadius + p.maxPullOutDistance + p.pullOutLabelPadding), centreY + Math.sin(midAngle) * (chartRadius + p.maxPullOutDistance + p.pullOutLabelPadding));
                        context.font = p.pullOutValueFont;
                        context.fillText(p.pullOutValuePrefix + chartData[slice]['value'] + " (" + (parseInt(chartData[slice]['value'] / totalValue * 100 + .5)) + "%)", centreX + Math.cos(midAngle) * (chartRadius + p.maxPullOutDistance + p.pullOutLabelPadding), centreY + Math.sin(midAngle) * (chartRadius + p.maxPullOutDistance + p.pullOutLabelPadding) + 20);
                        context.shadowOffsetX = p.pullOutShadowOffsetX;
                        context.shadowOffsetY = p.pullOutShadowOffsetY;
                        context.shadowBlur = p.pullOutShadowBlur;

                    } else {

                        // This slice isn't pulled out, so draw it from the pie centre
                        startX = centreX;
                        startY = centreY;
                    }

                    // Set up the gradient fill for the slice
                    var sliceGradient = context.createLinearGradient(0, 0, canvasWidth * .75, canvasHeight * .75);
                    sliceGradient.addColorStop(0, p.sliceGradientColour);
                    sliceGradient.addColorStop(1, 'rgb(' + chartColours[slice].join(',') + ')');

                    // Draw the slice
                    context.beginPath();
                    //context.moveTo(startX, startY);
                    context.strokeStyle = sliceGradient;
                    context.lineWidth=ringWidth;
                    context.arc(startX, startY, chartRadius, startAngle, endAngle, false);
                    //context.lineTo(startX, startY);
                    //context.closePath();
                    //context.fillStyle = sliceGradient;
                    context.shadowColor = (slice == currentPullOutSlice) ? p.pullOutShadowColour : "rgba( 0, 0, 0, 0 )";
                    //context.fill();
                    context.shadowColor = "rgba( 0, 0, 0, 0 )";

                    // Style the slice border appropriately
                    /*
                    if (slice == currentPullOutSlice) {
                        context.lineWidth = p.pullOutBorderWidth;
                        context.strokeStyle = p.pullOutBorderStyle;
                    } else {
                        context.lineWidth = p.sliceBorderWidth;
                        context.strokeStyle = p.sliceBorderStyle;
                    }
                    */

                    // Draw the slice border
                    context.stroke();
                },


                /**
                 * Easing function.
                 *
                 * A bit hacky but it seems to work! (Note to self: Re-read my school maths books sometime)
                 *
                 * param Number The ratio of the current distance travelled to the maximum distance
                 * param Number The power (higher numbers = more gradual easing)
                 * return Number The new ratio
                 */

                easeOut: function (ratio, power) {
                    return (Math.pow(1 - ratio, power) + 1);
                }
            }

            var options = $.extend(p, options);
            // Set things up and draw the chart
            // Get the canvas element in the page
            canvas = $(this)[0];
            g.init();
        },

        //plugin name - linechart
        linechart: function (options, series) {
            var p = {
                isStackedChart: false,
                isVertical: true,
                distanceBetweenBars: 10,
                chartSizePercent: 80,
                barWidth: 25,
                barBorderWidth: 1,
                barBorderStyle: "#fff",
                barGradientColour: "#ddd",
                maxPullOutDistance: 10,
                pullOutFrameStep: 4,
                pullOutFrameInterval: 40,
                pullOutLabelPadding: 65,
                pullOutLabelFont: "bold 16px 'Roboto', Verdana, sans-serif",
                pullOutValueFont: "bold 12px 'Roboto', Verdana, sans-serif",
                pullOutValuePrefix: "$",
                pullOutShadowColour: "rgba( 0, 0, 0, .5 )",
                pullOutShadowOffsetX: 5,
                pullOutShadowOffsetY: 5,
                pullOutShadowBlur: 5,
                pullOutBorderWidth: 2,
                pullOutBorderStyle: "#333",
                chartStartAngle: -.5 * Math.PI,
                tableId: "chartData",
                sliceBorderWidth: 1,
                sliceBorderStyle: "#fff",
                sliceGradientColour: "#ddd"
            };

            var canvas;
            var currentPullOutBar = -1;
            var currentPullOutDistance = 0;
            var animationId = 0;
            var chartData = [];
            var chartColours = [];
            var canvasWidth;
            var canvasHeight;
            var centreX;
            var centreY;
            var chartHeight;
            var chartWidth;
            var defaultColours = [
                [30,174,219],
                [60,204,249],
                [50,194,239],
                [40,184,229]
            ];
            var nooflines = 0;
            var noofitems = 0;

            var g = {
                /**
                 * Set up the chart data and colours, as well as the chart and table click handlers,
                 * and draw the initial pie chart
                 */
                init: function () {
                    // Exit if the browser isn't canvas-capable
                    if (typeof canvas.getContext === 'undefined') return;

                    // Initialise some properties of the canvas and chart
                    canvasWidth = canvas.width;
                    canvasHeight = canvas.height;

                    chartHeight = canvasHeight * (p.chartSizePercent / 100);
                    chartWidth = canvasWidth * (p.chartSizePercent / 100);

                    centreX = (canvasWidth - chartWidth) / 2;
                    centreY = canvasHeight - (canvasHeight - chartHeight) / 2;
                    // Grab the data from the table,
                    // and assign click handlers to the table data cells

                    var currentRow = -1;
                    var currentCell = 0;
                    var minn=0;
                    var maxx=0;

                    if (series !== undefined) {
                        var slice = 0;
                        nooflines = series[0][2].length;
                        noofitems = series.length;

                        for(var line in series[0][2]) {
                            chartData[line] = [];
                            for(var item in series){
                                chartData[line][item] = [];
                                chartData[line][item]['label'] = series[item][2][line];
                                chartData[line][item]['value'] = series[item][1][line];
                                chartData[line][item]['color'] = defaultColours[line % 4];
                                if(series[item][1][line]>maxx)
                                    maxx=series[item][1][line];
                                if(series[item][1][line]<minn)
                                    minn=series[item][1][line];
                                //totalValue += series[item][1];
                                slice++;
                            }
                        }
                    }
                    else {
                        $('#chartData td').each(function () {
                            currentCell++;
                            if (currentCell % 2 != 0) {
                                currentRow++;
                                chartData[currentRow] = [];
                                chartData[currentRow]['label'] = $(this).text();
                            } else {
                                var value = parseFloat($(this).text());
                                value = value.toFixed(2);
                                chartData[currentRow]['value'] = value;
                            }

                            // Store the slice index in this cell, and attach a click handler to it
                            $(this).data('bar', currentRow);
                            $(this).click(g.handleTableClick);

                            // Extract and store the cell colour
                            if (rgb = $(this).css('color').match(/rgb\((\d+), (\d+), (\d+)/)) {
                                chartColours[currentRow] = [rgb[1], rgb[2], rgb[3]];
                            } else if (hex = $(this).css('color').match(/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/)) {
                                chartColours[currentRow] = [parseInt(hex[1], 16), parseInt(hex[2], 16), parseInt(hex[3], 16)];
                            } else {
                                alert("Error: Colour could not be determined! Please specify table colours using the format '#xxxxxx'");
                                return;
                            }
                        });
                    }

                    // Now compute and store the start and end angles of each slice in the chart data

                    var currentPos = 0; // The current position of the slice in the pie (from 0 to 1)
                    p.distanceBetweenBars = parseInt(canvasWidth/noofitems);

                    for (var line in chartData) {
                        currentPos = parseInt(canvasWidth/(2*noofitems));

                        for (var bar in chartData[line]) {
                            chartData[line][bar]['startPos'] = centreX + currentPos;
                            chartData[line][bar]['barHeight'] = (chartData[line][bar]['value'] * chartHeight / (maxx-minn)).toFixed(0);
                            currentPos += p.distanceBetweenBars;
                        }
                    }

                    // All ready! Now draw the pie chart, and add the click handler to it
                    g.drawChart();
                    $('#chart').click(g.handleChartClick);
                },


                /**
                 * Process mouse clicks in the chart area.
                 *
                 * If a slice was clicked, toggle it in or out.
                 * If the user clicked outside the pie, push any slices back in.
                 *
                 * param Event The click event
                 */

                handleChartClick: function (clickEvent) {
                    // Get the mouse cursor position at the time of the click, relative to the canvas
                    var mouseX = clickEvent.pageX - this.offsetLeft;
                    var mouseY = clickEvent.pageY - this.offsetTop;

                    // Was the click inside the pie chart?
                    // Find the slice that was clicked by comparing angles relative to the chart centre.

                    for (var slice in chartData) {
                        if (mouseX >= chartData[slice]['startPos'] && mouseX <= (chartData[slice]['startPos'] + p.barWidth)
                            && mouseY >= (centreY - chartData[slice]['barHeight']) && mouseY <= centreY) {

                            // Slice found. Pull it out or push it in, as required.
                            g.toggleSlice(slice);
                            return;
                        }
                    }

                    // User must have clicked outside the pie. Push any pulled-out slice back in.
                    g.pushIn();
                },


                /**
                 * Process mouse clicks in the table area.
                 *
                 * Retrieve the slice number from the jQuery data stored in the
                 * clicked table cell, then toggle the slice
                 *
                 * param Event The click event
                 */

                handleTableClick: function (clickEvent) {
                    var bar = $(this).data('bar');
                    g.toggleSlice(bar);
                },


                /**
                 * Push a slice in or out.
                 *
                 * If it's already pulled out, push it in. Otherwise, pull it out.
                 *
                 * param Number The slice index (between 0 and the number of slices - 1)
                 */

                toggleSlice: function (bar) {
                    if (bar == currentPullOutBar) {
                        g.pushIn();
                    } else {
                        g.startPullOut(bar);
                    }
                },


                /**
                 * Start pulling a slice out from the pie.
                 *
                 * param Number The slice index (between 0 and the number of slices - 1)
                 */

                startPullOut: function (slice) {

                    // Exit if we're already pulling out this slice
                    if (currentPullOutBar == slice)
                        return;

                    // Record the slice that we're pulling out, clear any previous animation, then start the animation
                    currentPullOutBar = slice;
                    currentPullOutDistance = 0;
                    clearInterval(animationId);
                    animationId = setInterval(function () { g.animatePullOut(slice); }, p.pullOutFrameInterval);

                    // Highlight the corresponding row in the key table
                    $('#chartData td').removeClass('highlight');
                    var labelCell = $('#chartData td:eq(' + (slice * 2) + ')');
                    var valueCell = $('#chartData td:eq(' + (slice * 2 + 1) + ')');
                    labelCell.addClass('highlight');
                    valueCell.addClass('highlight');
                },


                /**
                 * Draw a frame of the pull-out animation.
                 *
                 * param Number The index of the slice being pulled out
                 */

                animatePullOut: function (slice) {

                    // Pull the slice out some more
                    currentPullOutDistance += p.pullOutFrameStep;

                    // If we've pulled it right out, stop animating
                    if (currentPullOutDistance >= p.maxPullOutDistance) {
                        clearInterval(animationId);
                        return;
                    }

                    // Draw the frame
                    g.drawChart();
                },


                /**
                 * Push any pulled-out slice back in.
                 *
                 * Resets the animation variables and redraws the chart.
                 * Also un-highlights all rows in the table.
                 */

                pushIn: function () {
                    currentPullOutBar = -1;
                    currentPullOutDistance = 0;
                    clearInterval(animationId);
                    g.drawChart();
                    $('#chartData td').removeClass('highlight');
                },


                /**
                 * Draw the chart.
                 *
                 * Loop through each slice of the pie, and draw it.
                 */

                drawChart: function () {

                    // Get a drawing context
                    var context = canvas.getContext('2d');

                    // Clear the canvas, ready for the new frame
                    context.clearRect(0, 0, canvasWidth, canvasHeight);

                    // Draw each slice of the chart, skipping the pull-out slice (if any)
                    //for (var slice in chartData) {
                    for(var line in chartData){
                        for(var slice= 0, j=chartData[line].length-1; slice<j;slice++) {
                            if (slice != currentPullOutBar)
                                g.drawSlice(context, line, slice, slice+1);
                        }
                    }

                    // If there's a pull-out slice in effect, draw it.
                    // (We draw the pull-out slice last so its drop shadow doesn't get painted over.)
                    if (currentPullOutBar != -1)
                        g.drawSlice(context, currentPullOutBar);
                },


                /**
                 * Draw an individual slice in the chart.
                 *
                 * param Context A canvas context to draw on
                 * param Number The index of the slice to draw
                 */

                drawSlice: function (context, line, slice, nextslice) {

                    if (slice == currentPullOutBar) {

                        // We're pulling (or have pulled) this slice out.
                        // Offset it from the pie centre, draw the text label,
                        // and add a drop shadow.

                        startX = chartData[line][slice]['startPos'];
                        startY = centreY;

                        context.fillStyle = 'rgb(' + chartData[line][slice]['color'].join(',') + ')';
                        context.textAlign = "center";
                        context.font = p.pullOutLabelFont;
                        context.fillText(chartData[line][slice]['label'], startX,
                            (startY - chartData[line][slice]['barHeight'] - 50));
                        context.font = p.pullOutValueFont;
                        context.fillText(" (" + p.pullOutValuePrefix + chartData[line][slice]['value'] + ")",
                            startX,
                            (startY - chartData[line][slice]['barHeight'] - 50) + 20);

                        context.shadowOffsetX = p.pullOutShadowOffsetX;
                        context.shadowOffsetY = p.pullOutShadowOffsetY;
                        context.shadowBlur = p.pullOutShadowBlur;

                    } else {

                        // This slice isn't pulled out, so draw it from the pie centre
                        startX = chartData[line][slice]['startPos'];
                        startY = centreY;
                    }

                    // Set up the gradient fill for the slice
                    var sliceGradient = context.createLinearGradient(0, 0, canvasWidth * .75, canvasHeight * .75);
                    sliceGradient.addColorStop(0, p.sliceGradientColour);
                    sliceGradient.addColorStop(1, 'rgb(' + chartData[line][slice]['color'].join(',') + ')');

                    // Draw the slice
                    //context.beginPath();
                    context.lineWidth = 1;
                    context.strokeStyle = sliceGradient;
                    context.moveTo(startX, startY - chartData[line][slice]['barHeight']);
                    //context.arc(startX, startY - chartData[line][slice]['barHeight'], 4, 0,2*Math.PI, false);
                    context.lineTo(chartData[line][nextslice]['startPos'], startY - chartData[line][nextslice]['barHeight']);
                    //context.rect(startX, startY - chartData[slice]['barHeight'], p.barWidth, chartData[slice]['barHeight']);
                    //context.closePath();
                    //context.fillStyle = sliceGradient;
                    context.shadowColor = (slice == currentPullOutBar) ? p.pullOutShadowColour : "rgba( 0, 0, 0, 0 )";
                    //context.fill();
                    context.shadowColor = "rgba( 0, 0, 0, 0 )";

                    // Style the slice border appropriately
                    /*
                    if (slice == currentPullOutBar) {
                        context.lineWidth = p.pullOutBorderWidth;
                        context.strokeStyle = p.pullOutBorderStyle;
                    } else {
                        context.lineWidth = p.sliceBorderWidth;
                        context.strokeStyle = p.sliceBorderStyle;
                    }*/

                    // Draw the slice border
                    context.stroke();
                },


                /**
                 * Easing function.
                 *
                 * A bit hacky but it seems to work! (Note to self: Re-read my school maths books sometime)
                 *
                 * param Number The ratio of the current distance travelled to the maximum distance
                 * param Number The power (higher numbers = more gradual easing)
                 * return Number The new ratio
                 */

                easeOut: function (ratio, power) {
                    return (Math.pow(1 - ratio, power) + 1);
                }
            }

            var options = $.extend(p, options);
            // Set things up and draw the chart
            // Get the canvas element in the page
            canvas = $(this)[0];
            g.init();
        }
    });
})(jQuery);