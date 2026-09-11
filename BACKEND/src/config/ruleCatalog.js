import { REVIEW_CATEGORIES } from "./reviewCategories.js";

export const RULE_CATALOG = Object.freeze({
  "no-unused-vars": {
    category: REVIEW_CATEGORIES.READABILITY,
  },

  "no-unreachable": {
    category: REVIEW_CATEGORIES.MAINTAINABILITY,
  },

  "no-constant-condition": {
    category: REVIEW_CATEGORIES.MAINTAINABILITY,
  },

  "no-async-promise-executor": {
    category: REVIEW_CATEGORIES.ERROR_HANDLING,
  },

  "no-promise-executor-return": {
    category: REVIEW_CATEGORIES.ERROR_HANDLING,
  },

  "react-hooks/rules-of-hooks": {
    category: REVIEW_CATEGORIES.BEST_PRACTICES,
  },

  "react-hooks/exhaustive-deps": {
    category: REVIEW_CATEGORIES.BEST_PRACTICES,
  },
});
