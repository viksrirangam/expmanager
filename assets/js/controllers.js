/**
 * Created by King on 28-12-2014.
 */

mmApp.controller('ExpenseCtrl', function ($scope, $route, MasterData, DataService) {
    $scope.categories = MasterData.getExpenseCategories();
    $scope.itm = {'category': '', 'amount': '', 'date':''};
    $scope.modelerr="";

    $scope.addExpense=function(itm){
        if(itm.category==""){
            $scope.modelerr = " Please choose a category.";
            return;
        }else if(itm.amount==0){
            $scope.modelerr = " Please enter amount.";
            return;
        }else if(itm.date=="dd-MM-yyyy" ||itm.date==""){
            $scope.modelerr = " Please select a date."
            return;
        }

        DataService.addExpense(itm.category, itm.amount, itm.date);
        $scope.itm = {'category': '', 'amount': 0, 'date':new Date()};
        $scope.modelerr="";
    }
});

mmApp.controller('IncomeCtrl', function ($scope, $route, MasterData, DataService) {
    $scope.categories = MasterData.getIncomeCategories();
    $scope.itm = {'category': '', 'amount': '', 'date':''};
    $scope.modelerr="";

    $scope.addIncome=function(itm){
        if(itm.category==""){
            $scope.modelerr = " Please choose a category.";
            return;
        }else if(itm.amount==0){
            $scope.modelerr = " Please enter amount.";
            return;
        }else if(itm.date=="dd-MM-yyyy" ||itm.date==""){
            $scope.modelerr = " Please select a date."
            return;
        }

        DataService.addIncome(itm.category, itm.amount, itm.date);
        $scope.itm = {'category': '', 'amount': 0, 'date':new Date()};
        $scope.modelerr="";
    }
});

mmApp.controller('ExpenseReportCtrl', function ($scope, ReportData) {
    var summary=ReportData.getExpenseSummary();
    $scope.month=summary.month;
    $scope.totalamount=summary.totalamount;
    $scope.categories=summary.categories;
});

mmApp.controller('IncomeReportCtrl', function ($scope, ReportData) {
    var summary=ReportData.getIncomeSummary();
    $scope.month=summary.month;
    $scope.totalamount=summary.totalamount;
    $scope.categories=summary.categories;
});

mmApp.controller('MonthSummaryCtrl', function ($scope, $route, $routeParams, UtilFuncs, ReportData) {
    $scope.currmonth = UtilFuncs.getCurrMonth();
    if(typeof $routeParams.month != "undefined"){
        $scope.currmonth = $routeParams.month;
    }
    $scope.prevmonth = UtilFuncs.getPrevMonth($scope.currmonth);
    $scope.nextmonth = UtilFuncs.getNextMonth($scope.currmonth);

    var summary=ReportData.getMonthSummary($scope.currmonth);
    $scope.month=summary.month;
    $scope.totalexpenses=summary.totalexpenses;
    $scope.totalincome=summary.totalincome;
});

mmApp.controller('DeviceInfoCtrl', ['$scope', '$window', function ($scope, $window){
    //var w = angular.element($window);
    $scope.width = 300;//w.width();
    $scope.height = 200;//w.height();
}]);

mmApp.controller('SummaryViewCtrl', function ($scope){
    $scope.$on('$viewContentLoaded', function(){
        //Here your view content is fully loaded !!
        $("#chart").linechart({
            tableId: 'chartData'
        })
    });
});