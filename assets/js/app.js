/**
 * Created by King on 28-12-2014.
 */
var mmApp = angular.module('mmApp', ['ngRoute']);

mmApp.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.
            when('/', {
                templateUrl: './partials/add-expense.html',
                controller: 'ExpenseCtrl',
                activetab: "addexpense"
            }).
            when('/addIncome', {
                templateUrl: './partials/add-income.html',
                controller: 'IncomeCtrl',
                activetab: "addincome"
            }).
            when('/summary', {
                templateUrl: './partials/monthly-view.html',
                activetab: "summary"
                //controller: 'SummaryViewCtrl'
            }).
            when('/summary/:month', {
                templateUrl: './partials/monthly-view.html',
                activetab: "summary"
                //controller: 'SummaryViewCtrl'
            }).
            when('/expenseDetail', {
                templateUrl: './partials/expense-detail-view.html',
                activetab: "summary"
            }).
            when('/incomeDetail', {
                templateUrl: './partials/income-detail-view.html',
                activetab: "summary"
            }).
            otherwise({
                redirectTo: '/'
            });
    }]
);