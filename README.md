# 🤰 Mama's Journey — Pregnancy Planner

A beautiful, full-featured pregnancy planner web app built with vanilla HTML, CSS, and JavaScript. Track every milestone from week 1 to birth.

🌐 **Live site:** [vinisha231.github.io/pregnancyPlanner](https://vinisha231.github.io/pregnancyPlanner/)

---

## ✨ Features

| Section | What it does |
|---|---|
| 🏠 **Dashboard** | Enter your LMP or due date → see current week, trimester, days left, and a progress bar |
| 📅 **Weekly Tracker** | Baby size, measurements, development milestones, mom symptoms & tips for all 40 weeks |
| 💊 **Health Log** | Track 16 symptoms daily + a weight logger with a line graph over time |
| 📆 **Appointments** | Add doctor appointments with date, time, type & notes — splits into upcoming vs past |
| ✅ **Checklists** | Hospital bag, nursery setup, birth plan, first month prep — all saveable |
| 🍎 **Nutrition Guide** | Safe foods vs foods to avoid, fully searchable |
| 🤖 **AI Chat** | Ask a pregnancy AI assistant anything — powered by Claude (Anthropic) |

All data is saved in your browser (localStorage) — no account needed.

---

## 🚀 Running Locally (with AI chat)

**1. Clone the repo**
```bash
git clone https://github.com/vinisha231/pregnancyPlanner.git
cd pregnancyPlanner
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Add your Anthropic API key**
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```
> Get a free key at [console.anthropic.com](https://console.anthropic.com) → API Keys

**4. Run the server**
```bash
python main.py
```

**5. Open your browser**
```
http://localhost:5000
```

---

## 🗂 File Structure

```
pregnancyPlanner/
├── index.html        # Main SPA — all 7 sections
├── styles.css        # Full responsive design (pink/purple theme)
├── app.js            # All logic + 40-week pregnancy data
├── main.py           # Flask backend + Anthropic API proxy
└── requirements.txt  # Python dependencies
```

---

## 🔑 AI Chat Setup

The AI assistant is powered by **Claude (Anthropic)**. You can connect it two ways:

**Option A — In the browser (GitHub Pages)**
1. Go to the AI Chat tab
2. Enter your API key (stored locally in your browser only)

**Option B — Via Flask backend (local)**
1. Set `ANTHROPIC_API_KEY` as an environment variable
2. Run `python main.py`
3. The server handles all AI requests securely

---

## 💡 Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (no frameworks)
- **Charts:** [Chart.js](https://www.chartjs.org/)
- **Backend:** Python + Flask
- **AI:** Anthropic Claude API (claude-haiku)
- **Hosting:** GitHub Pages

---

*Built with ❤️ to help women navigate their pregnancy journey with confidence.*
