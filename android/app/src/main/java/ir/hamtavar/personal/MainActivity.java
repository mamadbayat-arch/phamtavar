package ir.hamtavar.personal;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.content.Intent;
import android.webkit.*;
import android.net.Uri;
import androidx.webkit.WebViewAssetLoader;
import java.io.*;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

public class MainActivity extends Activity {
 private WebView web;
 private String pendingBackup;
 private static final int EXPORT=10, IMPORT=11, MAX=4000000;
 @Override public void onCreate(Bundle state) {
  super.onCreate(state);
  web=new WebView(this);setContentView(web);
  web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);
  web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);
  web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  web.getSettings().setSupportMultipleWindows(false);WebView.setWebContentsDebuggingEnabled(false);
  final WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
    WebResourceResponse r=loader.shouldInterceptRequest(request.getUrl());
    return r!=null?r:new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));
   }
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return !request.getUrl().toString().startsWith("https://appassets.androidplatform.net/assets/");}
  });
  web.addJavascriptInterface(new Bridge(),"PersonalNative");
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onJsConfirm(WebView v,String url,String message,JsResult result){
    new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("تأیید",(d,w)->result.confirm()).setNegativeButton("لغو",(d,w)->result.cancel()).setOnCancelListener(d->result.cancel()).show();return true;
   }
  });
  web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");
 }
 private void result(String text){runOnUiThread(()->web.evaluateJavascript("window.backupResult("+JSONObject.quote(text)+")",null));}
 public class Bridge {
  @JavascriptInterface public String readState(){return getSharedPreferences("personal",MODE_PRIVATE).getString("state","");}
  @JavascriptInterface public boolean writeState(String json){if(json==null||json.length()>MAX)return false;return getSharedPreferences("personal",MODE_PRIVATE).edit().putString("state",json).commit();}
  @JavascriptInterface public void exportBackup(String json){
   if(json==null||json.length()>MAX){result("حجم پشتیبان بیش از حد است.");return;}
   runOnUiThread(()->{if(pendingBackup!=null){result("انتخاب فایل قبلی هنوز تمام نشده است.");return;}pendingBackup=json;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/json");i.putExtra(Intent.EXTRA_TITLE,"hamtavar-personal-backup.json");try{startActivityForResult(i,EXPORT);}catch(Exception e){pendingBackup=null;result("انتخابگر فایل در دسترس نیست.");}});
  }
  @JavascriptInterface public void importBackup(){runOnUiThread(()->{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("*/*");try{startActivityForResult(i,IMPORT);}catch(Exception e){result("انتخابگر فایل در دسترس نیست.");}});}
 }
 @Override protected void onActivityResult(int request,int code,Intent data){super.onActivityResult(request,code,data);
  if(code!=RESULT_OK||data==null||data.getData()==null){if(request==EXPORT)pendingBackup=null;result("انتخاب فایل لغو شد.");return;}
  final Uri uri=data.getData();final String backup=pendingBackup;if(request==EXPORT)pendingBackup=null;
  new Thread(()->{try{
   if(request==EXPORT&&backup!=null){try(OutputStream out=getContentResolver().openOutputStream(uri,"wt")){if(out==null)throw new IOException();out.write(backup.getBytes(StandardCharsets.UTF_8));}result("پشتیبان ذخیره شد.");}
   else if(request==IMPORT){ByteArrayOutputStream buffer=new ByteArrayOutputStream();try(InputStream in=getContentResolver().openInputStream(uri)){if(in==null)throw new IOException();byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){if(buffer.size()+n>MAX)throw new IOException();buffer.write(b,0,n);}}String json=buffer.toString("UTF-8");runOnUiThread(()->web.evaluateJavascript("window.receiveBackup("+JSONObject.quote(json)+")",null));}
  }catch(Exception e){result("خواندن یا نوشتن فایل انجام نشد.");}}).start();
 }
 @Override public void onBackPressed(){web.evaluateJavascript("window.handleBack && window.handleBack()",value->{if(!"true".equals(value))finish();});}
}
