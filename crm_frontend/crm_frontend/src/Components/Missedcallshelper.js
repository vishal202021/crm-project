/**
 * From all interactions, return only customers whose
 * LATEST interaction is still a missed status.
 * If a customer called back (status = Connected/Interested/etc.)
 * they are automatically removed from the missed list.
 */
export const MISSED_STATUSES = ["Not Answered", "Busy", "Switched Off"];

export const getMissedCalls = (allInteractions) => {
  // Group by customerId — keep latest per customer
  const latestByCustomer = {};

  allInteractions.forEach(i => {
    const cid = i.customer?.id || i.customerId;
    if (!cid) return;

    const existing = latestByCustomer[cid];
    if (!existing) {
      latestByCustomer[cid] = i;
    } else {
      // Compare by interactionDate — keep the newest
      const existingDate = new Date(existing.interactionDate || 0);
      const thisDate     = new Date(i.interactionDate || 0);
      if (thisDate >= existingDate) {
        latestByCustomer[cid] = i;
      }
    }
  });

  // Only keep customers whose latest interaction is missed
  return Object.values(latestByCustomer)
    .filter(i => MISSED_STATUSES.includes(i.status))
    .sort((a, b) => new Date(b.interactionDate) - new Date(a.interactionDate));
};