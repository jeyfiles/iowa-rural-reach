// Thin wrapper around the Web3Forms submit API.
// Docs: https://docs.web3forms.com/getting-started/api-reference
//
// Both access keys used by FeedbackModal/RequestChangeModal are Web3Forms
// "access keys" -- designed to ship in client-side code (same idea as a
// Formspree form ID), not secrets that need an env variable.

const ENDPOINT = "https://api.web3forms.com/submit";

export async function submitToWeb3Forms(
  accessKey: string,
  fields: Record<string, unknown>
): Promise<{ success: true; message?: string }> {
  const payload = {
    access_key: accessKey,
    // Honeypot field Web3Forms checks for spam -- must stay false for real users.
    botcheck: false,
    ...fields,
  };

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Could not reach the form service. Check your connection and try again.");
  }

  const data = await res.json().catch(() => null);

  if (!res.ok || !data || data.success !== true) {
    throw new Error((data && data.message) || "Submission failed. Please try again.");
  }

  return data;
}
