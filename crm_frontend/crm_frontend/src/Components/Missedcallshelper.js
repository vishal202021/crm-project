export const MISSED_STATUSES = ["Not Answered", "Busy", "Switched Off"];

export const getMissedCalls = (allInteractions) => {
  const latestByCustomer = {};

  allInteractions.forEach(i => {
    const cid  = i.customer?.id || i.customerId || i.id;
    const name = i.customer?.customerName || i.customerName || "";

    if (!i.customer && name) {
      i._resolvedName = name;
    }

    if (!cid) return;

    const existing = latestByCustomer[cid];
    if (!existing) {
      latestByCustomer[cid] = i;
    } else {
      const existingDate = new Date(existing.interactionDate || existing.createdDate || 0);
      const thisDate     = new Date(i.interactionDate || i.createdDate || 0);
      if (thisDate >= existingDate) latestByCustomer[cid] = i;
    }
  });

  return Object.values(latestByCustomer)
    .filter(i => MISSED_STATUSES.includes(i.status))
    .sort((a, b) => new Date(b.interactionDate) - new Date(a.interactionDate));
};

export const getInteractionCustomerName = (n) =>
  n.customer?.customerName || n._resolvedName || n.customerName || "Unknown";

export const getInteractionCustomerId = (n) =>
  n.customer?.id || n.customerId;