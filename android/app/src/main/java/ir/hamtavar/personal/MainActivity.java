package ir.hamtavar.personal;

import android.app.Activity;
import android.app.AlertDialog;
import android.os.Bundle;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.webkit.*;
import android.net.Uri;
import androidx.webkit.WebViewAssetLoader;
import java.io.*;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

public class MainActivity extends Activity {
    public static MainActivity instance;
    private WebView web;
    private String pendingBackup;
    private static final int EXPORT = 10, IMPORT = 11, MAX = 4000000;
    private static final String ASSET_HOST = "appassets.androidplatform.net";
    // The only remote origin the WebView may talk to; null when the app is built fully offline.
    private static final Uri API_ORIGIN = parseApiOrigin(BuildConfig.API_BASE);

    private static Uri parseApiOrigin(String base) {
        if (base == null || base.isEmpty()) return null;
        Uri u = Uri.parse(base);
        return "https".equals(u.getScheme()) && u.getHost() != null ? u : null;
    }

    private static boolean isApiRequest(Uri u) {
        return API_ORIGIN != null
            && "https".equals(u.getScheme())
            && API_ORIGIN.getHost().equalsIgnoreCase(u.getHost())
            && API_ORIGIN.getPort() == u.getPort();
    }

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        instance = this;
        web = new WebView(this);
        setContentView(web);

        // Request SMS permissions if on modern Android
        if (checkSelfPermission(android.Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{ android.Manifest.permission.RECEIVE_SMS }, 101);
        }

        web.getSettings().setJavaScriptEnabled(true);
        web.getSettings().setDomStorageEnabled(true);
        web.getSettings().setAllowFileAccess(false);
        web.getSettings().setAllowContentAccess(false);
        web.getSettings().setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        web.getSettings().setSupportMultipleWindows(false);
        WebView.setWebContentsDebuggingEnabled(false);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
            .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (ASSET_HOST.equals(u.getHost())) {
                    WebResourceResponse r = loader.shouldInterceptRequest(u);
                    if (r != null) return r;
                } else if (isApiRequest(u)) {
                    return null; // let the WebView reach the configured server
                }
                // Everything else stays blocked.
                return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !request.getUrl().toString().startsWith("https://appassets.androidplatform.net/assets/");
            }
        });

        web.addJavascriptInterface(new Bridge(), "PersonalNative");

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsConfirm(WebView v, String url, String message, JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                    .setMessage(message)
                    .setPositiveButton("تأیید", (d, w) -> result.confirm())
                    .setNegativeButton("لغو", (d, w) -> result.cancel())
                    .setOnCancelListener(d -> result.cancel())
                    .show();
                return true;
            }
        });

        web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");
    }

    @Override
    protected void onDestroy() {
        if (instance == this) instance = null;
        super.onDestroy();
    }

    public void dispatchIncomingSms(final String body) {
        runOnUiThread(() -> {
            if (web != null) {
                web.evaluateJavascript("window.handleIncomingBankSms && window.handleIncomingBankSms(" + JSONObject.quote(body) + ")", null);
            }
        });
    }

    private void result(String text) {
        runOnUiThread(() -> web.evaluateJavascript("window.backupResult(" + JSONObject.quote(text) + ")", null));
    }

    public class Bridge {
        @JavascriptInterface
        public String apiBase() {
            return API_ORIGIN == null ? "" : BuildConfig.API_BASE;
        }

        // Hands an https link (APK download, banner link) to the system browser.
        @JavascriptInterface
        public void openExternal(String url) {
            if (url == null || !url.startsWith("https://")) return;
            runOnUiThread(() -> {
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse(url)));
                } catch (Exception e) {
                    result("برنامه‌ای برای باز کردن این پیوند پیدا نشد.");
                }
            });
        }

        @JavascriptInterface
        public String readState() {
            return getSharedPreferences("personal", MODE_PRIVATE).getString("state", "");
        }

        @JavascriptInterface
        public boolean writeState(String json) {
            if (json == null || json.length() > MAX) return false;
            return getSharedPreferences("personal", MODE_PRIVATE).edit().putString("state", json).commit();
        }

        @JavascriptInterface
        public void exportBackup(String json) {
            if (json == null || json.length() > MAX) {
                result("حجم پشتیبان بیش از حد است.");
                return;
            }
            runOnUiThread(() -> {
                if (pendingBackup != null) {
                    result("انتخاب فایل قبلی هنوز تمام نشده است.");
                    return;
                }
                pendingBackup = json;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("application/json");
                i.putExtra(Intent.EXTRA_TITLE, "hamtavar-personal-backup.json");
                try {
                    startActivityForResult(i, EXPORT);
                } catch (Exception e) {
                    pendingBackup = null;
                    result("انتخابگر فایل در دسترس نیست.");
                }
            });
        }

        @JavascriptInterface
        public void importBackup() {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT);
                i.addCategory(Intent.CATEGORY_OPENABLE);
                i.setType("*/*");
                try {
                    startActivityForResult(i, IMPORT);
                } catch (Exception e) {
                    result("انتخابگر فایل در دسترس نیست.");
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int request, int code, Intent data) {
        super.onActivityResult(request, code, data);
        if (code != RESULT_OK || data == null || data.getData() == null) {
            if (request == EXPORT) pendingBackup = null;
            result("انتخاب فایل لغو شد.");
            return;
        }
        final Uri uri = data.getData();
        final String backup = pendingBackup;
        if (request == EXPORT) pendingBackup = null;

        new Thread(() -> {
            try {
                if (request == EXPORT && backup != null) {
                    try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                        if (out == null) throw new IOException();
                        out.write(backup.getBytes(StandardCharsets.UTF_8));
                    }
                    result("پشتیبان ذخیره شد.");
                } else if (request == IMPORT) {
                    ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                    try (InputStream in = getContentResolver().openInputStream(uri)) {
                        if (in == null) throw new IOException();
                        byte[] b = new byte[8192];
                        int n;
                        while ((n = in.read(b)) != -1) {
                            if (buffer.size() + n > MAX) throw new IOException();
                            buffer.write(b, 0, n);
                        }
                    }
                    String json = buffer.toString("UTF-8");
                    runOnUiThread(() -> web.evaluateJavascript("window.receiveBackup(" + JSONObject.quote(json) + ")", null));
                }
            } catch (Exception e) {
                result("خواندن یا نوشتن فایل انجام نشد.");
            }
        }).start();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.handleBack && window.handleBack()", value -> {
            if (!"true".equals(value)) finish();
        });
    }
}
