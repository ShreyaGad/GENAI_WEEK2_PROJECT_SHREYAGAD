package com.reelo.app;

import android.content.Context;
import android.graphics.*;
import android.view.View;

public class MonsterView extends View {
    private final Paint p = new Paint(3);
    private int count = 0;
    public MonsterView(Context c) { super(c); setLayerType(View.LAYER_TYPE_SOFTWARE, null); }
    public void setCount(int n) { count=n; invalidate(); }
    @Override protected void onDraw(Canvas c) {
        super.onDraw(c);
        float w=getWidth(), h=getHeight(), cx=w/2f, cy=h/2f;
        p.setShadowLayer(12,0,5,0x885B20A5);
        p.setColor(0xFF9B5DE5);
        c.drawOval(cx-w*.38f,cy-h*.36f,cx+w*.38f,cy+h*.36f,p);
        p.clearShadowLayer();
        p.setColor(0xFF7B2CBF);
        c.drawCircle(cx-w*.27f,cy-h*.31f,w*.13f,p);
        c.drawCircle(cx+w*.27f,cy-h*.31f,w*.13f,p);
        p.setColor(0xFFFFFFFF);
        c.drawCircle(cx-w*.14f,cy-h*.04f,w*.105f,p);
        c.drawCircle(cx+w*.14f,cy-h*.04f,w*.105f,p);
        p.setColor(0xFF32104F);
        c.drawCircle(cx-w*.13f,cy-h*.025f,w*.055f,p);
        c.drawCircle(cx+w*.15f,cy-h*.025f,w*.055f,p);
        p.setColor(0xFFFF8FAB);
        c.drawOval(cx-w*.10f,cy+h*.13f,cx+w*.10f,cy+h*.25f,p);
        p.setColor(0xFFFFFFFF); p.setTextAlign(Paint.Align.CENTER); p.setTypeface(Typeface.create("sans-serif-rounded",Typeface.BOLD)); p.setTextSize(w*.13f);
        c.drawText(""+count,cx,cy+h*.36f,p);
    }
}
