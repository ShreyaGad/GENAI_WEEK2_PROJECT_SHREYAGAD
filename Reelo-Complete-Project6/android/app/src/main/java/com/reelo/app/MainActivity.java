package com.reelo.app;

import android.app.*;
import android.os.*;
import android.content.*;
import android.net.Uri;
import android.provider.Settings;
import android.Manifest;
import android.graphics.Color;
import android.graphics.Typeface;
import android.view.*;
import android.widget.*;

public class MainActivity extends Activity {
    LinearLayout root;
    TextView countText, timeText, historyText, mood;
    int purple=Color.rgb(91,35,145);
    @Override public void onCreate(Bundle b){super.onCreate(b); if(Build.VERSION.SDK_INT>=33)requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},7); build(); refresh();}
    int dp(int x){return (int)(x*getResources().getDisplayMetrics().density);}
    TextView text(String s,int size,int color){TextView t=new TextView(this);t.setText(s);t.setTextSize(size);t.setTextColor(color);return t;}
    Button button(String s,Runnable r){Button b=new Button(this);b.setText(s);b.setOnClickListener(v->r.run());return b;}
    void build(){
        ScrollView sc=new ScrollView(this); root=new LinearLayout(this);root.setOrientation(1);root.setPadding(dp(20),dp(24),dp(20),dp(24));root.setBackgroundColor(Color.rgb(249,243,255));sc.addView(root);setContentView(sc);
        TextView title=text("💜 Reelo",30,purple);title.setTypeface(null,Typeface.BOLD);root.addView(title);
        root.addView(text("Your tiny scroll buddy 👾",16,Color.DKGRAY));
        MonsterView monster=new MonsterView(this);root.addView(monster,new LinearLayout.LayoutParams(dp(150),dp(150)));
        countText=text("0",42,purple);countText.setTypeface(null,Typeface.BOLD);root.addView(countText);
        root.addView(text("reels & shorts today",15,Color.DKGRAY));
        timeText=text("Time lost: 0 min",18,Color.DKGRAY);root.addView(timeText);
        mood=text("I'm hungry for reels!",16,purple);root.addView(mood);
        Button manualCount=button("Tap me +1",()->{if(Stats.level(this).equals("manual")){Stats.addReel(this);refresh();}else Toast.makeText(this,"Automatic mode counts scroll events for you",Toast.LENGTH_SHORT).show();});root.addView(manualCount);
        root.addView(text("TRACKING LEVEL",14,purple));
        RadioGroup rg=new RadioGroup(this);rg.setOrientation(RadioGroup.VERTICAL);
        RadioButton manual=new RadioButton(this);manual.setText("Level 1 · Manual (tap Reelo after each video)");manual.setId(1);
        RadioButton auto=new RadioButton(this);auto.setText("Level 2 · Automatic (accessibility scroll events)");auto.setId(2);
        rg.addView(manual);rg.addView(auto);rg.check(Stats.level(this).equals("auto")?2:1);
        rg.setOnCheckedChangeListener((g,id)->{Stats.setLevel(this,id==2?"auto":"manual");});
        root.addView(rg);
        root.addView(button("Allow floating bubble",()->{
            if(Build.VERSION.SDK_INT>=23&&!Settings.canDrawOverlays(this)){
                Intent i=new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:"+getPackageName()));startActivity(i);
            }else startOverlay();
        }));
        root.addView(button("Hide floating bubble",()->stopService(new Intent(this,OverlayService.class))));
        root.addView(button("Enable automatic tracking",()->startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))));
        root.addView(button("Refresh dashboard",()->refresh()));
        root.addView(text("LAST 7 DAYS",14,purple));
        historyText=text("",15,Color.DKGRAY);root.addView(historyText);
        root.addView(text("Privacy: Reelo watches only Android accessibility event metadata for Instagram and YouTube. It does not read video text, messages, or upload activity. Automatic mode is an estimate, not a guaranteed exact reel count.",12,Color.GRAY));
    }
    void startOverlay(){try{Intent i=new Intent(this,OverlayService.class);if(Build.VERSION.SDK_INT>=26)startForegroundService(i);else startService(i);}catch(Exception e){Toast.makeText(this,"Could not start bubble: "+e.getMessage(),Toast.LENGTH_LONG).show();}}
    void refresh(){
        if(countText==null)return;
        int n=Stats.count(this);countText.setText(""+n);
        long mins=Stats.seconds(this)/60;timeText.setText("Estimated time in Instagram/YouTube: "+mins+" min");
        mood.setText(n<10?"I'm warming up! ✨":n<30?"Yum! Your evening tastes great. 😋": "Burp. Your homework says hi. 🤭");
        StringBuilder s=new StringBuilder();
        for(String d:Stats.lastDays())s.append(d.substring(5)).append("   ").append(Stats.count(this,d)).append(" reels\n");
        historyText.setText(s.toString());
    }
    @Override protected void onResume(){super.onResume();refresh();}
}
