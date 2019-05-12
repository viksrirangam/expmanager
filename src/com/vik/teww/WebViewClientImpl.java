package com.vik.teww;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Map;

import android.app.Activity;
import android.content.Intent;
import android.content.res.AssetManager;
import android.net.Uri;
import android.support.v4.util.ArrayMap;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class WebViewClientImpl extends WebViewClient {

    private Activity activity = null;

    public WebViewClientImpl(Activity activity) {
        this.activity = activity;
    }

    @Override
    public boolean shouldOverrideUrlLoading(WebView webView, String url) {
        //if(url.indexOf("http://dinkov.vi") > -1 ) return false;
        
    	return true;
    }
    
    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
    	String str = "<h4>Not found!</h4>";
    	//url=url.replace("http://dinkov.vi/", "file:///android_asset/");
    	url=url.replace("http://dinkov.vi/", "");
    	
    	AssetManager am=this.activity.getApplicationContext().getAssets();
    	 
    	// convert String into InputStream
    	InputStream input = new ByteArrayInputStream(str.getBytes());
    	
    	try {
			input=am.open(url);
		} catch (IOException e) {
			// TODO Auto-generated catch block
			//e.printStackTrace();
			input = new ByteArrayInputStream(e.toString().getBytes());
		}
    	
    	/*
    	Map<String, String> headers=new ArrayMap<String, String>();
    	headers.put("", "*");
    	WebResourceResponse response =
        	new WebResourceResponse("text/html", "", 200, "", headers, input);    	
        */
  
    	String ext=url.replaceAll("^.*\\.([^.]+)$", "$1");
    	String mimeType="text/html";
    	
    	if(ext.equals("css"))
    		mimeType="text/css";
    	else
    		if(ext.equals("png"))
        		mimeType="image/png";
    		else
    			if(ext.equals("woff"))
    	    		mimeType="application/x-font-woff";
    	//mimeType="application/javascript";

    	WebResourceResponse response =
                new WebResourceResponse(mimeType, "", input);        

        return response;
    }
    
    @Override
    public void onReceivedError(WebView view, int err, String p1, String p2){
    	/*Toast toast = Toast.makeText(this.activity.getApplicationContext(),
                "error is: "+p1+" and "+p2,
                Toast.LENGTH_SHORT);

        toast.show();*/
    }
}
