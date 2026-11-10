package com.reelo.app;

import android.app.*;
import android.content.*;
import android.graphics.PixelFormat;
import android.os.*;
import android.view.*;
import android.widget.*;
import android.graphics.Color;
import android.provider.Settings;

public class OverlayService extends Service {
    private static final String CHANNEL_ID = "reelo_overlay";
    private static final int NOTIFICATION_ID = 6006;
    public static final String ACTION_REFRESH = "com.reelo.app.REFRESH_OVERLAY";
    private WindowManager wm;
    private View bubble;
    private WindowManager.LayoutParams params;
    private final BroadcastReceiver refreshReceiver = new BroadcastReceiver() {
        @Override public void onReceive(Context context, Intent intent) { updateCount(); }
    };
    @Override public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        startForeground(NOTIFICATION_ID, buildNotification());
        if (Build.VERSION.SDK_INT >= 33) registerReceiver(refreshReceiver, new IntentFilter(ACTION_REFRESH), Context.RECEIVER_NOT_EXPORTED);
        else registerReceiver(refreshReceiver, new IntentFilter(ACTION_REFRESH));
        wm=(WindowManager)getSystemService(WINDOW_SERVICE);
        bubble=new MonsterView(this);
        int type=Build.VERSION.SDK_INT>=26?WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY:WindowManager.LayoutParams.TYPE_PHONE;
        params=new WindowManager.LayoutParams(dp(76),dp(76),type,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE|WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
        params.gravity=Gravity.TOP|Gravity.END; params.x=18; params.y=220;
        bubble.setOnTouchListener(new View.OnTouchListener(){
            float sx,sy; int ox,oy; long down;
            public boolean onTouch(View v, android.view.MotionEvent e) {
                if(e.getAction()==MotionEvent.ACTION_DOWN){sx=e.getRawX();sy=e.getRawY();ox=params.x;oy=params.y;down=System.currentTimeMillis();return true;}
                if(e.getAction()==MotionEvent.ACTION_MOVE){params.x=ox+(int)(sx-e.getRawX());params.y=oy+(int)(e.getRawY()-sy);wm.updateViewLayout(bubble,params);return true;}
                if(e.getAction()==MotionEvent.ACTION_UP){
                    if(System.currentTimeMillis()-down<250 && Math.abs(e.getRawX()-sx)<12 && Math.abs(e.getRawY()-sy)<12){
                        if (Stats.level(OverlayService.this).equals("manual")) {
                            Stats.addReel(OverlayService.this); updateCount();
                            Toast.makeText(OverlayService.this, "Yum! Reelo ate one reel 💜", Toast.LENGTH_SHORT).show();
                        } else {
                            Toast.makeText(OverlayService.this, "Reelo is counting scrolls automatically ✨", Toast.LENGTH_SHORT).show();
                        }
                    } return true;
                } return true;
            }
        });
        try { wm.addView(bubble,params); } catch(Exception ignored) {}
        updateCount();
    }
    public void updateCount() { if(bubble instanceof MonsterView) ((MonsterView)bubble).setCount(Stats.count(this)); }
    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(new NotificationChannel(CHANNEL_ID, "Reelo floating bubble", NotificationManager.IMPORTANCE_MIN));
        }
    }
    private Notification buildNotification() {
        Notification.Builder builder = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(this, CHANNEL_ID) : new Notification.Builder(this);
        return builder.setSmallIcon(android.R.drawable.ic_media_play)
                .setContentTitle("Reelo is floating")
                .setContentText("Tap Reelo to count a reel in Manual mode.")
                .setOngoing(true).build();
    }
    private int dp(int n){return (int)(n*getResources().getDisplayMetrics().density);}
    @Override public int onStartCommand(Intent i,int f,int id){updateCount();return START_STICKY;}
    @Override public void onDestroy(){try{unregisterReceiver(refreshReceiver);}catch(Exception ignored){}if(bubble!=null)try{wm.removeView(bubble);}catch(Exception ignored){}super.onDestroy();}
    @Override public android.os.IBinder onBind(Intent i){return null;}
}
