/**
 * Created by King on 01-01-2015.
 */

mmApp.directive('ngBar', function() {
    return {
        restrict: 'A',
        //require: '^ngModel',
        transclude: true,
        link: function(scope, iElement, iAttrs, ctrl) {
            iElement.css("width", scope.item.amountratified+'px');
        }
        //templateUrl: 'partials/ng-sparkline-template.html'
    }
});

mmApp.directive('ngPie', function() {
    return {
        restrict: 'A',
        //require: '^ngModel',
        transclude: true,
        link: function(scope, iElement, iAttrs, ctrl) {
            var series = [];

            series[0] = [];
            series[0][0]="Expenses";
            series[0][1]=scope.totalexpenses;

            series[1] = [];
            series[1][0]="Income";
            series[1][1]=scope.totalincome;

            $("#chart").piechart({
                tableId: 'chartData'
            }, series);
        }
    }
});

mmApp.directive('ngLine', function() {
    return {
        restrict: 'A',
        //require: '^ngModel',
        transclude: true,
        link: function(scope, iElement, iAttrs, ctrl) {
            var series = [];

            series[0] = [];
            series[0][0]="Jan15";
            series[0][1]=[200, 300, 400, 500];
            series[0][2]=["Rent", "Food", "Travel", "Sundry"];

            series[1] = [];
            series[1][0]="Feb15";
            series[1][1]=[500, 500, 600, 900];
            series[1][2]=["Rent", "Food", "Travel", "Sundry"];

            series[2] = [];
            series[2][0]="Mar15";
            series[2][1]=[900, 600, 800, 1000];
            series[2][2]=["Rent", "Food", "Travel", "Sundry"];

            $("#chart").linechart({
                tableId: 'chartData'
            }, series);
        }
    }
});

mmApp.directive('ngChart', function() {
    return {
        restrict: 'A',
        //require: '^ngModel',
        transclude: true,
        link: function(scope, iElement, iAttrs, ctrl) {
            var series = [];

            for(var cat in scope.categories){
                series[cat] = [];
                series[cat][0]=scope.categories[cat]['category'];
                series[cat][1]=scope.categories[cat]['amount'];
            }

            $("#chart").donutchart({
                tableId: 'chartData'
            }, series);
        }
    }
});

mmApp.directive('ngEclipse', ['$window', function($window) {
    return {
        restrict: 'A',
        //require: '^ngModel',
        transclude: false,
        link: function(scope, iElement, iAttrs, ctrl) {
            //var c = document.getElementById("myCanvas");
            var ctx = iElement[0].getContext("2d");

            var v1=scope.totalincome, v2=scope.totalexpenses;

            var cx=125,
                cy=125;

            var r1,r2;
            r1=Math.floor(Math.sqrt(v1*7/22));
            r2=Math.floor(Math.sqrt(v2*7/22));
            var booster=200/(2*Math.max(r1, r2));
            r1*=booster;
            r2*=booster;

            var cy2=cy+(r1-r2);

            // Create gradient
            var grd = ctx.createRadialGradient(75,50,5,90,60,100);
            grd.addColorStop(0,"red");
            grd.addColorStop(1,"white");

            var grd2 = ctx.createRadialGradient(75,50,5,90,60,100);
            grd2.addColorStop(0,"blue");
            grd2.addColorStop(1,"white");

            ctx.beginPath();
            // Fill with gradient
            ctx.arc(cx, cy, r1, 0, 2*Math.PI);
            ctx.fillStyle = '#FFF';
            ctx.fill();
            ctx.closePath();

            // Fill with gradient
            ctx.beginPath();
            ctx.arc(cx, cy2, r2, 0, 2*Math.PI);
            ctx.fillStyle = '#1EAEDB';
            ctx.fill();
            ctx.closePath();
        }
    }
}]);

mmApp.directive('ngSparkline', function() {
    var url = "http://api.openweathermap.org/data/2.5/forecast/daily?mode=json&units=imperial&cnt=7&callback=JSON_CALLBACK&q=";

    return {
        restrict: 'A',
        transclude: true,
        //require: '^ngCity',
        scope: {
            city: '@'
        },
        template: '<div class="sparkline"><div ng-transclude></div><div class="graph"></div></div>',
        controller: ['$scope', '$http', function($scope, $http) {
            $scope.getTemp = function(city) {
                $http({
                    method: 'JSONP',
                    url: url + city
                }).success(function(data) {
                    var weather = [];
                    angular.forEach(data.list, function(value){
                        weather.push(value);
                    });
                    $scope.weather = weather;
                });
            }
        }],
        link: function(scope, iElement, iAttrs, ctrl) {
            scope.getTemp(scope.city);
            scope.$watch('weather', function(newVal) {
                //alert(scope.weather);
                iElement.html('You see weather report here')
            });
        }
    }
});

mmApp.directive('detectActiveTab', function ($location) {
    return {
        link: function postLink(scope, element, attrs) {
            scope.$on("$routeChangeSuccess", function (event, current, previous) {
                if (current.$$route.activetab === attrs.detectActiveTab) {
                    element[0].setAttribute("activated", "true");
                }
                else {
                    element[0].setAttribute("activated", "false");
                }
            });
        }
    };
});