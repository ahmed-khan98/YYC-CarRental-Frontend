export function isMobileBrowser() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

function asPdfBlob(blob: Blob, filename: string) {
  return blob instanceof File && blob.type === "application/pdf"
    ? blob
    : new File([blob], filename, { type: "application/pdf" });
}

export function openPdfUrl(url: string, filename: string) {
  if (isMobileBrowser()) {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (opened) return;
  }
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function openPdfBlob(blob: Blob, filename: string) {
  const pdf = asPdfBlob(blob, filename);
  const url = URL.createObjectURL(pdf);
  openPdfUrl(url, filename);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Open a fetched PDF without losing the user tap (needed on mobile). */
export async function openPdfAfterFetch(
  fetchBlob: () => Promise<Blob>,
  filename: string,
) {
  const popup = window.open("about:blank", "_blank");
  try {
    const pdf = asPdfBlob(await fetchBlob(), filename);
    const url = URL.createObjectURL(pdf);
    if (popup && !popup.closed) {
      popup.location.href = url;
    } else {
      openPdfUrl(url, filename);
    }
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    popup?.close();
    throw error;
  }
}
