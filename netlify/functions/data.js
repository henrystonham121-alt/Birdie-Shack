const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  try {
    const store = getStore("grindhouse");

    if (event.httpMethod === "GET") {
      const key = event.queryStringParameters && event.queryStringParameters.key;
      if (!key) {
        return { statusCode: 400, body: JSON.stringify({ error: "key query param required" }) };
      }
      const value = await store.get(key);
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, value: value ?? null }),
      };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      if (!body.key) {
        return { statusCode: 400, body: JSON.stringify({ error: "key is required" }) };
      }
      await store.set(body.key, body.value);
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ok: true }),
      };
    }

    return { statusCode: 405, body: "Method not allowed" };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
