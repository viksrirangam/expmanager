package com.vik.teww;

import android.content.Context;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.SQLException;
import android.database.sqlite.SQLiteOpenHelper;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteQueryBuilder;

public class ExpenseDbHelper extends SQLiteOpenHelper {
  private static final String DATABASE_NAME="expense.db";
  private static final int SCHEMA_VERSION=3;
  
  public ExpenseDbHelper(Context context) {
    super(context, DATABASE_NAME, null, SCHEMA_VERSION);
  }
  
  @Override
  public void onCreate(SQLiteDatabase db) {
    db.execSQL("CREATE TABLE expenses (category TEXT, amount REAL, date TEXT, month TEXT);");    
    db.execSQL("CREATE TABLE income (category TEXT, amount REAL, date TEXT, month TEXT);");
  }

  @Override
  public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
    // no-op, since will not be called until 2nd schema
    // version exists
  }

  public String getMonthSummary(String month) throws Exception {
	  StringBuilder sb=new StringBuilder("{ \"month\": \"" + month + "\",");
	  
	  Cursor c = (getReadableDatabase()
            .rawQuery("SELECT sum(amount) FROM expenses WHERE month = ?",
                      new String[]{month}));
	  String expenseTotal=getScalar(c);
  
	  sb.append("\"totalexpenses\":"+expenseTotal+",");
	  
	  sb.append("\"categoryExpenses\":[");
	  
	  c = (getReadableDatabase()
	            .rawQuery("SELECT category, sum(amount) FROM expenses WHERE month = ? GROUP BY category ORDER BY category ASC",
	                      new String[]{month}));
	  
	  if (c.moveToFirst()) {
	      do {
	          sb.append("{\"category\":\""+c.getString(0)+"\", \"amount\":"+c.getString(1)+"},");
	      } while (c.moveToNext());
	  }	  
	  //remove comma
	  if(sb.charAt(sb.length()-1)==',')
		  sb.deleteCharAt(sb.length()-1);
	  sb.append("],");	  
	  
	  c = (getReadableDatabase()
	            .rawQuery("SELECT sum(amount) FROM income WHERE month = ?",
	                      new String[]{month}));
	  String incomeTotal=getScalar(c);
	  sb.append("\"totalincome\":"+incomeTotal+",");
	  
	  sb.append("\"categoryIncome\":[");
	  c = (getReadableDatabase()
	            .rawQuery("SELECT category, sum(amount) FROM income WHERE month = ? GROUP BY category ORDER BY category ASC",
	                      new String[]{month}));
	  
	  if (c.moveToFirst()) {
        do {
        	sb.append("{\"category\":\""+c.getString(0)+"\", \"amount\":"+c.getString(1)+"},");
        } while (c.moveToNext());
	  }
	  //remove comma
	  if(sb.charAt(sb.length()-1)==',')
		  sb.deleteCharAt(sb.length()-1);
	  sb.append("]");	
	  sb.append("}");
	  
	  
	  return sb.toString();
  }
  
  private String getScalar(Cursor c) {
	  if (c != null)
	        c.moveToFirst();
	  
	return c.getString(0);
}

public void insertExpense(String category, double amount,
                     String date) {
    ContentValues cv=new ContentValues();
          
    cv.put("category", category);
    cv.put("amount", amount);
    cv.put("date", date);
    cv.put("month", getMonth(date));
    
    getWritableDatabase().insert("expenses", "category", cv);
  }
  
  public void insertIncome(String category, double amount,
          String date) {
	ContentValues cv=new ContentValues();
	
	cv.put("category", category);
	cv.put("amount", amount);
	cv.put("date", date);
	cv.put("month", getMonth(date));
	
	getWritableDatabase().insert("income", "category", cv);
  }
  
  private String getMonth(String date) {
	String[] parts=date.split("-");
	// TODO Auto-generated method stub
	return parts[1]+parts[0];//"052014";
  }
}
