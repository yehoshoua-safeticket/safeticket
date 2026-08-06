import type { TaskSection } from '@/types/database';

export interface SectionPage {
  path: string;
  label: string;
}

export const SECTION_LABELS: Record<TaskSection, string> = {
  storefront: 'חזית אתר',
  user_space: 'אזור משתמש',
  backoffice: 'לוח ניהול',
};

// Add or remove entries here as new pages are added to the app.
export const SECTION_PAGES: Record<TaskSection, SectionPage[]> = {
  storefront: [
    { path: '/', label: 'דף הבית' },
    { path: '/tickets', label: 'כרטיסים' },
    { path: '/tickets/[id]', label: 'פרטי כרטיס' },
    { path: '/how-it-works', label: 'איך זה עובד' },
    { path: '/contact', label: 'צור קשר' },
    { path: '/support', label: 'תמיכה' },
    { path: '/auth/login', label: 'כניסה' },
    { path: '/auth/signup', label: 'הרשמה' },
    { path: '/auth/forgot-password', label: 'שכחתי סיסמה' },
  ],
  user_space: [
    { path: '/account', label: 'לוח הבקרה' },
    { path: '/account/profile', label: 'הפרופיל שלי' },
    { path: '/account/orders', label: 'הזמנות שלי' },
    { path: '/account/listings', label: 'המודעות שלי' },
    { path: '/account/sell', label: 'מכור כרטיס' },
    { path: '/account/verify', label: 'אימות זהות' },
    { path: '/account/settings', label: 'הגדרות' },
    { path: '/checkout', label: 'תשלום' },
  ],
  backoffice: [
    { path: '/staff', label: 'סקירה כללית' },
    { path: '/staff/events', label: 'אירועים' },
    { path: '/staff/external_users', label: 'משתמשים חיצוניים' },
    { path: '/staff/listings', label: 'מודעות' },
    { path: '/staff/disputes', label: 'סכסוכים' },
    { path: '/staff/support', label: 'תמיכה' },
    { path: '/staff/tasks', label: 'משימות' },
    { path: '/staff/internal_users', label: 'משתמשים פנימיים' },
  ],
};
