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

/**
 * Gymon's App Store listing. null while the app is not live: the header still
 * shows the official badge, but it leads nowhere. Set it once the app is live,
 * e.g. 'https://apps.apple.com/app/id0000000000', and rebuild.
 */
export const APP_STORE_URL = null;

/**
 * App Store Connect "provider token" (`pt`) for campaign links. null until the app is live.
 * Campaign links carry one `ct` token per PLACEMENT (blog-inline, blog-end), never per
 * article — Apple hides campaigns under 5 downloads (SEO doctrine §1).
 */
export const APP_STORE_PROVIDER_TOKEN = null;

export const copy = {
  en: {
    langName: 'English',
    switchTo: 'עברית',
    // Google Play is not live: a neutral text pill, not Google's badge (see SiteChrome.astro).
    playSoon: { name: 'Google Play', soon: 'Coming soon' },
    home: {
      title: 'Gymon',
      tagline: 'Gymon is an app for tracking personal workouts.',
      screenAlt: "The Gymon app's home screen: this week's workouts and today's steps.",
    },
    nav: { home: 'Home', privacy: 'Privacy Policy', terms: 'Terms of Use', support: 'Support', blog: 'Blog' },
    // Home "what's inside" marquee (2026-10-07). Feature cards, NOT testimonials: Gymon has no
    // users yet and invented reviews are prohibited. Every claim is checked against the shipped
    // app (gymon app/src + departments/legal/app_store_listing_draft.md). Data-driven, so real
    // reviews (with permission) can replace these later.
    features: {
      title: "What's inside Gymon",
      description: 'A quick look at what the app does.',
      items: [
        { icon: 'plan', title: 'A plan built for you', tag: 'Short questionnaire', text: 'Answer a few questions about your goal, experience, equipment and training days, and get a weekly plan with sets, reps and rest.' },
        { icon: 'log', title: "Last time's numbers, right there", tag: 'Workout log', text: 'Every set shows the weight and reps from the last run of the same workout, so the next small step is clear.' },
        { icon: 'timer', title: 'A rest timer that starts itself', tag: 'Workout log', text: 'Mark a set as done and the rest timer starts. Timed exercises like running get a stopwatch instead.' },
        { icon: 'chat', title: 'Build a workout in a chat', tag: 'Chat with Gymon', text: 'Say what you want to train, how much time you have and what to avoid, and Gymon builds the workout with you.' },
        { icon: 'trend', title: 'Your best set, per exercise', tag: 'History', text: 'See past sessions of each exercise, the best set in each, and how your volume moves over time.' },
        { icon: 'lang', title: 'Fully in Hebrew, right to left', tag: 'Language', text: 'Every screen works in Hebrew from right to left, and in English.' },
        { icon: 'book', title: 'How-to for every exercise', tag: 'Exercise library', text: 'Each exercise in the library comes with instructions on how to do it, in Hebrew too.' },
        { icon: 'health', title: 'Steps from Apple Health', tag: 'Optional', text: 'With your permission, Gymon reads steps and workouts from Health. It never writes to Health, and the data stays on your phone.' },
      ],
    },
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
    blog: {
      title: 'Blog',
      heading: 'Blog',
      subheading: 'Training, strength and recovery — practical notes from the Gymon team.',
      by: 'by',
      readTime: (n) => `${n} min read`,
      dateLocale: 'en-US',
      back: 'All articles',
      scrollToRead: 'Scroll to read',
      disclaimer: 'General information only, not medical advice. Anyone with a medical condition, an injury or pain should consult a qualified professional before starting or changing a training routine.',
      empty: 'No articles yet.',
      article: {
        // Trust line (UX doctrine §6: say what the AI did, name the human, show the dates).
        drafted: 'Drafted with AI assistance from the sources listed below',
        reviewed: (name, date) => `Fact-checked and edited by ${name} on ${date}`,
        notReviewed: 'Not yet reviewed by the editor',
        published: (date) => `Published ${date}`,
        updated: (date) => `Updated ${date}`,
        sampleBanner: 'Sample article — it shows the article layout. It has not been reviewed and is not indexed.',
        bottomLine: 'Bottom line',
        keyPoints: 'Key points',
        // v2 layout (user decision 2026-10-07): idea cards, numbered steps, study detail only in the sources.
        inShort: 'In short',
        apply: 'How to apply it',
        step: (n) => `Step ${n}`,
        found: 'What it found',
        certainty: 'How sure',
        sourcesNote: 'study details and how sure each finding is',
        toc: 'In this article',
        faq: 'Common questions',
        quiz: 'Check yourself',
        quizAnswer: 'Show the answer',
        quizCorrect: 'Answer:',
        sources: 'Sources',
        source: 'Source',
        openSource: 'Open the source',
        toList: 'All sources',
        close: 'Close',
        abstractOnly: 'abstract or excerpt read, not the full text',
        tier: { PRIMARY: 'Primary research', AUTHORITY: 'Authority / position stand', SECONDARY: 'Secondary source' },
        type: {
          'meta-analysis': 'Meta-analysis',
          'systematic-review': 'Systematic review',
          rct: 'Randomised trial',
          cohort: 'Cohort study',
          'cross-sectional': 'Cross-sectional study',
          review: 'Review',
          'position-stand': 'Position stand',
          guideline: 'Guideline',
          other: 'Other',
        },
        evidence: {
          strong: 'Strong evidence',
          moderate: 'Moderate evidence',
          limited: 'Limited evidence',
          mixed: 'Mixed evidence',
          insufficient: 'Not enough evidence',
        },
        callout: { note: 'Note', myth: 'Common myth', safety: 'Safety' },
        gymon: {
          'log-example': 'Example from a Gymon log',
          'plan-logic': "How Gymon's plan builder decides",
          'teardown-finding': "From Gymon's review of workout apps",
          illustrative: 'Illustrative numbers, not user data.',
          cols: ['Set', 'Previous', 'kg', 'Reps', '✓'],
        },
        editor: {
          heading: 'About the editor',
          name: 'Osher Alon',
          // ⚠ User to confirm: this is Osher's public bio. Truthful by design (no credential claimed).
          bio: 'Edited by Osher Alon, founder of Gymon. Osher is not a certified coach or dietitian. Every article is checked against the sources listed at its end. For medical questions, consult a qualified professional.',
        },
        howMade:
          'How this article was made: an AI model drafted it from the research listed under Sources, and was allowed to cite only those sources. Automated checks then tested every reference link and every number against its source, and Osher Alon fact-checked and edited the article before publication. Corrections: ',
        howMadeSample:
          'How this sample was made: it was written by an AI coding assistant to demonstrate the article layout. Its two sources are real and checkable, but no editor has reviewed it. Corrections: ',
        aiImage: 'Header image: AI-generated.',
        endCta: {
          heading: 'Log it in Gymon',
          iphone: 'Gymon is an iPhone app.',
          soon: 'Coming soon to the App Store.',
          android: 'Android: coming soon.',
          link: 'Get Gymon on the App Store',
        },
        // CTA copy registry (UX doctrine §7: never AI-written; the writer only picks a slot).
        ctaSlots: {
          'log-sets': "Gymon shows last session's weight and reps next to every set, so the next small step is always in view.",
          'track-progress': 'Gymon keeps every set, so progress over weeks is something to read, not to remember.',
          'plan-builder': 'Gymon builds a plan from goal, experience, equipment and training days, and sets the sets, reps and rest for it.',
        },
        ctaInlineLink: 'See Gymon',
        calc: {
          'one-rep-max': {
            title: 'Estimate a one-rep max',
            unit: 'kg',
            weight: 'Weight lifted (kg)',
            reps: 'Reps completed (1 to 12)',
            result: 'Estimated 1RM',
            epley: 'Epley',
            brzycki: 'Brzycki',
            range: (lo, hi) => `The two formulas give ${lo} to ${hi} kg.`,
            invalidWeight: 'Enter a weight between 1 and 500 kg.',
            invalidReps: 'Enter whole reps between 1 and 12.',
            note: 'An estimate from one hard set, not a test. Formulas: Epley, weight × (1 + reps ÷ 30); Brzycki, weight × 36 ÷ (37 − reps).',
          },
        },
      },
    },
  },
  he: {
    langName: 'עברית',
    switchTo: 'English',
    playSoon: { name: 'Google Play', soon: 'בקרוב' },
    home: {
      title: 'Gymon',
      tagline: 'Gymon היא אפליקציה למעקב אחר אימוני כושר אישיים.',
      screenAlt: 'מסך הבית באפליקציית Gymon: האימונים של השבוע והצעדים של היום.',
    },
    nav: { home: 'דף הבית', privacy: 'מדיניות פרטיות', terms: 'תנאי שימוש', support: 'תמיכה', blog: 'בלוג' },
    features: {
      title: 'מה יש ב-Gymon',
      description: 'הצצה קצרה למה שהאפליקציה עושה.',
      items: [
        { icon: 'plan', title: 'תוכנית שנבנית במיוחד', tag: 'שאלון קצר', text: 'עונים על כמה שאלות על המטרה, הניסיון, הציוד וימי האימון, ומקבלים תוכנית שבועית עם סטים, חזרות ומנוחה.' },
        { icon: 'log', title: 'המספרים מהפעם הקודמת, מול העיניים', tag: 'יומן אימון', text: 'ליד כל סט מופיעים המשקל והחזרות מהפעם הקודמת של אותו אימון, כך שהצעד הבא ברור.' },
        { icon: 'timer', title: 'טיימר מנוחה שמתחיל לבד', tag: 'יומן אימון', text: 'מסמנים סט כבוצע וטיימר המנוחה מתחיל. בתרגילים מבוססי זמן, כמו ריצה, יש שעון עצר.' },
        { icon: 'chat', title: 'בונים אימון בשיחה', tag: 'שיחה עם Gymon', text: 'מספרים מה רוצים לאמן, כמה זמן יש וממה להימנע, ו-Gymon בונה איתכם את האימון.' },
        { icon: 'trend', title: 'הסט הטוב ביותר בכל תרגיל', tag: 'היסטוריה', text: 'רואים את האימונים הקודמים בכל תרגיל, את הסט הטוב ביותר בכל אחד ואת מגמת הנפח לאורך זמן.' },
        { icon: 'lang', title: 'עברית מלאה, מימין לשמאל', tag: 'שפה', text: 'כל המסכים עובדים בעברית מימין לשמאל, וגם באנגלית.' },
        { icon: 'book', title: 'הוראות ביצוע לכל תרגיל', tag: 'מאגר תרגילים', text: 'לכל תרגיל במאגר יש הוראות ביצוע, גם בעברית.' },
        { icon: 'health', title: 'צעדים מ-Apple Health', tag: 'לבחירה', text: 'בהרשאה, Gymon קורא צעדים ואימונים מ-Health. שום דבר לא נכתב ל-Health, והנתונים נשארים בטלפון.' },
      ],
    },
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
    blog: {
      title: 'בלוג',
      heading: 'בלוג',
      subheading: 'אימונים, כוח והתאוששות — הערות מעשיות מצוות Gymon.',
      by: 'מאת',
      readTime: (n) => (n === 1 ? 'דקת קריאה אחת' : `${n} דקות קריאה`),
      dateLocale: 'he-IL',
      back: 'כל המאמרים',
      scrollToRead: 'גללו לקריאה',
      disclaimer: 'מידע כללי בלבד, ולא ייעוץ רפואי. במקרה של מצב רפואי, פציעה או כאב, יש להתייעץ עם איש מקצוע מוסמך לפני התחלה או שינוי של שגרת אימונים.',
      empty: 'עדיין אין מאמרים.',
      article: {
        drafted: 'נכתב בסיוע AI על בסיס המקורות שבסוף המאמר',
        reviewed: (name, date) => `נבדק ונערך על ידי ${name} ב-${date}`,
        notReviewed: 'טרם עבר בדיקה ועריכה אנושית',
        published: (date) => `פורסם ב-${date}`,
        updated: (date) => `עודכן ב-${date}`,
        sampleBanner: 'מאמר לדוגמה — מציג את תבנית המאמר. הוא לא נבדק ולא מאונדקס במנועי חיפוש.',
        bottomLine: 'השורה התחתונה',
        keyPoints: 'עיקרי הדברים',
        inShort: 'בקצרה',
        apply: 'איך מיישמים',
        step: (n) => `שלב ${n}`,
        found: 'מה נמצא',
        certainty: 'רמת הוודאות',
        sourcesNote: 'פרטי המחקרים ועד כמה כל ממצא ודאי',
        toc: 'במאמר',
        faq: 'שאלות נפוצות',
        quiz: 'בדיקה עצמית',
        quizAnswer: 'הצגת התשובה',
        quizCorrect: 'התשובה:',
        sources: 'מקורות',
        source: 'מקור',
        openSource: 'לפתיחת המקור',
        toList: 'כל המקורות',
        close: 'סגירה',
        abstractOnly: 'נקרא תקציר או קטע, לא המאמר המלא',
        tier: { PRIMARY: 'מחקר ראשוני', AUTHORITY: 'גוף מקצועי / עמדה רשמית', SECONDARY: 'מקור משני' },
        type: {
          'meta-analysis': 'מטא-אנליזה',
          'systematic-review': 'סקירה שיטתית',
          rct: 'ניסוי מבוקר',
          cohort: 'מחקר עוקבה',
          'cross-sectional': 'מחקר חתך',
          review: 'סקירה',
          'position-stand': 'עמדה רשמית',
          guideline: 'הנחיה',
          other: 'אחר',
        },
        evidence: {
          strong: 'ראיות חזקות',
          moderate: 'ראיות בינוניות',
          limited: 'ראיות מוגבלות',
          mixed: 'ראיות לא חד-משמעיות',
          insufficient: 'אין מספיק ראיות',
        },
        callout: { note: 'הערה', myth: 'מיתוס נפוץ', safety: 'בטיחות' },
        gymon: {
          'log-example': 'דוגמה מיומן אימונים ב-Gymon',
          'plan-logic': 'איך בונה התוכניות של Gymon מחליט',
          'teardown-finding': 'מתוך הסקירה של Gymon על אפליקציות אימון',
          illustrative: 'מספרים להמחשה, לא נתוני משתמשים.',
          cols: ['סט', 'קודם', 'ק"ג', 'חזרות', '✓'],
        },
        editor: {
          heading: 'על העריכה',
          name: 'אושר אלון',
          // ⚠ לאישור המשתמשת: הביוגרפיה הפומבית. ניסוח ניטרלי מגדרית, בלי הסמכה שאין.
          bio: 'עריכה: אושר אלון, מייסדת Gymon. אושר אינה מאמנת מוסמכת או דיאטנית. כל מאמר נבדק מול המקורות המופיעים בסופו. בשאלות רפואיות יש לפנות לאיש מקצוע מוסמך.',
        },
        howMade:
          'איך נכתב המאמר: מודל AI כתב טיוטה על בסיס המחקר שמופיע תחת "מקורות", והורשה לצטט רק אותו. בדיקות אוטומטיות בדקו כל קישור לכל מקור וכל מספר מול המקור שלו, ואושר אלון בדק וערך את המאמר לפני הפרסום. לתיקונים: ',
        howMadeSample:
          'איך נכתבה הדוגמה: עוזר תכנות מבוסס AI כתב אותה כדי להדגים את תבנית המאמר. שני המקורות אמיתיים ואפשר לבדוק אותם, אבל איש לא בדק ולא ערך את הטקסט. לתיקונים: ',
        aiImage: 'תמונת הפתיחה נוצרה ב-AI.',
        endCta: {
          heading: 'לתעד ב-Gymon',
          iphone: 'Gymon היא אפליקציה לאייפון.',
          soon: 'בקרוב ב-App Store.',
          android: 'אנדרואיד: בקרוב.',
          link: 'להורדת Gymon ב-App Store',
        },
        ctaSlots: {
          'log-sets': 'ב-Gymon המשקל והחזרות מהאימון הקודם מופיעים ליד כל סט, כך שהצעד הבא תמיד מול העיניים.',
          'track-progress': 'Gymon שומרת כל סט, כך שההתקדמות לאורך שבועות כתובה ולא נשענת על הזיכרון.',
          'plan-builder': 'Gymon בונה תוכנית לפי מטרה, ניסיון, ציוד וימי אימון, וקובעת בה סטים, חזרות ומנוחה.',
        },
        ctaInlineLink: 'להכיר את Gymon',
        calc: {
          'one-rep-max': {
            title: 'הערכת חזרה מקסימלית (1RM)',
            unit: 'ק"ג',
            weight: 'המשקל שהורם (ק"ג)',
            reps: 'מספר החזרות (1 עד 12)',
            result: '1RM משוער',
            epley: 'Epley',
            brzycki: 'Brzycki',
            range: (lo, hi) => `שתי הנוסחאות נותנות ${lo} עד ${hi} ק"ג.`,
            invalidWeight: 'יש להזין משקל בין 1 ל-500 ק"ג.',
            invalidReps: 'יש להזין מספר שלם של חזרות, 1 עד 12.',
            note: 'הערכה מסט קשה אחד, לא מבחן. הנוסחאות: Epley — משקל כפול (1 ועוד חזרות חלקי 30); Brzycki — משקל כפול 36 חלקי (37 פחות חזרות).',
          },
        },
      },
    },
  },
};
