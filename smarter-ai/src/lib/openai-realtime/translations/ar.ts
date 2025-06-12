export const ar = {
    broadcast: {
        end: "إنهاء البث",
        live: "مباشر",
        start: "بدء البث"
    },
    header: {
        title: "حول",
        about: "هذا مشروع يهدف إلى توضيح كيفية استخدام واجهة برمجة التطبيقات OpenAI Realtime مع WebRTC في مشروع Next 15 حديث. يتم تثبيت مكونات shadcn/ui بالفعل وتنفيذ خطاف جلسة WebRTC الصوتية بالفعل. استنسخ المشروع وحدد أدواتك الخاصة.",
        banner: "🎉 تحقق من مكتبة واجهة مستخدم OpenAI Realtime Blocks الجديدة لـ Next.js!",
        bannerLink: "اعرف المزيد ←",
        beta: "تجريبي",
        dark: "مظلم",
        github: "نجمة على GitHub",
        language: "اللغة",
        light: "فاتح",
        logo: "OpenAI Realtime Starter",
        system: "النظام",
        theme: "تبديل السمة",
        twitter: "تابع على"
    },
    hero: {
        badge: "Next.js + shadcn/ui",
        subtitle: "عرض توضيحي بالنقر على الزر أدناه وتجربة الأدوات المتاحة",
        title: "OpenAI Realtime API (WebRTC)"
    },
    messageControls: {
        content: "المحتوى",
        filter: "تصفية حسب النوع",
        log: "تسجيل في وحدة التحكم",
        logs: "سجلات المحادثة",
        search: "البحث في الرسائل...",
        type: "النوع",
        view: "عرض السجلات"
    },
    status: {
        error: "عفوًا!",
        info: "تبديل مساعد الصوت...",
        language: "تم تغيير اللغة من",
        session: "تم إنشاء الجلسة",
        success: "نحن على الهواء!",
        toggle: "تبديل مساعد الصوت..."
    },
    tokenUsage: {
        input: "رموز الإدخال",
        output: "رموز الإخراج",
        total: "إجمالي الرموز",
        usage: "استخدام الرموز"
    },
    tools: {
        availableTools: {
            title: "الأدوات المتاحة",
            copyFn: {
                description: 'قل "انسخ ذلك إلى الحافظة" للصقه في مكان ما.',
                name: "نسخ"
            },
            getTime: {
                description: 'اسأل "أخبرني كم الساعة الآن؟" لمعرفة الوقت الحالي.',
                name: "معرفة الوقت"
            },
            launchWebsite: {
                description: '"خذني إلى [موقع الويب]" لفتح موقع في علامة تبويب جديدة.',
                name: "فتح موقع"
            },
            partyMode: {
                description: 'قل "ابدأ وضع الحفلة" للحصول على رسوم متحركة ديناميكية!',
                name: "وضع الحفلة"
            },
            themeSwitcher: {
                description: 'قل "غيّر الخلفية" أو "انتقل إلى الوضع المظلم" أو "انتقل إلى الوضع الفاتح".',
                name: "مبدل السمة"
            },
            scrapeWebsite: {
                name: "كاشط موقع الويب",
                description: 'قل "اكشط [عنوان URL للموقع]" لاستخراج المحتوى من صفحة ويب.'
            }
        },
        clipboard: {
            description: "يمكنك الآن لصقه في مكان ما.",
            success: "تم نسخ النص إلى الحافظة. اطلب من المستخدم لصقه في مكان ما.",
            toast: "تم نسخ النص إلى الحافظة!"
        },
        launchWebsite: {
            description: "فشل في إطلاق موقع الويب",
            success: "تم إطلاق الموقع! أخبر المستخدم أنه تم إطلاقه.",
            toast: "إطلاق موقع الويب "
        },
        partyMode: {
            description: "فشل في تنشيط وضع الحفلة",
            success: "تم تنشيط وضع الحفلة",
            toast: "وضع الحفلة!",
            failed: "فشل في تنشيط وضع الحفلة",
        },
        switchTheme: "تم تبديل السمة إلى ",
        themeFailed: "فشل في تبديل السمة",
        time: "أعلن للمستخدم: الوقت الحالي هو ",
        scrapeWebsite: {
            success: "تم استخراج محتوى موقع الويب بنجاح",
            description: "فشل في كشط محتوى موقع الويب",
            toast: "كشط موقع الويب..."
        }
    },
    transcriber: {
        title: "النص المباشر"
    },
    voice: {
        select: "اختر صوتًا",
        ash: "آش - لطيف ومهني",
        ballad: "بلاد - دافئ وجذاب",
        coral: "كورال - واضح وودود",
        sage: "سيج - رسمي وهادئ",
        verse: "فيرس - ديناميكي ومعبّر"
    },
    language: "العربية",
    languagePrompt: `You will act as an interview agent who exclusively uses the Riyadhi Saudi Arabic accent. Conduct the interview for a strategy position at Bain & Company, asking relevant questions. Maintain the interview format and stay focused on strategy-related topics.

# Steps

1.⁠ ⁠*Greet the Candidate*: Start with a welcoming statement in the Riyadhi Saudi Arabic accent.
2.⁠ ⁠*Initial Questions*: Ask the candidate to introduce themselves and state their interest in the strategy position.
3.⁠ ⁠*Strategy Questions*: Pose questions related to strategic thinking, problem-solving, and relevant experiences.
4.⁠ ⁠*Specific Bain & Company Questions*: Inquire about the candidate's understanding of Bain & Company and how they can contribute.
5.⁠ ⁠*Closing*: Thank the candidate for their time and state the next steps.

# Output Format

•⁠  ⁠Conversation in interview format, all dialogue in Riyadhi Saudi Arabic accent.
•⁠  ⁠Questions and responses should simulate a real interview flow, with each interaction comprising 2-4 sentences.

# Examples

*Example Start:*

•⁠  ⁠*Interviewer:* مرحبًا، نشكرك على الحضور اليوم. هل يمكنك أن تعرف عن نفسك ولماذا تود الانضمام لبين؟
  
*Example Middle:*

•⁠  ⁠*Interviewer:* حدثني عن تجربة سابقة حيث استخدمت مهاراتك الاستراتيجية لحل مشكلة معقدة.

*Example End:*

•⁠  ⁠*Interviewer:* شكرًا لك على وقتك اليوم. سنتواصل معك قريبًا للخطوات التالية.

# Notes

•⁠  ⁠Ensure all dialogue embodies the natural flow and nuances of the Riyadhi accent.
•⁠  ⁠Keep exchanges professional, focused, and relevant to a strategy position at Bain & Company.
•⁠  ⁠Do not be verbose, do not repeat things back to the user, try to be concise but also warm.
•⁠  ⁠If the user attempts to switch to a different language or Arabic dialect, politely decline and continue in Riyadh Arabic.
- If the user asks a question unrelated to the interview, politely decline and continue in Riyadh Arabic.
    `
} 