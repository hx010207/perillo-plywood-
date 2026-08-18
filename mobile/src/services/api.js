export async function apiRequest(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  return { response, data };
}

export async function loginCarpenter(baseUrl, phone) {
  return apiRequest(baseUrl, '/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
}

export async function loginAdmin(baseUrl, identifier, password) {
  return apiRequest(baseUrl, '/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
}

export async function fetchStats(baseUrl, userId) {
  return apiRequest(baseUrl, `/stats/${userId}`);
}

export async function fetchInvoices(baseUrl, carpenterId) {
  return apiRequest(baseUrl, `/invoices/${carpenterId}`);
}

export async function fetchAdminClaims(baseUrl) {
  return apiRequest(baseUrl, '/admin/claims');
}

export async function fetchAdminCarpenters(baseUrl) {
  return apiRequest(baseUrl, '/admin/carpenters');
}

export async function fetchAdminPayouts(baseUrl) {
  return apiRequest(baseUrl, '/admin/payouts');
}

export async function signupCarpenter(baseUrl, data) {
  return apiRequest(baseUrl, '/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function fetchPendingApprovals(baseUrl) {
  return apiRequest(baseUrl, '/admin/pending-approvals');
}

export async function approveCarpenter(baseUrl, id) {
  return apiRequest(baseUrl, `/admin/carpenters/${id}/approve`, {
    method: 'POST',
  });
}

export async function rejectCarpenter(baseUrl, id) {
  return apiRequest(baseUrl, `/admin/carpenters/${id}/reject`, {
    method: 'POST',
  });
}

export async function requestMoreInfo(baseUrl, id) {
  return apiRequest(baseUrl, `/admin/carpenters/${id}/request-info`, {
    method: 'POST',
  });
}

export async function suspendCarpenter(baseUrl, id) {
  return apiRequest(baseUrl, `/admin/carpenters/${id}/suspend`, {
    method: 'POST',
  });
}

export async function reactivateCarpenter(baseUrl, id) {
  return apiRequest(baseUrl, `/admin/carpenters/${id}/reactivate`, {
    method: 'POST',
  });
}
