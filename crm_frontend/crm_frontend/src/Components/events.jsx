export const CRM_EVENTS = {
  DATA_UPDATED: "crm-data-updated"
};

export const emitCRMUpdate = () => {
  window.dispatchEvent(
    new Event(CRM_EVENTS.DATA_UPDATED)
  );
};
