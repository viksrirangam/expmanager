/**
 * Created by King on 28-12-2014.
 */

mmApp.factory("MasterData", function() {
    var expenseCategories = [
        'Commute',
        'Sundry',
        'Rent',
        'Food',
        'Entertainment',
        'Asset',
        'Liability',
        'Medical',
        'Clothing',
        'Education',
        'Others'
    ];

    var incomeCategories = [
        'Salary',
        'Savings Interest',
        'ROI',
        'Rental',
        'Others'
    ];

    return {
        getExpenseCategories: function() {
            return expenseCategories;
        },
        getIncomeCategories: function() {
            return incomeCategories;
        }
    };
});

mmApp.factory("ReportData", function() {
    var expenseSummary = {};
    var incomeSummary = {};
    var monthSummary = {};
    var monthData = {};

    function processForRatification(summaryData){
        var sum = 0;
        for(var cat in summaryData.categories){
            sum+=summaryData.categories[cat]['amount'];
        }

        for(var cat in summaryData.categories){
            summaryData.categories[cat]['amountratified']=Math.floor((summaryData.categories[cat]['amount']/sum)*100);
        }
    }

    function getMonth(str){
        var m="", y="";
        var mm=parseInt(str.substr(0,2));
        y=str.substr(2);

        return [
                "January",
                "February",
                "March",
                "April",
                "May",
                "June",
                "July",
                "August",
                "September",
                "October",
                "November",
                "December"
        ][mm-1]+ " " + y;
    }

    return {
        getExpenseSummary: function() {
            return expenseSummary;
        },
        getIncomeSummary: function() {
            return incomeSummary;
        },
        getMonthSummary: function (month) {
            if(typeof androidAppProxy !== "undefined"){
                //monthData = JSON.parse("{ 'month': '012015','totalexpenses':1480,'categoryExpenses':[{'category':'Asset', 'amount':80},{'category':'Commute', 'amount':80},{'category':'Entertainment', 'amount':80},{'category':'Food', 'amount':1080},{'category':'Rent', 'amount':80},{'category':'Sundry', 'amount':80}],'totalincome':1050,'categoryIncome':[{'category':'Other', 'amount':210},{'category':'ROI', 'amount':210},{'category':'Rental', 'amount':210},{'category':'Salary', 'amount':210},{'category':'Savings Interest', 'amount':210}]}");
                monthData = JSON.parse(androidAppProxy.getData(month));
            } else {
                monthData = {
                    'month': '012015',
                    'totalexpenses':95,
                    'categoryExpenses':[
                        {'category':'Asset', 'amount':40},
                        {'category':'Clothing', 'amount':10},
                        {'category':'Commute', 'amount':4},
                        {'category':'Education', 'amount':10},
                        {'category':'Entertainment', 'amount':6},
                        {'category':'Food', 'amount':4},
                        {'category':'Liability', 'amount':10},
                        {'category':'Medical', 'amount':2},
                        {'category':'Miscellaneous', 'amount':2},
                        {'category':'Rent', 'amount':4},
                        {'category':'Sundry', 'amount':3}
                    ],
                    'totalincome':180,
                    'categoryIncome':[
                        {'category':'Other', 'amount':36},
                        {'category':'ROI', 'amount':36},
                        {'category':'Rental', 'amount':36},
                        {'category':'Salary', 'amount':36},
                        {'category':'Savings Interest', 'amount':36}
                    ]
                };

                /*
                monthData = {
                    'month': '012015',
                    'totalexpenses':null,
                    'categoryExpenses':[
                    ],
                    'totalincome':null,
                    'categoryIncome':[
                    ]
                };*/
            }

            var mon=getMonth(monthData['month']);
            expenseSummary['month']=mon;
            expenseSummary['totalamount']=monthData['totalexpenses'];
            expenseSummary['categories']=monthData['categoryExpenses'];
            processForRatification(expenseSummary);

            incomeSummary['month']=mon;
            incomeSummary['totalamount']=monthData['totalincome'];
            incomeSummary['categories']=monthData['categoryIncome'];
            processForRatification(incomeSummary);

            monthSummary['month']=mon;
            monthSummary['totalexpenses']=monthData['totalexpenses'];
            monthSummary['totalincome']=monthData['totalincome'];

            return monthSummary;
        }
    };
});

mmApp.factory("DataService", function() {

    return {
        addExpense: function(_category, _amount, _incurdate) {
            if(typeof androidAppProxy !== "undefined"){
                androidAppProxy.addItem("expense", _category, _amount, _incurdate);
            }
        },
        addIncome: function(_category, _amount, _incurdate) {
            if(typeof androidAppProxy !== "undefined"){
                androidAppProxy.addItem("income", _category, _amount, _incurdate);
            }
        }
    };
});

mmApp.factory("UtilFuncs", function() {
    function PrefixInteger(num, length) {
        return (Array(length).join('0') + num).slice(-length);
    }
    return {
        getToday: function() {
            var today = new Date();
            return [PrefixInteger(today.getDay(), 2), PrefixInteger(today.getMonth()+1, 2), PrefixInteger(today.getFullYear(), 4)].join("-");
        },
        getNextMonth: function(monthStr) {
            var mon = parseInt(monthStr.substr(0, 2)) + 1;
            var year = parseInt(monthStr.substr(2));
            if(mon>12){
                mon=1;
                year++;
            }
            return [PrefixInteger(mon, 2), PrefixInteger(year, 4)].join("");
        },
        getPrevMonth: function(monthStr) {
            var mon = parseInt(monthStr.substr(0, 2)) - 1;
            var year = parseInt(monthStr.substr(2));
            if(mon<1){
                mon=12;
                year--;
            }
            return [PrefixInteger(mon, 2), PrefixInteger(year, 4)].join("");
        },
        getCurrMonth: function() {
            var today = new Date();
            return [PrefixInteger(today.getMonth()+1, 2), PrefixInteger(today.getFullYear(), 4)].join("");
        }
    };
});