import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const neighborhoods = [
  { name: "Centro", lat: "-20.4219", lng: "-49.9728", riskLevel: "medium" },
  { name: "Pozzobon", lat: "-20.4150", lng: "-49.9650", riskLevel: "low" },
  { name: "Colinas", lat: "-20.4280", lng: "-49.9800", riskLevel: "high" },
  { name: "São João", lat: "-20.4300", lng: "-49.9680", riskLevel: "medium" },
  { name: "Patrimônio Novo", lat: "-20.4180", lng: "-49.9780", riskLevel: "low" },
  { name: "Estação", lat: "-20.4250", lng: "-49.9700", riskLevel: "medium" },
  { name: "São Cosme", lat: "-20.4100", lng: "-49.9600", riskLevel: "low" },
  { name: "Jardim Alvorada", lat: "-20.4350", lng: "-49.9850", riskLevel: "high" },
  { name: "Vila América", lat: "-20.4200", lng: "-49.9550", riskLevel: "medium" },
  { name: "Cecap", lat: "-20.4050", lng: "-49.9750", riskLevel: "low" },
  { name: "Jardim Bela Vista", lat: "-20.4320", lng: "-49.9620", riskLevel: "medium" },
  { name: "Vila Paes", lat: "-20.4270", lng: "-49.9580", riskLevel: "low" },
  { name: "Parque das Nações", lat: "-20.4380", lng: "-49.9720", riskLevel: "high" },
  { name: "Jardim Marin", lat: "-20.4120", lng: "-49.9820", riskLevel: "medium" },
  { name: "Pró-Povo", lat: "-20.4400", lng: "-49.9680", riskLevel: "high" },
  { name: "Sonho Meu", lat: "-20.4080", lng: "-49.9900", riskLevel: "medium" },
  { name: "Jardim Palmeiras", lat: "-20.4160", lng: "-49.9520", riskLevel: "low" },
  { name: "Vila Muniz", lat: "-20.4340", lng: "-49.9760", riskLevel: "medium" },
  { name: "Jardim Oiti", lat: "-20.4060", lng: "-49.9680", riskLevel: "low" },
  { name: "Residencial Greenville", lat: "-20.4420", lng: "-49.9600", riskLevel: "low" },
];

console.log("Seeding neighborhoods...");
for (const n of neighborhoods) {
  await conn.execute(
    `INSERT INTO neighborhoods (name, lat, lng, riskLevel, totalComplaints, totalCases) VALUES (?, ?, ?, ?, 0, 0) ON DUPLICATE KEY UPDATE lat=VALUES(lat), lng=VALUES(lng), riskLevel=VALUES(riskLevel)`,
    [n.name, n.lat, n.lng, n.riskLevel]
  );
  console.log(`  ✓ ${n.name}`);
}

console.log("Seeding settings...");
const settingsData = [
  ["threshold_low", "5"],
  ["threshold_high", "20"],
  ["notification_emails", "vigilancia@votuporanga.sp.gov.br"],
  ["city_name", "Votuporanga"],
  ["city_state", "SP"],
  ["population", "95000"],
];
for (const [key, value] of settingsData) {
  await conn.execute(
    "INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=VALUES(value)",
    [key, value]
  );
  console.log(`  ✓ ${key}`);
}

console.log("Seeding sample metrics...");
const now = Date.now();
for (let i = 30; i >= 0; i--) {
  const date = now - i * 86400000;
  const confirmed = Math.floor(Math.random() * 15) + 2;
  const suspected = Math.floor(Math.random() * 25) + 5;
  const deaths = Math.random() > 0.9 ? 1 : 0;
  const underInvestigation = Math.floor(Math.random() * 10);
  const infestation = (Math.random() * 3 + 0.5).toFixed(1);
  const incidence = (confirmed / 95000 * 100000).toFixed(1);
  const totalComplaints = Math.floor(Math.random() * 8) + 1;
  await conn.execute(
    `INSERT INTO metrics (date, confirmedCases, suspectedCases, deaths, underInvestigation, infestationIndex, incidenceRate, totalComplaints, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [date, confirmed, suspected, deaths, underInvestigation, infestation, incidence, totalComplaints, "Seed data - demonstração"]
  );
}
console.log("  ✓ 31 days of sample metrics");

console.log("Seeding sample complaints...");
const types = ["standing_water", "abandoned_lot", "trash_accumulation", "open_container", "construction_debris"];
const statuses = ["received", "in_analysis", "confirmed", "resolved"];
for (let i = 0; i < 25; i++) {
  const date = now - Math.floor(Math.random() * 30) * 86400000;
  const type = types[Math.floor(Math.random() * types.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const nIdx = Math.floor(Math.random() * neighborhoods.length) + 1;
  const protocol = `VA-2026-${String(i + 1).padStart(4, "0")}`;
  const resolvedAt = status === "resolved" ? date + Math.floor(Math.random() * 5) * 86400000 : null;
  await conn.execute(
    `INSERT INTO complaints (protocol, date, type, description, neighborhoodId, anonymous, status, resolvedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=VALUES(status)`,
    [protocol, date, type, `Denúncia de exemplo #${i + 1}`, nIdx, true, status, resolvedAt]
  );
}
console.log("  ✓ 25 sample complaints");

console.log("\n✅ Seed completed successfully!");
await conn.end();
process.exit(0);
