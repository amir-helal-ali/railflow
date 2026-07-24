#!/bin/bash
# Deep page audit script — visits every sidebar page and reports errors.

PAGES=(
  "لوحة التحكم"
  "المشاريع"
  "المتجر"
  "عمليات النشر"
  "البيئات"
  "خطوط CI/CD"
  "التنبيهات"
  "النشاط"
  "بحث التدقيق"
  "الحاويات"
  "الطرفية"
  "تجميع السجلات"
  "مراقبة الخادم"
  "مستكشف المقاييس"
  "صحة API"
  "الأداء"
  "قواعد البيانات"
  "وحدات التخزين"
  "الشبكات"
  "المناطق"
  "النسخ الاحتياطي"
  "شهادات SSL"
  "مركز الأمان"
  "استراتيجيات النشر"
  "Webhooks"
  "التكاملات"
  "ملعب API"
  "التكلفة"
  "المساعدة"
  "الفريق"
  "الإعدادات"
)

PASS=0
FAIL=0

for label in "${PAGES[@]}"; do
  agent-browser find text "$label" click >/dev/null 2>&1
  sleep 2
  title=$(agent-browser eval "document.querySelector('h1')?.textContent || 'null'" 2>/dev/null | tail -1)
  if echo "$title" | grep -qi "Error\|null\|^\s*$"; then
    echo "✗ $label — FAIL ($title)"
    FAIL=$((FAIL+1))
  else
    echo "✓ $label — OK"
    PASS=$((PASS+1))
  fi
done

echo ""
echo "=== Audit Results ==="
echo "Passed: $PASS / $((PASS+FAIL))"
echo "Failed: $FAIL / $((PASS+FAIL))"
