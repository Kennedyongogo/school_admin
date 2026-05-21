/**
 * Google OAuth must run on google.com — cannot stay inside a React iframe.
 * Opens a small popup; when done, /google-meet/oauth-done posts back and closes.
 */
export function openGoogleMeetOAuthPopup(token, { onSuccess, onError } = {}) {
  if (!token) {
    onError?.("You are not logged in.");
    return { mode: "error" };
  }

  const url = `/api/google-meet/auth/google?token=${encodeURIComponent(token)}`;
  const features = "width=520,height=720,left=100,top=80,scrollbars=yes,resizable=yes";
  const popup = window.open(url, "google_meet_oauth", features);

  if (!popup) {
    window.location.href = url;
    return { mode: "redirect" };
  }

  const handler = (event) => {
    if (event.origin !== window.location.origin) return;
    if (!event.data || event.data.type !== "google_meet_oauth") return;
    window.removeEventListener("message", handler);
    clearInterval(poll);
    if (event.data.success) onSuccess?.();
    else onError?.(event.data.message || "Google Meet connection failed.");
  };

  window.addEventListener("message", handler);

  const poll = setInterval(() => {
    if (popup.closed) {
      clearInterval(poll);
      window.removeEventListener("message", handler);
    }
  }, 400);

  return { mode: "popup", popup };
}
