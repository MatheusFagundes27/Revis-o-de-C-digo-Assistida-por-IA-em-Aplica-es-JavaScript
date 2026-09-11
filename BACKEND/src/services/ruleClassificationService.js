import { RULE_CATALOG } from "../config/ruleCatalog.js";

export function classifyRule(ruleId) {
  if (!ruleId) {
    return null;
  }

  const ruleMetadata = RULE_CATALOG[ruleId];

  if (!ruleMetadata) {
    return null;
  }

  return ruleMetadata.category;
}
