export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).send("ok");
  }

  const update = req.body;
  console.log("UPDATE:", JSON.stringify(update));

  if (update.message?.text === "/start") {
    await fetch(
      "https://api.telegram.org/bot" +
        process.env.BOT_TOKEN +
        "/sendMessage",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: update.message.chat.id,
          text: "🎲 Bot Tài Xỉu đã hoạt động trên Vercel!"
        }),
      }
    );
  }

  return res.status(200).send("ok");
}
