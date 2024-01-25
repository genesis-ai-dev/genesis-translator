import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

export async function proxyFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  console.log({ input, init }, "in proxyFetch");
  if (!(window as any)._fetch) {
    throw new Error("Proxy fetch not initialized");
  }

  const proxyServerUrl =
    (window as any).proxyServerUrl || "http://localhost:65433";
  console.log({ proxyServerUrl });

  const headers = new Headers(init?.headers);
  headers.append(
    "x-continue-url",
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.href
      : input.url,
  );
  let body = init?.body;
  if (body instanceof ReadableStream) {
    const reader = body.getReader();
    const chunks = [];
    let done, value;
    while (!done) {
      ({ done, value } = await reader.read());
      if (value) {
        chunks.push(value);
      }
    }
    body = Buffer.concat(chunks);
  }
  return (window as any)._fetch(proxyServerUrl, {
    ...init,
    headers,
    body,
  });
}

(window as any)._fetch = window.fetch;
window.fetch = proxyFetch;
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
