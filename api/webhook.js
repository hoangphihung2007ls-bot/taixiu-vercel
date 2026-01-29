export const config = {
  api: {
    bodyParser: true
  }
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(200).send("ok");
    }

    const update = req.body;
    console.log("UPDATE:", JSON.stringify(update));

    const message = update.message;
    if (!message || !message.text) {
      return res.status(200).send("ok");
    }

    if (message.text === "/start") {
      await fetch(
        "https://api.telegram.org/bot" +
          process.env.BOT_TOKEN +
          "/sendMessage",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: message.chat.id,
            text: "🎲 Bot Tài Xỉu đã hoạt động (Webhook + Vercel OK)"
          })
        }
      );
    }

    return res.status(200).send("ok");
  } catch (err) {
    console.error("ERROR:", err);
    return res.status(200).send("ok");
  }
}
