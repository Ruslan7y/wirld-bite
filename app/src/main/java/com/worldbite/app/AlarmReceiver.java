package com.worldbite.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

/** Fires when a cooking timer ends while the app is in the background: an alarm-like, insistent notification. */
public class AlarmReceiver extends BroadcastReceiver {
    public static final String FIRE = "com.worldbite.app.FIRE";
    public static final String STOP = "com.worldbite.app.STOP";
    static final String CHANNEL = "wb_timer_alarm";

    @Override
    public void onReceive(Context ctx, Intent in) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        int id = in.getIntExtra("id", 1);
        if (STOP.equals(in.getAction())) { nm.cancel(id); return; }
        if (MainActivity.inForeground) { MainActivity.notifyJs("window.LAB_ALARM_FIRED&&LAB_ALARM_FIRED(" + id + ")"); return; }
        ensureChannel(ctx, nm);

        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int fl = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        PendingIntent openPi = PendingIntent.getActivity(ctx, id, open, fl);
        Intent stop = new Intent(ctx, AlarmReceiver.class).setAction(STOP).putExtra("id", id);
        PendingIntent stopPi = PendingIntent.getBroadcast(ctx, id + 7, stop, fl);

        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(ctx, CHANNEL) : new Notification.Builder(ctx);
        b.setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(in.getStringExtra("title"))
                .setContentText(in.getStringExtra("text"))
                .setCategory(Notification.CATEGORY_ALARM)
                .setPriority(Notification.PRIORITY_MAX)
                .setAutoCancel(true)
                .setContentIntent(openPi)
                .setFullScreenIntent(openPi, true)
                .addAction(android.R.drawable.ic_media_pause, "Durdur", stopPi)
                .addAction(android.R.drawable.ic_menu_view, "Uygulamayı aç", openPi);
        if (Build.VERSION.SDK_INT < 26) {
            b.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), android.media.AudioManager.STREAM_ALARM);
            b.setVibrate(new long[]{0, 700, 400, 700, 400, 700});
        }
        Notification n = b.build();
        n.flags |= Notification.FLAG_INSISTENT; // keep ringing until the user reacts
        try { nm.notify(id, n); } catch (SecurityException e) { /* notifications not allowed */ }
    }

    static void ensureChannel(Context ctx, NotificationManager nm) {
        if (Build.VERSION.SDK_INT < 26 || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Pişirme alarmı", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Tarif zamanlayıcısı dolduğunda çalar");
        Uri alarm = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        if (alarm == null) alarm = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        ch.setSound(alarm, new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[]{0, 700, 400, 700, 400, 700});
        ch.setBypassDnd(true);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }
}
