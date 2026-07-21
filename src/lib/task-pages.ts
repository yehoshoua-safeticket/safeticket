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
    { path: '/dashboard', label: 'לוח הבקרה' },
    { path: '/dashboard/buyer', label: 'הזמנות שלי' },
    { path: '/dashboard/seller', label: 'המודעות שלי' },
    { path: '/dashboard/sell', label: 'מכור כרטיס' },
    { path: '/dashboard/verify', label: 'אימות זהות' },
    { path: '/checkout', label: 'תשלום' },
  ],
  backoffice: [
    { path: '/admin', label: 'סקירה כללית' },
    { path: '/admin/events', label: 'אירועים' },
    { path: '/admin/external_users', label: 'משתמשים חיצוניים' },
    { path: '/admin/listings', label: 'מודעות' },
    { path: '/admin/disputes', label: 'סכסוכים' },
    { path: '/admin/support', label: 'תמיכה' },
    { path: '/admin/tasks', label: 'משימות' },
    { path: '/admin/internal_users', label: 'משתמשים פנימיים' },
  ],
};
