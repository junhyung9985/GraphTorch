const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

async function request(path, payload) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.detail ?? "Request failed");
  }
  return data;
}

export async function validateGraph(payload) {
  return request("/validate", payload);
}

export async function compileGraph(payload) {
  return request("/compile", payload);
}
