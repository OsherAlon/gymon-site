/**
 * Text written for this site only — the home and support pages and the page
 * chrome. Everything legal comes from the app's JSON, never from here.
 *
 * Hebrew is gender-neutral throughout (the project rule): no second-person
 * singular, "אפשר ל-" / "יש ל-" / impersonal forms instead.
 *
 * Labels of in-app buttons are NOT written here: the support page takes them
 * from the app's `home.json`, so the steps name exactly what the screen says.
 */

export const SUPPORT_EMAIL = 'gymon.official@gmail.com';
export const APPLE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions';

export const copy = {
  en: {
    langName: 'English',
    switchTo: 'עברית',
    home: {
      title: 'Gymon',
      tagline: 'Gymon is an app for tracking personal workouts.',
    },
    nav: { home: 'Home', privacy: 'Privacy Policy', terms: 'Terms of Use', support: 'Support' },
    support: {
      title: 'Support',
      contactTitle: 'Contact',
      contactBody: 'For any question, problem or request, write to:',
      subscriptionTitle: 'Cancelling a subscription',
      subscriptionBody:
        'A subscription bought through the App Store is managed by Apple, and is cancelled in the Apple ID settings rather than inside Gymon.',
      subscriptionSteps: [
        'On iPhone: Settings → your name → Subscriptions → Gymon → Cancel Subscription.',
      ],
      subscriptionLink: 'Manage subscriptions at Apple',
      deleteTitle: 'Deleting the account',
      deleteLead: 'The account is deleted from inside the app:',
      // {profile} {settings} {deleteRow} {cta} {confirm} are the app's own
      // labels, filled in from `home.json` at build time.
      deleteSteps: [
        'Open the {profile} tab and tap the {settings} (gear) button at the top of the screen.',
        'Tap {deleteRow}.',
        'The screen that opens lists what will and will not be deleted. Tap {cta}, then confirm with {confirm}.',
      ],
      documentsTitle: 'Documents',
    },
    notFound: { title: 'Page not found', body: 'This page does not exist.' },
  },
  he: {
    langName: 'עברית',
    switchTo: 'English',
    home: {
      title: 'Gymon',
      tagline: 'Gymon היא אפליקציה למעקב אחר אימוני כושר אישיים.',
    },
    nav: { home: 'דף הבית', privacy: 'מדיניות פרטיות', terms: 'תנאי שימוש', support: 'תמיכה' },
    support: {
      title: 'תמיכה',
      contactTitle: 'יצירת קשר',
      contactBody: 'לכל שאלה, תקלה או בקשה אפשר לכתוב לכתובת:',
      subscriptionTitle: 'ביטול מנוי',
      subscriptionBody:
        'מנוי שנרכש דרך App Store מנוהל אצל Apple, והביטול שלו נעשה בהגדרות ה-Apple ID ולא בתוך Gymon.',
      subscriptionSteps: ['באייפון: הגדרות ← השם בראש המסך ← מינויים ← Gymon ← ביטול המינוי.'],
      subscriptionLink: 'ניהול מינויים אצל Apple',
      deleteTitle: 'מחיקת חשבון',
      deleteLead: 'מחיקת החשבון נעשית מתוך האפליקציה:',
      deleteSteps: [
        'בלשונית {profile}, לחיצה על כפתור {settings} (גלגל השיניים) בראש המסך.',
        'לחיצה על {deleteRow}.',
        'במסך שנפתח מופיע מה יימחק ומה לא. לחיצה על {cta}, ואז אישור ב{confirm}.',
      ],
      documentsTitle: 'מסמכים',
    },
    notFound: { title: 'הדף לא נמצא', body: 'הדף הזה לא קיים.' },
  },
};
