package com.worldbite.app;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/assets/www/index.html";
    private static final int REQ_LOCATION = 42;
    private static final int REQ_CAMERA = 43;
    private PermissionRequest pendingCamera;
    private static final int REQ_MIC = 44;
    private static final int REQ_FILE = 45;
    private ValueCallback<Uri[]> fileCallback;
    private TextToSpeech tts;
    static volatile boolean inForeground = false;
    static MainActivity self;
    static void notifyJs(String code) { MainActivity a = self; if (a != null) a.js(code); }
    private boolean ttsReady = false;
    private SpeechRecognizer recognizer;
    private String pendingListenLang;

    private WebView web;
    private GeolocationPermissions.Callback geoCallback;
    private String geoOrigin;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(Color.WHITE);
        setContentView(web);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setGeolocationEnabled(true);
        s.setAllowFileAccess(false);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setTextZoom(100);

        web.addJavascriptInterface(new Bridge(), "Android");
        web.addJavascriptInterface(new LabBridge(), "LabAndroid");
        self = this;
        tts = new TextToSpeech(this, status -> {
            ttsReady = status == TextToSpeech.SUCCESS;
            if (ttsReady) tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { }
                @Override public void onDone(String id) { speakDone(id); }
                @Override public void onError(String id) { speakDone(id); }
            });
        });

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (HOST.equals(uri.getHost())) return false;
                openExternal(uri); // restaurant websites, directions, phone numbers
                return true;
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (hasLocation()) { callback.invoke(origin, true, false); return; }
                geoOrigin = origin;
                geoCallback = callback;
                requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, REQ_LOCATION);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try { startActivityForResult(params.createIntent(), REQ_FILE); }
                catch (Exception e) { fileCallback = null; return false; }
                return true;
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(() -> {
                    boolean wantsCamera = false;
                    for (String r : request.getResources()) if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(r)) wantsCamera = true;
                    if (!wantsCamera) { request.deny(); return; }
                    if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                        request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                    } else {
                        pendingCamera = request;
                        requestPermissions(new String[]{Manifest.permission.CAMERA}, REQ_CAMERA);
                    }
                });
            }
        });

        if (savedInstanceState != null) web.restoreState(savedInstanceState);
        else web.loadUrl(START);
    }

    private boolean hasLocation() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_MIC) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED && pendingListenLang != null) startListening(pendingListenLang);
            else js("WB.onVoiceEnd && WB.onVoiceEnd('denied')");
            pendingListenLang = null;
        }
        if (requestCode == REQ_CAMERA && pendingCamera != null) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED)
                pendingCamera.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
            else pendingCamera.deny();
            pendingCamera = null;
        }
        if (requestCode == REQ_LOCATION && geoCallback != null) {
            geoCallback.invoke(geoOrigin, hasLocation(), false);
            geoCallback = null;
        }
    }

    private void openExternal(Uri uri) {
        try {
            String scheme = uri.getScheme() == null ? "" : uri.getScheme();
            Intent i = scheme.equals("tel") ? new Intent(Intent.ACTION_DIAL, uri) : new Intent(Intent.ACTION_VIEW, uri);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (ActivityNotFoundException ignored) { }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == REQ_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(resultCode, data));
            fileCallback = null;
        }
    }

    private void speakDone(String id) {
        if (id != null && id.startsWith("lab:")) js("window.LAB_TTS_DONE && LAB_TTS_DONE(" + JSONObject.quote(id.substring(4)) + ")");
        else js("WB.onSpeakDone && WB.onSpeakDone()");
    }

    @Override
    protected void onResume() { super.onResume(); inForeground = true; ((android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE)).cancelAll(); }

    @Override
    protected void onPause() { super.onPause(); inForeground = false; js("window.LAB_PAUSE && LAB_PAUSE()"); }

    private android.app.PendingIntent alarmPi(int id, String title, String text) {
        Intent i = new Intent(this, AlarmReceiver.class).setAction(AlarmReceiver.FIRE).putExtra("id", id).putExtra("title", title).putExtra("text", text);
        return android.app.PendingIntent.getBroadcast(this, id, i, android.app.PendingIntent.FLAG_UPDATE_CURRENT | android.app.PendingIntent.FLAG_IMMUTABLE);
    }

    /** Bridge used by the cooking scene (lab/chef.html) inside World Bite. */
    private class LabBridge {
        @JavascriptInterface
        public void vibrate(int ms) {
            android.os.Vibrator v = (android.os.Vibrator) getSystemService(VIBRATOR_SERVICE);
            if (v == null) return;
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(android.os.VibrationEffect.createOneShot(Math.max(5, ms), android.os.VibrationEffect.DEFAULT_AMPLITUDE)); else v.vibrate(ms);
        }
        @JavascriptInterface
        public void speak(final String text, final float pitch, final float rate, final String id) {
            runOnUiThread(() -> {
                if (!ttsReady) { speakDone("lab:" + id); return; }
                if (tts.setLanguage(new Locale("tr", "TR")) < 0) tts.setLanguage(Locale.getDefault());
                tts.setPitch(pitch); tts.setSpeechRate(rate);
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "lab:" + id);
            });
        }
        @JavascriptInterface public void stopSpeak() { runOnUiThread(() -> { if (tts != null) tts.stop(); }); }
        @JavascriptInterface
        public void listen(final String lang) {
            runOnUiThread(() -> {
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    pendingListenLang = lang; requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC); return;
                }
                startListening(lang);
            });
        }
        @JavascriptInterface public void stopListen() { runOnUiThread(() -> { if (recognizer != null) { try { recognizer.cancel(); } catch (Exception ignored) { } } }); }
        @JavascriptInterface
        public void scheduleAlarm(int id, double whenMs, String title, String text) {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED)
                runOnUiThread(() -> requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 52));
            android.app.AlarmManager am = (android.app.AlarmManager) getSystemService(ALARM_SERVICE);
            if (am == null) return;
            android.app.PendingIntent pi = alarmPi(id, title, text);
            long when = (long) whenMs;
            try {
                if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, when, pi);
                else am.setExactAndAllowWhileIdle(android.app.AlarmManager.RTC_WAKEUP, when, pi);
            } catch (SecurityException e) { am.set(android.app.AlarmManager.RTC_WAKEUP, when, pi); }
        }
        @JavascriptInterface
        public void cancelAlarm(int id) {
            android.app.AlarmManager am = (android.app.AlarmManager) getSystemService(ALARM_SERVICE);
            if (am != null) am.cancel(alarmPi(id, "", ""));
            ((android.app.NotificationManager) getSystemService(NOTIFICATION_SERVICE)).cancel(id);
        }
    }

    private void js(final String code) { runOnUiThread(() -> { if (web != null) web.evaluateJavascript(code, null); }); }

    private void startListening(String lang) {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) { js("WB.onVoiceEnd && WB.onVoiceEnd('unavailable')"); return; }
        if (recognizer == null) {
            recognizer = SpeechRecognizer.createSpeechRecognizer(this);
            recognizer.setRecognitionListener(new RecognitionListener() {
                @Override public void onResults(Bundle b) {
                    ArrayList<String> r = b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                    js("WB.onVoice && WB.onVoice(" + new JSONArray(r == null ? new ArrayList<String>() : r).toString() + ")");
                }
                @Override public void onError(int error) { js("WB.onVoiceEnd && WB.onVoiceEnd(" + error + ")"); }
                @Override public void onReadyForSpeech(Bundle p) { }
                @Override public void onBeginningOfSpeech() { }
                @Override public void onRmsChanged(float v) { }
                @Override public void onBufferReceived(byte[] b) { }
                @Override public void onEndOfSpeech() { }
                @Override public void onPartialResults(Bundle b) { }
                @Override public void onEvent(int t, Bundle b) { }
            });
        }
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        try { recognizer.startListening(i); } catch (Exception e) { js("WB.onVoiceEnd && WB.onVoiceEnd('err')"); }
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        if (recognizer != null) recognizer.destroy();
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.WB && window.WB.back()) ? 1 : 0", value -> {
            if (!"1".equals(value)) MainActivity.super.onBackPressed();
        });
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    private Uri writeImage(String dataUrl) {
        try {
            String b64 = dataUrl.substring(dataUrl.indexOf(',') + 1);
            byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
            ContentValues v = new ContentValues();
            v.put(MediaStore.Images.Media.DISPLAY_NAME, "WorldBite_" + System.currentTimeMillis() + ".jpg");
            v.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            if (Build.VERSION.SDK_INT >= 29) v.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/WorldBite");
            Uri uri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
            if (uri == null) return null;
            try (OutputStream os = getContentResolver().openOutputStream(uri)) { if (os != null) os.write(bytes); }
            return uri;
        } catch (Exception e) {
            return null;
        }
    }

    /** Bridge used by the web UI: system bar colours, sharing, keep-screen-on while cooking. */
    private class Bridge {
        @JavascriptInterface
        public void share(final String text) {
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_TEXT, text);
                try { startActivity(Intent.createChooser(send, "World Bite")); } catch (Exception ignored) { }
            });
        }

        /** Saves a data:image/jpeg;base64 URL into Pictures/WorldBite. Returns the content URI or "". */
        @JavascriptInterface
        public String saveImage(String dataUrl) {
            Uri u = writeImage(dataUrl);
            return u == null ? "" : u.toString();
        }

        @JavascriptInterface
        public void shareImage(String dataUrl, final String title) {
            final Uri u = writeImage(dataUrl);
            if (u == null) return;
            runOnUiThread(() -> {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("image/jpeg");
                send.putExtra(Intent.EXTRA_STREAM, u);
                send.putExtra(Intent.EXTRA_TEXT, title + " — World Bite");
                send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                try { startActivity(Intent.createChooser(send, "World Bite")); } catch (Exception ignored) { }
            });
        }

        @JavascriptInterface
        public void speak(final String text, final String lang) {
            runOnUiThread(() -> {
                if (!ttsReady) { js("WB.onSpeakDone && WB.onSpeakDone()"); return; }
                Locale loc = Locale.forLanguageTag(lang);
                int r = tts.setLanguage(loc);
                if (r == TextToSpeech.LANG_MISSING_DATA || r == TextToSpeech.LANG_NOT_SUPPORTED) {
                    // Azerbaijani voices are rare: fall back to Turkish, then English
                    if (tts.setLanguage(new Locale("tr", "TR")) < 0) tts.setLanguage(Locale.ENGLISH);
                }
                tts.setPitch(1f); tts.setSpeechRate(1f);
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "wb" + System.currentTimeMillis());
            });
        }

        @JavascriptInterface
        public void stopSpeak() { runOnUiThread(() -> { if (tts != null) tts.stop(); }); }

        @JavascriptInterface
        public boolean hasRecognizer() { return SpeechRecognizer.isRecognitionAvailable(MainActivity.this); }

        @JavascriptInterface
        public void listen(final String lang) {
            runOnUiThread(() -> {
                if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                    pendingListenLang = lang;
                    requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
                    return;
                }
                startListening(lang);
            });
        }

        @JavascriptInterface
        public void stopListen() { runOnUiThread(() -> { if (recognizer != null) { try { recognizer.cancel(); } catch (Exception ignored) { } } }); }

        @JavascriptInterface
        public void keepAwake(final boolean on) {
            runOnUiThread(() -> {
                if (on) getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
                else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
            });
        }

        @JavascriptInterface
        public void setBars(final String color, final boolean dark) {
            runOnUiThread(() -> {
                try {
                    Window w = getWindow();
                    int c = Color.parseColor(color);
                    w.setStatusBarColor(c);
                    w.setNavigationBarColor(c);
                    web.setBackgroundColor(c);
                    View d = w.getDecorView();
                    int flags = d.getSystemUiVisibility();
                    if (dark) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    else flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
                    if (Build.VERSION.SDK_INT >= 26) {
                        if (dark) flags &= ~View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                        else flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
                    }
                    d.setSystemUiVisibility(flags);
                } catch (Exception ignored) { }
            });
        }
    }
}
