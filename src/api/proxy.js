export default async function handler(req, res) {
  try {
    // Ambil path asli setelah /api/proxy
    const path = req.url.replace("/api/proxy", "") || "/";
    const backendUrl = `https://mrabot-production.up.railway.app${path}`;

    // Handle preflight CORS
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
      return res.status(200).end();
    }

    // Siapkan fetch options
    const fetchOptions = {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
      },
    };

    if (req.method !== "GET" && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    // Fetch ke backend Flask
    const response = await fetch(backendUrl, fetchOptions);

    // Jika response bukan JSON (misal /logs), fallback
    let data;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
      res.status(response.status).json(data);
    } else {
      data = await response.text();
      res.status(response.status).send(data);
    }

    // Set CORS
    res.setHeader("Access-Control-Allow-Origin", "*");

  } catch (err) {
    console.error("Proxy error:", err);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(500).json({ error: err.message });
  }
}