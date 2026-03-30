// ================= ULTRA NEON CONTROL PANEL V2 =================
// File: App.jsx

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Particles from "react-tsparticles";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// -------------------- COMPONENTS --------------------
const StatCard = ({ label, val, color = "text-white" }) => (
  <motion.div
    whileHover={{ scale: 1.1, boxShadow: "0 0 40px rgba(255,255,255,0.5)" }}
    className="bg-black/40 backdrop-blur-3xl p-6 rounded-3xl shadow-xl text-center border border-white/20 relative overflow-hidden"
  >
    <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-400 opacity-10 blur-xl animate-tilt"></span>
    <p className="text-gray-300 z-10 relative">{label}</p>
    <h2 className={`text-3xl font-extrabold ${color} drop-shadow-xl z-10 relative`}>{val ?? "-"}</h2>
  </motion.div>
);

const Button = ({ children, color, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.12, boxShadow: "0 0 25px rgba(255,255,255,0.6)" }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`px-6 py-3 rounded-2xl font-bold ${color} transition-all duration-200 border border-white/30 relative overflow-hidden shadow-lg`}
  >
    <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-400 opacity-20 blur-xl animate-tilt"></span>
    <span className="relative z-10">{children}</span>
  </motion.button>
);

const ProgressBar = ({ percent, failed = 0 }) => (
  <div className="w-full bg-gray-900/60 h-5 rounded-full overflow-hidden border border-white/30 relative shadow-lg">
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: percent + "%" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="h-5 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-400 absolute left-0 top-0 shadow-[0_0_15px_rgba(0,255,255,0.5)]"
    />
    {failed > 0 && (
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: failed + "%" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="h-5 bg-red-500/70 absolute left-0 top-0 shadow-[0_0_12px_rgba(255,0,0,0.5)]"
      />
    )}
  </div>
);

const LogItem = ({ msg }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="p-1 text-sm text-gray-200 border-b border-gray-700/50 hover:bg-white/5 transition-all rounded"
  >
    {msg}
  </motion.div>
);

const Spinner = () => (
  <div className="w-full flex justify-center py-6">
    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-t-4 border-cyan-400/80 border-t-purple-500/80 shadow-xl"></div>
  </div>
);

// -------------------- APP --------------------
export default function App() {
  const API = "https://mrabot-production.up.railway.app";

  // STATE
  const [stats, setStats] = useState({ groups: 0, users: 0 });
  const [groups, setGroups] = useState([]);
  const [progress, setProgress] = useState({ total: 0, sent: 0, failed: 0 });
  const [status, setStatus] = useState("STOPPED");
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [scheduleTime, setScheduleTime] = useState("");

  // ---------- DATA LOADING ----------
  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, g, p, st] = await Promise.all([
        fetch(API + "/stats").then(r => r.json()),
        fetch(API + "/groups").then(r => r.json()),
        fetch(API + "/progress").then(r => r.json()),
        fetch(API + "/status").then(r => r.json())
      ]);
      setStats(s);
      setGroups(g);
      setProgress(p);
      setStatus(st.status);
    } catch (e) {
      setError("Gagal load data. Cek koneksi atau API!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ---------- COMMAND ----------
  const sendCommand = async (cmd) => {
    try {
      await fetch(API + "/send-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });
      setLogs(prev => [`Command sent: ${cmd}`, ...prev].slice(0, 50));
      loadData();
    } catch (e) {
      setLogs(prev => [`ERROR: ${e.message}`, ...prev].slice(0, 50));
    }
  };

  const broadcastMessage = () => {
    if (!msg.trim()) return;
    if (scheduleTime) {
      // scheduled broadcast
      const now = new Date();
      const scheduleDate = new Date(scheduleTime);
      const delay = scheduleDate.getTime() - now.getTime();
      if (delay > 0) {
        setLogs(prev => [`Scheduled broadcast at ${scheduleTime}: ${msg}`, ...prev].slice(0, 50));
        setTimeout(() => sendCommand(`!broadcast|${msg}`), delay);
        setMsg("");
        return;
      }
    }
    sendCommand(`!broadcast|${msg}`);
    setMsg("");
  };

  // ---------- COMPUTED ----------
  const percent = progress.total > 0 ? Math.floor((progress.sent / progress.total) * 100) : 0;
  const failedPercent = progress.total > 0 ? Math.floor((progress.failed / progress.total) * 100) : 0;
  const filteredGroups = groups.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()));

  // ---------- LOG EXPORT ----------
  const exportLogs = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "logs.txt";
    a.click();
  };

  // ---------- CHART DATA ----------
  const chartData = {
    labels: ["Groups", "Users", "Sent", "Failed"],
    datasets: [
      {
        label: "Realtime Stats",
        data: [stats.groups, stats.users, progress.sent, progress.failed],
        borderColor: "rgba(0,255,255,0.7)",
        backgroundColor: "rgba(0,255,255,0.2)",
        tension: 0.4,
      }
    ]
  };

  return (
    <div className={`${darkMode ? "bg-gradient-to-br from-black via-gray-900 to-black text-white" : "bg-white text-black"} min-h-screen relative p-6 font-sans transition-all duration-700`}>

      {/* PARTICLES ULTRA NEON */}
      {darkMode && <Particles
        className="absolute top-0 left-0 w-full h-full z-0"
        options={{
          fpsLimit: 60,
          interactivity: { detectsOn: "canvas", events: { onHover: { enable: true, mode: "repulse" } } },
          particles: {
            number: { value: 120, density: { enable: true, area: 900 } },
            color: { value: ["#00ffff", "#ff00ff", "#ff0080"] },
            shape: { type: "circle" },
            opacity: { value: 0.6, anim: { enable: true, speed: 1, opacity_min: 0.2, sync: false } },
            size: { value: { min: 2, max: 7 }, random: true },
            move: { enable: true, speed: 2.5, direction: "none", random: true, outMode: "bounce", attract: { enable: true, rotateX: 800, rotateY: 1200 } },
            links: { enable: true, distance: 160, color: "#00ffff", opacity: 0.25, width: 1 }
          },
        }}
      />}

      {/* HEADER */}
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-5xl font-extrabold mb-4 text-center tracking-wider relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-400 drop-shadow-2xl animate-neon-glow"
      >
        ⚡ MR.A BOT CONTROL
      </motion.h1>

      {/* MODE TOGGLE */}
      <div className="flex justify-end mb-4 gap-2 relative z-10">
        <Button color="bg-gray-600 hover:bg-gray-500" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "Light Mode" : "Dark Mode"}
        </Button>
      </div>

      {/* REFRESH BUTTON */}
      <div className="flex justify-end mb-4 relative z-10 gap-3">
        <Button color="bg-cyan-600 hover:bg-cyan-500" onClick={loadData}>Refresh Data</Button>
      </div>

      {loading && <Spinner />}
      {error && <div className="text-red-500 font-bold mb-4 relative z-10">{error}</div>}

      {!loading && !error && (

        <>
          {/* CONTROLS */}
          <div className="flex flex-wrap gap-4 mb-8 justify-center relative z-10">
            <Button color="bg-green-500 hover:bg-green-600" onClick={() => sendCommand("!startbot")}>▶ Start</Button>
            <Button color="bg-red-500 hover:bg-red-600" onClick={() => sendCommand("!stopbot")}>⛔ Stop</Button>
          </div>


          {/* STATS */}
          <div className="grid md:grid-cols-3 gap-6 mb-8 relative z-10">
            <StatCard label="Groups" val={stats.groups} color="text-cyan-400" />
            <StatCard label="Users" val={stats.users} color="text-purple-400" />
            <StatCard
              label="Status"
              val={<span className={`px-3 py-1 rounded-full text-sm ${status === "STOPPED" ? "bg-red-500 animate-pulse" : "bg-green-500 animate-pulse"} drop-shadow-lg`}>{status}</span>}
            />
          </div>

          {/* CHART */}
          <div className="bg-black/40 backdrop-blur-3xl p-6 rounded-3xl mb-8 shadow-xl border border-white/20 relative z-10">
            <div className="w-full h-64"> {/* <-- height diatur di sini */}
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false, // <- penting supaya height bisa dipakai
                  plugins: {
                    legend: {
                      labels: { color: "white", font: { size: 12 } },
                    },
                    title: {
                      display: true,
                      text: "Realtime Stats MR.A BOT",
                      color: "cyan",
                      font: { size: 16 }
                    },
                  },
                  scales: {
                    x: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } },
                    y: { ticks: { color: "white" }, grid: { color: "rgba(255,255,255,0.1)" } }
                  }
                }}
              />
            </div>
          </div>


          {/* BROADCAST */}
          <div className="bg-black/40 backdrop-blur-3xl p-6 rounded-3xl mb-8 shadow-xl border border-white/20 relative z-10">
            <h2 className="mb-4 text-xl font-semibold text-cyan-400 drop-shadow-lg">📢 Broadcast</h2>
            <div className="flex gap-3 mb-2">
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="p-2 rounded-xl text-white bg-black/60 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 w-32"
              />
              <span className="text-gray-300 self-center">Schedule</span>
            </div>
            <div className="flex gap-3">
              <input
                value={msg} onChange={(e) => setMsg(e.target.value)}
                className="flex-1 p-3 rounded-2xl text-white bg-black/60 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder="Ketik pesan..."
              />
              <Button color="bg-cyan-600 hover:bg-cyan-500" onClick={broadcastMessage}>Kirim</Button>
            </div>
          </div>

          {/* PROGRESS */}
          <div className="bg-black/40 backdrop-blur-3xl p-6 rounded-3xl mb-8 shadow-xl border border-white/20 relative z-10">
            <p className="mb-2 font-medium text-lg text-cyan-400 drop-shadow-lg">Progress: {percent}% ({progress.sent}/{progress.total})</p>
            <ProgressBar percent={percent} failed={failedPercent} />
          </div>

          {/* GROUP TABLE & LOGS */}
          <div className="bg-black/40 backdrop-blur-3xl p-6 rounded-3xl shadow-xl border border-white/20 relative z-10 flex flex-col md:flex-row gap-4">

            {/* TABLE */}
            <div className="flex-1">
              <div className="flex justify-between mb-4">
                <h2 className="text-xl font-semibold text-cyan-400 drop-shadow-lg">📋 Group List</h2>
                <input
                  placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="p-2 rounded-xl text-white bg-black/60 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
              </div>
              <div className="max-h-96 overflow-auto scrollbar-thin scrollbar-thumb-cyan-500/50 scrollbar-track-black/20">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-black/60 backdrop-blur-lg">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredGroups.length > 0 ? (
                        filteredGroups.map((g, i) => (
                          <motion.tr
                            key={i} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }} transition={{ delay: i * 0.03 }}
                            className={`border-t border-gray-700 hover:bg-white/10 ${progress.sent > i ? "bg-green-800/30 animate-pulse" : ""}`}
                          >
                            <td className="p-2 text-cyan-300">{g.name ?? "-"}</td>
                            <td className="p-2 text-purple-300">{g.size ?? "-"}</td>
                          </motion.tr>
                        ))
                      ) : (<tr><td colSpan={2} className="p-2 text-center text-gray-400">Tidak ada group</td></tr>)}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>

            {/* LOG PANEL */}
            <div className="w-64 bg-black/40 backdrop-blur-2xl rounded-2xl p-3 flex flex-col overflow-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-black/20">
              <div className="flex justify-between mb-2">
                <h3 className="text-lg font-semibold text-cyan-400 drop-shadow-lg">📜 Logs</h3>
                <Button color="bg-gray-600 hover:bg-gray-500" onClick={exportLogs}>Export</Button>
              </div>
              <div className="flex-1 overflow-auto">
                <AnimatePresence>
                  {logs.map((l, i) => <LogItem key={i} msg={l} />)}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}