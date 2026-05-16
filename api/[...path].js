const { handler } = require("../netlify/functions/api");

module.exports = async function vercelApi(req, res) {
  const pathname = new URL(req.url, "https://banksoal.local").pathname;
  const event = {
    path: pathname,
    httpMethod: req.method,
    headers: req.headers,
    body: typeof req.body === "string" ? req.body : JSON.stringify(req.body || {})
  };

  const result = await handler(event);
  for (const [key, value] of Object.entries(result.headers || {})) {
    res.setHeader(key, value);
  }
  res.status(result.statusCode || 200).send(result.body || "");
};
