import { retrieveContextForAlert } from "./knowledgeBaseService.js";

export async function enrichAlertsWithContext({ alerts, maxContexts = 3 }) {
  const enrichedAlerts = await Promise.all(
    alerts.map(async (alert) => {
      const contexts = await retrieveContextForAlert(alert, maxContexts);

      return {
        ...alert,
        contexts,
      };
    })
  );

  return enrichedAlerts;
}
