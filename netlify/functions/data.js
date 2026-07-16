const { getStore } = require("@netlify/blobs");

// Per-record storage: every player/course/round/match lives at its own key
// (`<collection>:<id>`), so writing one record can never overwrite anyone
// else's data. GET lists a whole collection; POST upserts or deletes one
// record at a time.
exports.handler = async (event) => {
  try {
    const store = getStore("grindhouse");

    if (event.httpMethod === "GET") {
      const legacyKey = event.queryStringParameters && event.queryStringParameters.legacyKey;
      if (legacyKey) {
        const val = await store.get(legacyKey, { type: "json" });
        return {
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ legacyKey, value: val ?? null }),
        };
      }
      const collection = event.queryStringParameters && event.queryStringParameters.collection;
      if (!collection) {
        return { statusCode: 400, body: JSON.stringify({ error: "collection or legacyKey query param required" }) };
      }
      const { blobs } = await store.list({ prefix: `${collection}:` });
      const items = [];
      for (const b of blobs) {
        const val = await store.get(b.key, { type: "json" });
        if (val !== null && val !== undefined) items.push(val);
      }
      return {
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ collection, items }),
      };
    }

    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const { collection, id, value, deleted } = body;
      if (!collection || !id) {
        return { statusCode: 400, body: JSON.stringify({ error: "collection and id are required" }) };
      }
      const key = `${collection}:${id}`;
      if (deleted) {
        await store.delete(key);
      } else {
        await store.setJSON(key, value);
      }
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
