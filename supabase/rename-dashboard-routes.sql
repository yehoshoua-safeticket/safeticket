-- The customer area moved from /dashboard to /account, and two of its pages were
-- renamed (buyer -> orders, seller -> listings). tasks.page stores those paths as
-- plain text, so existing tasks would point at routes that no longer resolve.
UPDATE tasks SET page = '/account/orders'   WHERE page = '/dashboard/buyer';
UPDATE tasks SET page = '/account/listings' WHERE page = '/dashboard/seller';
UPDATE tasks SET page = '/account/sell'     WHERE page = '/dashboard/sell';
UPDATE tasks SET page = '/account/verify'   WHERE page = '/dashboard/verify';
UPDATE tasks SET page = '/account'          WHERE page = '/dashboard';
UPDATE tasks SET page = '/account/settings' WHERE page = '/settings';

-- Should return no rows.
SELECT id, page FROM tasks WHERE page LIKE '/dashboard%' OR page = '/settings';
