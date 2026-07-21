-- FAQ records for the How-it-works page.
-- Run this in the Supabase SQL editor. Safe to re-run (IF NOT EXISTS / idempotent).
--
-- Publicly readable (the page reads it with the anon key) but with NO write
-- policy, so all inserts/updates/deletes go through the service-role API route
-- (/api/admin/faqs), matching how events and the curation tables are handled.
--
-- Bilingual: *_he is the source of truth and *_en falls back to it when blank.
-- `keywords` is free text that search matches on alongside question and answer,
-- so an entry can be found by words that do not literally appear in its copy.
-- `asterisk_*` is an optional footnote rendered under the answer.

CREATE TABLE IF NOT EXISTS faqs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_he TEXT NOT NULL,
  answer_he   TEXT NOT NULL,
  question_en TEXT NOT NULL DEFAULT '',
  answer_en   TEXT NOT NULL DEFAULT '',
  asterisk_he TEXT NOT NULL DEFAULT '',
  asterisk_en TEXT NOT NULL DEFAULT '',
  keywords    TEXT NOT NULL DEFAULT '',
  category    TEXT CHECK (category IN ('general','buyers','sellers','security')),
  position    INTEGER NOT NULL DEFAULT 0,
  published   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "FAQs are viewable by everyone" ON faqs;
CREATE POLICY "FAQs are viewable by everyone" ON faqs
  FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS faqs_position_idx ON faqs (position);

-- ── Seed ──────────────────────────────────────────────────────────────────
-- Only seeds an empty table, so re-running never duplicates or overwrites
-- edits made through the admin screen.
INSERT INTO faqs (question_he, answer_he, question_en, answer_en, asterisk_he, asterisk_en, keywords, category, position)
SELECT * FROM (VALUES
  (
    'מה זה SafeTicket?',
    'SafeTicket היא פלטפורמה מאובטחת לקנייה ולמכירה של כרטיסים בין אנשים פרטיים. אנו מחברים בין קונים למוכרים באמצעות מערכת תשלום מאובטחת, כך שהתשלום מועבר למוכר רק לאחר שהאירוע הסתיים. כך שני הצדדים נהנים מתהליך בטוח, הוגן ושקוף.',
    'What is SafeTicket?',
    'SafeTicket is a secure platform for buying and selling tickets between private individuals. We connect buyers and sellers through a secure payment system, so payment is released to the seller only after the event has taken place. Both sides get a safe, fair and transparent process.',
    '', '',
    'אודות מי אנחנו פלטפורמה הסבר כללי about platform marketplace',
    'general', 0
  ),
  (
    'איך מערכת ה-Escrow עובדת?',
    'לאחר ביצוע התשלום, הכסף נשמר באופן מאובטח ואינו מועבר למוכר באופן מיידי. רק לאחר שהאירוע הסתיים והתהליך הושלם בהצלחה, התשלום מועבר למוכר. במקרה של בעיה המאומתת על ידי צוות SafeTicket, התהליך נבדק בהתאם למדיניות השירות.',
    'How does escrow work?',
    'Once payment is made, the money is held securely and is not passed to the seller straight away. Payment is released to the seller only after the event has taken place and the process has completed successfully. If a problem is verified by the SafeTicket team, the case is reviewed under our service policy.',
    '* החזר כספי יינתן בכפוף לעמידה בתנאי השימוש, מדיניות ההחזרים ונהלי הבדיקה של SafeTicket.',
    '* Refunds are subject to the SafeTicket terms of service, refund policy and review procedures.',
    'נאמנות אסקרו escrow תשלום מאובטח כסף מוחזק ביטחון',
    'general', 1
  ),
  (
    'כמה עולה להשתמש ב-SafeTicket?',
    'השימוש בפלטפורמה ללא עלות למוכרים בעת פרסום הכרטיסים. בעת מכירת כרטיס נגבית עמלת שירות של 2.5% מהמוכר בלבד. בקניית כרטיס נגבית עמלת שירות של 10% ממחיר העסקה.',
    'How much does SafeTicket cost?',
    'Listing tickets is free for sellers. When a ticket sells, a 2.5% service fee is charged to the seller only. When buying a ticket, a 10% service fee is charged on the transaction price.',
    '', '',
    'עמלה עמלות מחיר עלות תשלום כמה עולה חינם fees commission price cost',
    'general', 2
  ),
  (
    'איך אתם מוודאים שהכרטיסים אמיתיים?',
    'כל כרטיס המפורסם ב-SafeTicket עובר תהליך בדיקה לפני אישורו לפרסום. אנו מבצעים אימות של פרטי הכרטיס כדי לצמצם ככל האפשר את הסיכון להונאות ולהבטיח חוויית רכישה בטוחה.',
    'How do you make sure tickets are genuine?',
    'Every ticket listed on SafeTicket goes through a review before it is approved for publication. We verify the ticket details to minimise the risk of fraud and keep the buying experience safe.',
    '', '',
    'זיוף מזויף אמיתי בדיקה אימות הונאה בטיחות fake genuine fraud verification',
    'general', 3
  ),
  (
    'האם אפשר למכור מעל המחיר המקורי?',
    'SafeTicket פועלת למניעת ספסרות בכרטיסים. לכן, מחיר המכירה אינו יכול להיות גבוה מהמחיר המקורי ששולם עבור הכרטיס. כך אנו שומרים על שוק הוגן ונגיש לכל המשתמשים.',
    'Can I sell above the original price?',
    'SafeTicket works to prevent ticket scalping. Accordingly, the sale price cannot exceed the original price paid for the ticket. This keeps the market fair and accessible for everyone.',
    '', '',
    'ספסרות מחיר מקורי מחירים מדיניות תקרת מחיר יוקר scalping price cap resale',
    'general', 4
  ),
  (
    'מה קורה אם האירוע מבוטל?',
    'במקרה של ביטול רשמי של האירוע, הקונה יקבל החזר מלא באופן אוטומטי לאמצעי התשלום שבו השתמש, בהתאם למדיניות הפלטפורמה ומארגני האירוע.',
    'What happens if the event is cancelled?',
    'If the event is officially cancelled, the buyer automatically receives a full refund to the payment method used, in line with the platform''s policy and the event organiser''s terms.',
    '', '',
    'ביטול אירוע מבוטל החזר כספי refund cancelled event',
    'general', 5
  ),
  (
    'איך מתבצע תהליך האימות?',
    'לאחר העלאת הכרטיס, צוות SafeTicket מבצע בדיקה של פרטי הכרטיס והמסמכים הנדרשים. לאחר השלמת האימות ואישור הכרטיס, המודעה מתפרסמת באתר והכרטיס זמין לרכישה.',
    'How does the verification process work?',
    'After a ticket is uploaded, the SafeTicket team reviews the ticket details and the required documents. Once verification is complete and the ticket is approved, the listing goes live and the ticket is available to buy.',
    '', '',
    'אימות בדיקה תהליך מסמכים אישור verification review approval documents',
    'general', 6
  ),
  (
    'מה עושים במקרה של בעיה?',
    'בכל מקרה של בעיה במהלך העסקה ניתן לפנות לצוות התמיכה של SafeTicket. כל פנייה נבדקת באופן פרטני, ובהתאם לממצאים ולמדיניות השירות נפעל למציאת פתרון הוגן ומהיר עבור שני הצדדים.',
    'What do I do if something goes wrong?',
    'If a problem comes up during a transaction, you can contact the SafeTicket support team. Every case is reviewed individually, and based on the findings and our service policy we work to reach a fair, fast resolution for both sides.',
    '', '',
    'בעיה תמיכה סכסוך מחלוקת עזרה פנייה problem support dispute help',
    'general', 7
  ),
  (
    'כמה זמן לוקח לקבל תשלום כמוכר?',
    'לאחר שהאירוע הסתיים, התשלום מועבר לחשבון הבנק של המוכר בתוך 3–5 ימי עסקים, בהתאם לזמני העיבוד של הבנק.',
    'How long does it take to get paid as a seller?',
    'After the event has taken place, payment is transferred to the seller''s bank account within 3–5 business days, depending on the bank''s processing times.',
    '', '',
    'תשלום מתי מקבלים כסף העברה בנק ימי עסקים payout payment seller bank',
    'sellers', 8
  ),
  (
    'האם אפשר למכור כרטיסים דיגיטליים?',
    'כן. ניתן למכור מגוון סוגי כרטיסים דיגיטליים, לרבות קובצי PDF, כרטיסים עם ברקוד או QR וקישורים דיגיטליים, בכפוף לתמיכה הטכנית ולבדיקות האימות של SafeTicket.',
    'Can I sell digital tickets?',
    'Yes. You can sell a range of digital ticket types, including PDF files, barcode or QR tickets and digital links, subject to SafeTicket''s technical support and verification checks.',
    '', '',
    'דיגיטלי PDF ברקוד QR קישור אלקטרוני digital barcode link electronic',
    'sellers', 9
  ),
  (
    'מה קורה אם הכרטיס לא עובד בכניסה?',
    'אם הכרטיס לא יהיה תקף מסיבה המכוסה במדיניות שלנו, צוות SafeTicket יבדוק את המקרה ובמידת הצורך יעניק החזר בהתאם לתנאי השירות.',
    'What if the ticket does not work at the entrance?',
    'If the ticket is not valid for a reason covered by our policy, the SafeTicket team will review the case and, where appropriate, issue a refund under the terms of service.',
    '', '',
    'כניסה סירוב לא עובד לא תקף החזר כשל entrance denied invalid refund',
    'buyers', 10
  ),
  (
    'האם אפשר לבטל עסקה לאחר הרכישה?',
    'לאחר השלמת הרכישה לא ניתן לבטל את העסקה באופן חד-צדדי, אלא במקרים המפורטים במדיניות הביטולים של SafeTicket.',
    'Can I cancel a transaction after buying?',
    'Once a purchase is complete, the transaction cannot be cancelled unilaterally, except in the cases set out in SafeTicket''s cancellation policy.',
    '', '',
    'ביטול עסקה לבטל רכישה החזר cancel cancellation purchase',
    'buyers', 11
  ),
  (
    'איך אקבל את הכרטיס?',
    'לאחר השלמת התשלום הכרטיס יישלח אליכם באופן מיידי בדוא"ל וב-SMS, ויהיה זמין גם באזור האישי.',
    'How will I receive my ticket?',
    'As soon as payment is complete, the ticket is sent to you by email and SMS, and is also available in your personal account area.',
    '', '',
    'קבלת כרטיס מייל דואל SMS מסירה אזור אישי delivery email receive',
    'buyers', 12
  ),
  (
    'אילו אמצעי תשלום מתקבלים?',
    'ניתן לשלם באמצעות כרטיסי אשראי הנתמכים על ידי מערכת הסליקה של SafeTicket.',
    'Which payment methods are accepted?',
    'You can pay with the credit cards supported by SafeTicket''s payment processor.',
    '', '',
    'תשלום אשראי כרטיס אשראי סליקה אמצעי תשלום payment credit card',
    'buyers', 13
  ),
  (
    'מתי המודעה שלי מתפרסמת?',
    'לאחר השלמת תהליך האימות, המודעה מתפרסמת באתר והופכת זמינה לרוכשים.',
    'When does my listing go live?',
    'Once verification is complete, your listing is published on the site and becomes available to buyers.',
    '', '',
    'מודעה פרסום מתי מתפרסם אימות listing publish live',
    'sellers', 14
  ),
  (
    'האם אפשר לערוך או למחוק מודעה?',
    'כן. כל עוד הכרטיס לא נמכר, ניתן לערוך את פרטי המודעה או להסיר אותה מהאתר.',
    'Can I edit or delete a listing?',
    'Yes. As long as the ticket has not sold, you can edit the listing details or remove it from the site.',
    '', '',
    'עריכה מחיקה שינוי מודעה הסרה edit delete remove listing',
    'sellers', 15
  ),
  (
    'מה קורה אם הכרטיס שלי לא נמכר?',
    'אם הכרטיס לא נמכר עד מועד האירוע, לא תחויבו בתשלום כלשהו והמודעה תוסר באופן אוטומטי לאחר האירוע.',
    'What if my ticket does not sell?',
    'If the ticket does not sell before the event, you are charged nothing and the listing is removed automatically after the event.',
    '', '',
    'לא נמכר חיוב עמלה הסרה אוטומטית unsold no charge listing',
    'sellers', 16
  ),
  (
    'האם הפרטים האישיים שלי מאובטחים?',
    'כן. SafeTicket עושה שימוש באמצעי אבטחה מתקדמים להגנה על המידע האישי ופרטי התשלום של המשתמשים.',
    'Is my personal information secure?',
    'Yes. SafeTicket uses advanced security measures to protect users'' personal information and payment details.',
    '', '',
    'אבטחה פרטיות מידע אישי הגנה security privacy data protection',
    'security', 17
  ),
  (
    'איך אפשר ליצור קשר עם שירות הלקוחות?',
    'ניתן לפנות לצוות התמיכה באמצעות טופס יצירת קשר או בדוא"ל. אנו משתדלים להשיב לכל פנייה במהירות האפשרית.',
    'How can I contact customer service?',
    'You can reach the support team through the contact form or by email. We aim to respond to every enquiry as quickly as possible.',
    '', '',
    'יצירת קשר תמיכה שירות לקוחות מייל טלפון contact support customer service',
    'security', 18
  )
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM faqs);
