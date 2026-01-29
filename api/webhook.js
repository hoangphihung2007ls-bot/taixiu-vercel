export default async function handler(req, res) {
  if (req.method === "POST") {
    const body = req.body;

    console.log("Webhook data:", body);

    return res.status(200).json({ ok: true });
  }

  res.status(200).send("OK");
}
