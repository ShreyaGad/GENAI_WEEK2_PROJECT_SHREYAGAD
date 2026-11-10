package com.reelo.app;

import android.content.Context;
import android.content.SharedPreferences;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public final class Stats {
    private static final String PREF = "reelo_stats";
    private static SharedPreferences p(Context c) { return c.getSharedPreferences(PREF, Context.MODE_PRIVATE); }
    public static String today() { return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()); }
    private static String countKey(String day) { return "count_" + day; }
    private static String timeKey(String day) { return "seconds_" + day; }
    public static int count(Context c) { return p(c).getInt(countKey(today()), 0); }
    public static int count(Context c, String day) { return p(c).getInt(countKey(day), 0); }
    public static long seconds(Context c) { return p(c).getLong(timeKey(today()), 0L); }
    public static void addReel(Context c) {
        SharedPreferences sp = p(c); String k = countKey(today());
        sp.edit().putInt(k, sp.getInt(k, 0) + 1).apply();
    }
    public static void addSeconds(Context c, long amount) {
        if (amount <= 0) return;
        SharedPreferences sp = p(c); String k = timeKey(today());
        sp.edit().putLong(k, sp.getLong(k, 0L) + amount).apply();
    }
    public static String[] lastDays() {
        String[] a = new String[7];
        java.util.Calendar cal = java.util.Calendar.getInstance();
        for (int i=6; i>=0; i--) {
            cal.setTime(new Date()); cal.add(java.util.Calendar.DAY_OF_YEAR, -i);
            a[6-i] = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(cal.getTime());
        }
        return a;
    }
    public static String level(Context c) { return p(c).getString("level", "manual"); }
    public static void setLevel(Context c, String level) { p(c).edit().putString("level", level).apply(); }
}
