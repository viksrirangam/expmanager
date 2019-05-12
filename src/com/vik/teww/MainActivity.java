package com.vik.teww;

import java.util.Random;

import android.support.v7.app.ActionBarActivity;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.EditText;
import android.widget.Toast;

public class MainActivity extends ActionBarActivity {
	
	private WebView webView = null;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        
        //insertData();
        
        webView = (WebView)findViewById(R.id.WebView);
        
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webView.addJavascriptInterface(new AppJavascriptProxy(this, webView), "androidAppProxy");
        
        WebViewClientImpl webViewClient = new WebViewClientImpl(this);
        webView.setWebViewClient(webViewClient);
        
        //load index.html from the assets folder
        //webView.loadUrl("file:///android_asset/index.html");
        webView.loadUrl("http://dinkov.vi/index.html");    
    }
    
    public void sendMessage(View view) {
        // Do something in response to button click
    	insertData();
    	fetchData();
    }

	public String fetchData() {
		// TODO Auto-generated method stub
		String result="";
		StringBuilder sb=new StringBuilder();
    	
    	try{
    		ExpenseDbHelper helper=new ExpenseDbHelper(this);
    		
			sb.append("Fetching summary details");
			result=helper.getMonthSummary("052014");
	    	sb.append(result);
    	}catch(Exception e){
    		sb.append(e.toString());
    	}
    	
    	return result;
	}

	private void insertData() {
		StringBuilder sb=new StringBuilder();
    	
    	try{
	    	ExpenseDbHelper helper=new ExpenseDbHelper(this);
	    	
	    	sb.append("Created db helper");
	    	String[] expenseCategories=new String[]{
	    			"Commute",
	    	        "Sundry",
	    	        "Rent",
	    	        "Food",
	    	        "Entertainment",
	    	        "Asset"
	    	};
	    	
	    	for(String cat:expenseCategories){
	    		helper.insertExpense(cat, 40, "2015-01-" + GetDay());
	    	}
	    	sb.append("Inserted expenses");
	    	
	    	String[] incomeCategories=new String[]{
	    			"Salary",
	    	        "Savings Interest",
	    	        "ROI",
	    	        "Rental",
	    	        "Other"
	    	};
	    	
	    	for(String cat:incomeCategories){
	    		helper.insertIncome(cat, 105, "2015-01-" + GetDay());
	    	}
	    	
	    	sb.append("Inserted income");
	    	
	    	sb.append("Fetching summary details");
	    	sb.append(helper.getMonthSummary("052014"));
    	}catch(Exception e){
    		sb.append(e.toString());
    	}
	}
    
    public int GetDay(){
    	Random rn = new Random();
    	int n = 30 - 1 + 1;
    	int i = rn.nextInt() % n;
    	return 1 + i;
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();
        if (id == R.id.action_settings) {
            return true;
        }
        return super.onOptionsItemSelected(item);
    }
    
    @Override
    public void onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
