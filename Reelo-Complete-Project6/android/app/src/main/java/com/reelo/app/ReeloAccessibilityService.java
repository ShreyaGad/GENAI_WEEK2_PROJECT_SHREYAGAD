package com.reelo.app;

import android.accessibilityservice.AccessibilityService;
import android.view.accessibility.AccessibilityEvent;
import android.content.*;
import android.os.*;

public class ReeloAccessibilityService extends AccessibilityService {
    private long lastScroll=0, lastTick=0;
    private String activePackage="";
    private Handler handler;
    private Runnable ticker;
    @Override public void onServiceConnected() {
        handler=new Handler(Looper.getMainLooper());
        ticker=new Runnable(){ public void run(){
            long now=System.currentTimeMillis();
            if(isTarget(activePackage) && lastTick>0) Stats.addSeconds(ReeloAccessibilityService.this, Math.max(0,(now-lastTick)/1000));
            lastTick=now; handler.postDelayed(this,1000);
        }};
        lastTick=System.currentTimeMillis(); handler.post(ticker);
    }
    private boolean isTarget(String p){return "com.instagram.android".equals(p)||"com.google.android.youtube".equals(p);}
    @Override public void onAccessibilityEvent(AccessibilityEvent e) {
        if(e==null || e.getPackageName()==null) return;
        activePackage=e.getPackageName().toString();
        if(!isTarget(activePackage)) return;
        if(Stats.level(this).equals("auto") && e.getEventType()==AccessibilityEvent.TYPE_VIEW_SCROLLED) {
            long now=System.currentTimeMillis();
            if(now-lastScroll>1200) {
                lastScroll=now; Stats.addReel(this);
                sendBroadcast(new Intent(OverlayService.ACTION_REFRESH).setPackage(getPackageName()));
            }
        }
    }
    @Override public void onInterrupt() {}
    @Override public void onDestroy(){if(handler!=null&&ticker!=null)handler.removeCallbacks(ticker);super.onDestroy();}
}
