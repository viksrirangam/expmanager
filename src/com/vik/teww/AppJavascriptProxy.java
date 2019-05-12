package com.vik.teww;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import android.util.Log;

import android.app.Activity;
import android.content.ContentValues;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

public class AppJavascriptProxy {

    private Activity activity = null;
    private WebView  webView  = null;

    public AppJavascriptProxy(Activity activity, WebView webview) {

        this.activity = activity;
        this.webView  = webview;
    }

    @JavascriptInterface
    public void showMessage(final String message) {

        this.activity.runOnUiThread(new Runnable() {

            @Override
            public void run() {
            	return ;
            }
        });
    }
    
    @JavascriptInterface
    public void addItem(final String _type, final String _category, final double _amount, final String _incurdate) {
    	final Activity theActivity = this.activity;
        final WebView theWebView = this.webView;        
    	
        this.activity.runOnUiThread(new Runnable() {

            @Override
            public void run() {
                if(!theWebView.getUrl().startsWith("http://dinkov.vi")){
                    return ;
                }

                // TODO Auto-generated method stub
                String message = "Adding new " + _type + ".";
            	try{
            		ExpenseDbHelper helper=new ExpenseDbHelper(theActivity);
            		        	
            		if(_type.contains("expense")){
            			helper.insertExpense(_category, _amount, _incurdate);
            		}else{
            			helper.insertIncome(_category, _amount, _incurdate);
            		}
        			message += " Succeded."; 
            	}catch(Exception e){
            		message += " Failed.";
            	}
                
                Toast toast = Toast.makeText(
                		theActivity.getApplicationContext(),
                		message,
                        Toast.LENGTH_SHORT);

                toast.show();
            }
        });
    }
    
    @JavascriptInterface
    public String getData(String month) {
    	final Activity theActivity = this.activity;
    	String res="{}";
        
    	try{
    		ExpenseDbHelper helper=new ExpenseDbHelper(theActivity);
    		        	
    		res=helper.getMonthSummary(month); 
    	}catch(Exception e){
    		res="Error.";
    	}
    
       try
	   {
		   File traceFile = new File(this.activity.getApplicationContext().getExternalFilesDir(null), "TraceFile.txt");
		   if (traceFile.exists())
			   traceFile.delete();
		   
		   traceFile.createNewFile();
           // Adds a line to the trace file
		   BufferedWriter writer = new BufferedWriter(new FileWriter(traceFile, true));
		   writer.write(res);
		   writer.close();
	   
	    }
    	catch (IOException e)
	    {
    		Log.e("com.cindypotvin.FileTest", "Unable to write to the TraceFile.txt file.");
	    }
    	
    	return res;
    }
}