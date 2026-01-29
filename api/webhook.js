import { Telegraf } from "telegraf";

/* ===== CONFIG ===== */
const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = Number(process.env.ADMIN_ID); // telegram id admin

/* ===== DATA (demo – production nên dùng DB) ===== */
let users = {};        // { id: { balance } }
let bets = {};         // { id: { side, amount } }
let pot = 0;
let roundId = Math.floor(Math.random() * 100000);

/* ===== HELPERS ===== */
const vnd = (n) => n.toLocaleString("vi-VN");

const dices = ["⚀","⚁","⚂","⚃","⚄","⚅"];
const rollDice = () => {
  const d = [
    Math.floor(Math.random()*6)+1,
    Math.floor(Math.random()*6)+1,
    Math.floor(Math.random()*6)+1
  ];
  return d;
};

/* ===== COMMANDS ===== */
bot.start((ctx) => {
  if (!users[ctx.from.id]) users[ctx.from.id] = { balance: 0 };
  ctx.reply("🎲 Tài Xỉu Sunwin\n/dodu – số dư\n/tai <tiền>\n/xiu <tiền>");
});

bot.command("sodu", (ctx) => {
  const u = users[ctx.from.id];
  ctx.reply(`💰 Số dư: ${vnd(u?.balance || 0)} VNĐ`);
});

/* ===== BET ===== */
async function bet(ctx, side, amount) {
  const id = ctx.from.id;
  if (!users[id]) users[id] = { balance: 0 };

  if (bets[id])
    return ctx.reply("❌ Mỗi phiên chỉ cược 1 bên");

  if (users[id].balance < amount)
    return ctx.reply("❌ Không đủ số dư");

  users[id].balance -= amount;
  bets[id] = { side, amount };
  ctx.reply(`✅ Đã cược ${side} ${vnd(amount)} VNĐ`);
}

bot.command("tai", (ctx) => {
  const amt = Number(ctx.message.text.split(" ")[1]);
  if (!amt) return ctx.reply("❌ /tai <số tiền>");
  bet(ctx, "TAI", amt);
});

bot.command("xiu", (ctx) => {
  const amt = Number(ctx.message.text.split(" ")[1]);
  if (!amt) return ctx.reply("❌ /xiu <số tiền>");
  bet(ctx, "XIU", amt);
});

/* ===== ADMIN NẠP ===== */
bot.command("nap", (ctx) => {
  if (ctx.from.id !== ADMIN_ID) return;
  const [, uid, amt] = ctx.message.text.split(" ");
  if (!users[uid]) users[uid] = { balance: 0 };
  users[uid].balance += Number(amt);

  ctx.reply("✅ Đã nạp");
  bot.telegram.sendMessage(
    ADMIN_ID,
    `💰 NẠP TIỀN\n👤 UID: ${uid}\n💵 ${vnd(amt)} VNĐ`
  );
});

/* ===== RÚT TIỀN ===== */
bot.command("rut", (ctx) => {
  const parts = ctx.message.text.split(" ");
  if (parts.length < 4)
    return ctx.reply("❌ /rut <tiền> <ngân_hàng> <chủ_tài_khoản>");

  const amount = Number(parts[1]);
  const bank = parts[2];
  const owner = parts.slice(3).join(" ");

  if (!users[ctx.from.id] || users[ctx.from.id].balance < amount)
    return ctx.reply("❌ Không đủ số dư");

  users[ctx.from.id].balance -= amount;

  ctx.reply("📨 Yêu cầu rút đã gửi admin");

  bot.telegram.sendMessage(
    ADMIN_ID,
    `🏦 YÊU CẦU RÚT\n👤 ${ctx.from.id}\n💵 ${vnd(amount)} VNĐ\n🏦 ${bank}\n👤 ${owner}`
  );
});

/* ===== KẾT PHIÊN (demo – gọi thủ công) ===== */
bot.command("ketqua", async (ctx) => {
  const dice = rollDice();
  const sum = dice.reduce((a,b)=>a+b,0);
  const result = sum >= 11 ? "TAI" : "XIU";

  let jackpot = dice.every(d=>d===1) || dice.every(d=>d===6);

  for (const id in bets) {
    const b = bets[id];
    if (b.side === result) {
      const win = b.amount * 1.92;
      users[id].balance += win;
    } else {
      pot += b.amount * 0.003; // 0.3% vào hũ
    }
  }

  bets = {};
  roundId++;

  ctx.reply(
    `🎲 ${dice.map(d=>dices[d-1]).join(" ")}\nKQ: ${result}\n💰 Hũ: ${vnd(Math.floor(pot))}`
  );
});

/* ===== WEBHOOK HANDLER ===== */
export default async function handler(req, res) {
  if (req.method === "POST") {
    await bot.handleUpdate(req.body);
    return res.status(200).send("OK");
  }
  res.status(200).send("Bot is running");
}
