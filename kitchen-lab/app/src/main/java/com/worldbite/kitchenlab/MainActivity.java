package com.worldbite.kitchenlab;

import android.Manifest;
import android.app.Activity;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.view.View;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Locale;

public class MainActivity extends Activity {
    static volatile boolean inForeground = false;
    static MainActivity self;
    private WebView web;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private SpeechRecognizer rec;
    private String pendingLang = null;
    private static final int REQ_MIC = 51, REQ_NOTIF = 52;

    static void notifyJs(String js) {
        MainActivity a = self;
        if (a != null && a.web != null) a.runOnUiThread(() -> a.web.evaluateJavascript(js, null));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        self = this;
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        web = new WebView(this);
        web.setBackgroundColor(0xFF140F0C);
        setContentView(web);
        hideBars();

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }
        });
        web.addJavascriptInterface(new Bridge(), "Android");
        web.loadUrl("https://appassets.androidplatform.net/assets/www/index.html");

        tts = new TextToSpeech(this, status -> {
            if (status != TextToSpeech.SUCCESS) return;
            int r = tts.setLanguage(new Locale("tr", "TR"));
            ttsReady = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED;
            if (!ttsReady) { tts.setLanguage(Locale.getDefault()); ttsReady = true; }
            tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
                @Override public void onStart(String id) { }
                @Override public void onDone(String id) { notifyJs("window.LAB_TTS_DONE&&LAB_TTS_DONE(" + JSONObject.quote(id) + ")"); }
                @Override public void onError(String id) { notifyJs("window.LAB_TTS_DONE&&LAB_TTS_DONE(" + JSONObject.quote(id) + ")"); }
            });
        });
    }

    private void hideBars() {
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                        | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                        | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
    }

    @Override public void onWindowFocusChanged(boolean hasFocus) { super.onWindowFocusChanged(hasFocus); if (hasFocus) hideBars(); }

    @Override
    protected void onPause() {
        super.onPause(); inForeground = false;
        if (web != null) web.evaluateJavascript("window.LAB&&LAB.pause&&LAB.pause()", null);
        if (tts != null) tts.stop();
        stopRec();
    }

    @Override
    protected void onResume() {
        super.onResume(); inForeground = true;
        if (web != null) web.onResume();
        // a ringing timer notification is no longer needed once the app is open
        ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).cancelAll();
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        stopRec();
        if (self == this) self = null;
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("(window.LAB && LAB.back && LAB.back()) ? 1 : 0", v -> {
            if (!"1".equals(v)) MainActivity.super.onBackPressed();
        });
    }

    // ---------- speech recognition ----------
    private void startRec(String lang) {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) { notifyJs("window.LAB_VOICE_END&&LAB_VOICE_END('none')"); return; }
        if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingLang = lang; requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC); return;
        }
        stopRec();
        rec = SpeechRecognizer.createSpeechRecognizer(this);
        rec.setRecognitionListener(new RecognitionListener() {
            @Override public void onReadyForSpeech(Bundle b) { }
            @Override public void onBeginningOfSpeech() { }
            @Override public void onRmsChanged(float v) { }
            @Override public void onBufferReceived(byte[] b) { }
            @Override public void onEndOfSpeech() { }
            @Override public void onError(int e) { notifyJs("window.LAB_VOICE_END&&LAB_VOICE_END(" + e + ")"); }
            @Override public void onResults(Bundle r) {
                ArrayList<String> m = r.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                if (m != null && !m.isEmpty()) notifyJs("window.LAB_VOICE&&LAB_VOICE(" + JSONObject.quote(m.get(0)) + ")");
                notifyJs("window.LAB_VOICE_END&&LAB_VOICE_END(0)");
            }
            @Override public void onPartialResults(Bundle r) { }
            @Override public void onEvent(int t, Bundle b) { }
        });
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
        rec.startListening(i);
    }
    private void stopRec() { if (rec != null) { try { rec.destroy(); } catch (Exception e) { } rec = null; } }

    @Override
    public void onRequestPermissionsResult(int req, String[] p, int[] res) {
        super.onRequestPermissionsResult(req, p, res);
        if (req == REQ_MIC && res.length > 0 && res[0] == PackageManager.PERMISSION_GRANTED && pendingLang != null) startRec(pendingLang);
        else if (req == REQ_MIC) notifyJs("window.LAB_VOICE_END&&LAB_VOICE_END('denied')");
    }

    // ---------- alarms ----------
    private PendingIntent alarmPi(int id, String title, String text) {
        Intent i = new Intent(this, AlarmReceiver.class).setAction(AlarmReceiver.FIRE)
                .putExtra("id", id).putExtra("title", title).putExtra("text", text);
        return PendingIntent.getBroadcast(this, id, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    class Bridge {
        @JavascriptInterface
        public void vibrate(int ms) {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null) return;
            if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(Math.max(5, ms), VibrationEffect.DEFAULT_AMPLITUDE));
            else v.vibrate(ms);
        }
        @JavascriptInterface
        public void speak(String text, float pitch, float rate, String id) {
            if (tts == null || !ttsReady) { notifyJs("window.LAB_TTS_DONE&&LAB_TTS_DONE(" + JSONObject.quote(id) + ")"); return; }
            tts.setPitch(pitch); tts.setSpeechRate(rate);
            Bundle b = new Bundle();
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, b, id);
        }
        @JavascriptInterface public void stopSpeak() { if (tts != null) tts.stop(); }
        @JavascriptInterface public void listen(String lang) { runOnUiThread(() -> startRec(lang)); }
        @JavascriptInterface public void stopListen() { runOnUiThread(MainActivity.this::stopRec); }
        @JavascriptInterface
        public void scheduleAlarm(int id, double whenMs, String title, String text) {
            if (Build.VERSION.SDK_INT >= 33 && checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED)
                runOnUiThread(() -> requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS}, REQ_NOTIF));
            AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
            if (am == null) return;
            PendingIntent pi = alarmPi(id, title, text);
            long when = (long) whenMs;
            try {
                if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
                else if (Build.VERSION.SDK_INT >= 23) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, when, pi);
                else am.setExact(AlarmManager.RTC_WAKEUP, when, pi);
            } catch (SecurityException e) {
                am.set(AlarmManager.RTC_WAKEUP, when, pi);
            }
        }
        @JavascriptInterface
        public void cancelAlarm(int id) {
            AlarmManager am = (AlarmManager) getSystemService(ALARM_SERVICE);
            if (am != null) am.cancel(alarmPi(id, "", ""));
            ((NotificationManager) getSystemService(NOTIFICATION_SERVICE)).cancel(id);
        }
    }
}
