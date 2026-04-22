# 🤰 Mama's Journey — Pregnancy Planner

A beautiful, full-featured pregnancy planner web app built with vanilla HTML, CSS, and JavaScript. Tracks every milestone from week 1 to birth with a stunning hot-pink × dark glassmorphism aesthetic.

🌐 **Live site:** [vinisha231.github.io/pregnancyPlanner](https://vinisha231.github.io/pregnancyPlanner/)

---

## ✨ Features

| Section | What it does |
|---|---|
| 🏠 **Dashboard** | Enter LMP or due date → couple banner, 4 stat tiles, full-width progress bar, baby development card, partner card |
| 📅 **Weekly Tracker** | 3-column layout — fruit size sidebar + baby development + mom tips + 40-week jump grid |
| 💊 **Health Log** | 18 symptom chips + notes logger, weight tracker with pink Chart.js line graph |
| 📆 **Appointments** | Sidebar form + appointment list, splits upcoming vs past, recommended schedule tip box |
| ✅ **Checklists** | Hospital bag, nursery setup, birth plan, first month prep — with sidebar progress tracker |
| 🍎 **Nutrition Guide** | 16 safe foods + 16 avoid items with searchable lists and food counts |
| 🤖 **AI Chat** | Luna AI — powered by Claude (Anthropic) — with 8 suggested questions sidebar |

All data saved in your browser (localStorage) — no account needed.

---

## 🎨 Design

- **Theme:** Hot pink `#FF2D78` on near-black `#08030E`
- **Typography:** Plus Jakarta Sans (Google Fonts)
- **Style:** Glassmorphism cards, animated blobs, gradient text, neon glow effects
- **Layout:** Full-page SPA — 3-col weekly tracker, 2-col health/appointments/nutrition, bento dashboard

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
├── index.html        # Full-page SPA — 7 sections, full-width layouts
├── styles.css        # Pink × black dark theme — glassmorphism, bento grid, responsive
├── app.js            # All logic + complete 40-week pregnancy data
├── main.py           # Flask backend + Anthropic API proxy
└── requirements.txt  # Python dependencies
```

---

## 🔑 AI Chat Setup

The AI assistant is powered by **Claude (Anthropic)**. Two connection options:

**Option A — In the browser (GitHub Pages)**
1. Go to the AI Chat tab
2. Enter your API key → stored locally in your browser only

**Option B — Via Flask backend (local)**
1. Set `ANTHROPIC_API_KEY` as an environment variable
2. Run `python main.py`
3. The server handles all AI requests securely

---

## 💡 Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (no frameworks)
- **Charts:** [Chart.js](https://www.chartjs.org/)
- **Fonts:** Plus Jakarta Sans (Google Fonts)
- **Backend:** Python + Flask
- **AI:** Anthropic Claude API (claude-haiku)
- **Hosting:** GitHub Pages

---

## 👶 Partner Profile

Add an optional partner profile (Dad / Baba / Papa / Partner) — shown as a bento card on the dashboard and included in the couple banner.

---

*Built with ❤️ to help women navigate their pregnancy journey with confidence and style.*
