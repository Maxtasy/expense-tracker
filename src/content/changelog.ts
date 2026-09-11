// Hand-curated, user-facing release history for the public /changelog page. Deliberately separate
// from RELEASING.md's release-history table, which tracks ops details (versionCode, Play Store
// notes) rather than plain-language feature/fix copy. Internal refactors and chores are left out.
// New entries are added here as part of the develop -> main release PR (see RELEASING.md).

export type ChangelogEntry = {
  version: string;
  date: string; // YYYY-MM-DD
  items: string[];
};

// Newest first.
export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.10.0",
    date: "2026-09-11",
    items: [
      "Forgot your password? Reset it by email from the login page.",
      "New changelog page (linked from the landing page) showing what's shipped, release by release.",
    ],
  },
  {
    version: "1.9.0",
    date: "2026-09-10",
    items: [
      "Change your password from Settings.",
      "Loading indicators now show up on every button that takes a moment, not just a few.",
      "Exported CSV files include a timestamp in their filename.",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-09-10",
    items: [
      "Insights shows totals right in the category breakdown headline, and the income/expense toggle moved to the top of the page.",
      "Expenses and income now get their own distinct colors throughout the app.",
      "New \"Start fresh\" option in Settings to wipe your transactions and start over.",
      "The landing page, login, and signup screens are now available in all 5 supported languages.",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-09-10",
    items: [
      "The app is now available in English, German, Spanish, French, and Portuguese — pick your language in Settings.",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-09-09",
    items: [
      "Loading indicators on delete actions.",
      "Edit recurring transactions from a popup form.",
      "Fixed a bug where deleting a single occurrence of a recurring transaction could make it reappear.",
      "Insights can now show expenses or income on their own, instead of always combined.",
      "Pick a custom color for your categories.",
      "Hide default categories you don't use.",
      "New feedback and roadmap sections on the landing page.",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-09-09",
    items: [
      "Import your transaction history from Money Manager.",
      "Small fixes: month/year labels center correctly on narrow screens, buttons show a pointer cursor.",
    ],
  },
  {
    version: "1.4.0",
    date: "2026-09-08",
    items: [
      "Adding a transaction, category, or recurring transaction now opens in a quick popup form.",
      "New category breakdown bar chart in Insights.",
      "Improved contrast and touch targets on buttons and forms.",
    ],
  },
  {
    version: "1.3.0",
    date: "2026-09-05",
    items: [
      "Fixed swipe navigation to work across the whole page, not just part of it.",
      "Loading indicator while a page navigation is in progress.",
      "Currency symbols throughout the app, with a currency setting in Settings.",
      "Tablet-friendly layout.",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-09-05",
    items: ["Swipe left or right to move between months on the dashboard."],
  },
];
