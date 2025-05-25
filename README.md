# TARBOO Deobfuscate

مشروع لفك تشفير أكواد Node.js المشفرة باستخدام خوارزميات WebCrack محليًا و OpenAI API.

## كيفية التشغيل محليًا

1. ثبت الحزم:

```
npm install
```

2. أنشئ ملف `.env.local` في جذر المشروع وضع فيه مفتاح OpenAI API:

```
OPENAI_API_KEY=your_openai_api_key_here
```

3. شغل المشروع:

```
npm run dev
```

ثم افتح المتصفح على `http://localhost:3000`

## النشر على Vercel

- اربط المستودع بـ Vercel.
- أضف متغير البيئة `openai_api_key` في إعدادات المشروع في Vercel.
- اضغط Deploy.

---

تأكد من عدم رفع ملف `.env.local` إلى أي مستودع عام للحفاظ على أمان المفتاح.
