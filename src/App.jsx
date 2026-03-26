// ================= BACKEND (Flask - SAME) =================
// (tetap pakai yang sebelumnya)

// ================= FRONTEND (SUPER PREMIUM UI) =================
// file: App.jsx

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function App() {
  const API = "https://mr-a-bot-production.up.railway.app";

  const [stats, setStats] = useState({ groups: 0, users: 0 });
  const [groups, setGroups] = useState([]);
  const [progress, setProgress] = useState({ total: 0, sent: 0 });
  const [status, setStatus] = useState("STOPPED");
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");

  const sendCommand = async (cmd) => {
    await fetch(API + "/send-command", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command: cmd }),
    });
  };

  const loadData = async () => {
  try {
      const s = await fetch(API + "/stats").then(r => r.json());
      const g = await fetch(API + "/groups").then(r => r.json());
      const p = await fetch(API + "/progress").then(r => r.json());
      const st = await fetch(API + "/status").then(r => r.json());
  
      setStats(s);
      setGroups(g);
      setProgress(p);
      setStatus(st.status);
    } catch (err) {
      console.error("API ERROR:", err);
    }
  };
  useEffect(() => {
    loadData();
    const i = setInterval(loadData, 2000);
    return () => clearInterval(i);
  }, []);

  const percent = progress.total
    ? Math.floor((progress.sent / progress.total) * 100)
    : 0;

  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white p-6">

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-4xl font-bold mb-8 text-center"
      >
        ⚡ MR.A BOT CONTROL (PREMIUM)
      </motion.h1>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {[{ label: "Groups", val: stats.groups },
          { label: "Users", val: stats.users },
          { label: "Status", val: status }
        ].map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-lg"
          >
            <p className="text-gray-300">{item.label}</p>
            <h2 className="text-3xl font-bold">{item.val}</h2>
          </motion.div>
        ))}
      </div>

      {/* CONTROLS */}
      <div className="flex flex-wrap gap-4 mb-8 justify-center">
        <button onClick={() => sendCommand("!startbot")}
          className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-xl shadow-lg">
          ▶ Start
        </button>
        <button onClick={() => sendCommand("!stopbot")}
          className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-xl shadow-lg">
          ⛔ Stop
        </button>
      </div>

      {/* BROADCAST */}
      <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl mb-8 shadow-lg">
        <h2 className="mb-4 text-xl">📢 Broadcast</h2>
        <div className="flex gap-3">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="flex-1 p-3 rounded-xl text-black"
            placeholder="Ketik pesan..."
          />
          <button
            onClick={() => {
              sendCommand(`!broadcast|${msg}`);
              setMsg("");
            }}
            className="bg-blue-500 hover:bg-blue-600 px-6 rounded-xl"
          >
            Kirim
          </button>
        </div>
      </div>

      {/* PROGRESS */}
      <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl mb-8 shadow-lg">
        <p className="mb-2">Progress: {percent}% ({progress.sent}/{progress.total})</p>
        <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: percent + "%" }}
            className="bg-green-400 h-4"
          />
        </div>
      </div>

      {/* GROUP TABLE */}
      <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl">📋 Group List</h2>
          <input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-2 rounded text-black"
          />
        </div>

        <div className="max-h-96 overflow-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-black/40">
              <tr>
                <th className="p-2">Name</th>
                <th className="p-2">Members</th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((g, i) => (
                <tr key={i} className="border-t border-gray-700 hover:bg-white/5">
                  <td className="p-2">{g.name}</td>
                  <td className="p-2">{g.size}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
