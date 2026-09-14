/**
 * Reverse-proxy the one-port FastAPI+UI app.
 * Set the ORIGIN secret to the Render URL (https://….onrender.com).
 */
export default {
  async fetch(request, env) {
    const origin = (env.ORIGIN || "").replace(/\/$/, "");
    if (!origin) {
      return new Response(
        "Campus Bug Bounty Board: set the ORIGIN secret to your Render URL.",
        { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } },
      );
    }

    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, origin);
    const headers = new Headers(request.headers);
    headers.set("Host", new URL(origin).host);

    const init = {
      method: request.method,
      headers,
      redirect: "manual",
    };
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const upstream = await fetch(target, init);
    const responseHeaders = new Headers(upstream.headers);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  },
};
