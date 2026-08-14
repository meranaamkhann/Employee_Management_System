package com.hrplatform.common;

public final class CsvUtils {

    private CsvUtils() {}

    public static String escape(Object value) {
        if (value == null) return "";
        String s = value.toString();
        boolean needsQuoting = s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r");
        if (!needsQuoting) return s;
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }

    public static String row(Object... values) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < values.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(escape(values[i]));
        }
        sb.append("\r\n");
        return sb.toString();
    }
}