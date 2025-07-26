# 🧠 Dynamic Smart Heating Control System

A real-time, energy-efficient building control platform that adjusts heating dynamically based on class schedules and room occupancy. This capstone project leverages modern web technologies, data visualization, and microservices to optimize campus heating systems and reduce energy waste.

---

## 📂 Project Structure

.
├── buildocc-bend     # Backend: FastAPI server with PostgreSQL integration

└── buildocc          # Frontend: Next.js + React dashboard with heatmaps


---

## 🧰 Tech Stack

| Layer     | Languages         | Frameworks / Libraries                                                                       | Tools / Services           |
|-----------|------------------|-----------------------------------------------------------------------------------------------|----------------------------|
| Backend   | Python            | FastAPI, Uvicorn, psycopg[binary], sse-starlette, NumPy, Matplotlib                         | PostgreSQL, StaticFiles    |
| Frontend  | TypeScript, JS    | Next.js, React, Tailwind CSS, Leaflet, Recharts, Radix UI, clsx, Lucide, React Router DOM   | Vercel, ESLint             |

---

## ⚙️ Features

- 🔄 Real-time occupancy monitoring via **Server-Sent Events (SSE)**
- 🌡️ Smart heating logic based on **class schedules + real-time data**
- 🗺️ Interactive heatmap using **Leaflet + Heatmap plugin**
- 📊 Dynamic analytics dashboard with **Recharts**
- ⚡ Fast and responsive UI with **Next.js + Tailwind CSS**
- 🧪 Backend visualization tools using **Matplotlib**

---

## 📦 Installation

### ✅ Prerequisites

- Node.js ≥ 18  
- Python ≥ 3.9  
- PostgreSQL  
- npm / pip

### 📥 Clone the Repository

```bash
git clone https://github.com/oussenn/CapstoneProject.git
cd CapstoneProject
````

---

## 🔧 Backend Setup (`buildocc-bend`)

```bash
cd buildocc-bend
python3 -m venv venv
source venv/bin/activate         # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Make sure your PostgreSQL server is running and configured properly.

---

## 🌐 Frontend Setup (`buildocc`)

```bash
cd buildocc
npm install
npm run dev
```

Navigate to `http://localhost:3000` to access the app.

---

## 🏗 Folder Structure Details

### `buildocc-bend/`

* `app.py`: Main FastAPI app entry point
* `db/`: PostgreSQL connection logic
* `routes/`: API endpoints
* `sse/`: Real-time update mechanisms
* `static/`: Static files served to the frontend
* `utils/`: Visualization logic with NumPy/Matplotlib

### `buildocc/`

* `pages/`: Next.js routes and pages
* `components/`: React components (charts, tabs, controls)
* `styles/`: Tailwind + PostCSS configurations
* `public/`: Static assets
* `lib/`: Reusable frontend logic (e.g., fetching SSE)

---

## 📅 Roadmap

* [x] Class schedule integration via PostgreSQL
* [x] Occupancy dashboard and real-time heatmap
* [x] Backend streaming with SSE
* [ ] Sensor-based occupancy via Arduino
* [ ] Comparative analysis of heating modes
* [ ] Thermodynamic calculations based on room size
* [ ] API integration with GoCampus app

---

## 📘 Academic Background

This system was built as a capstone project at **Al Akhawayn University** with the following objective:

> **“To optimize campus energy usage by intelligently regulating indoor heating based on occupancy patterns and environmental data.”**

**Supervisor**: Dr. Moulay El Hassan El Azhari
**Co-supervisor**: Dr. Ahmed Fiaz
**Project Lead**: Oussama Ennaciri

---

## 📜 License

This project is for academic and research use. For commercial use, please contact the author.

---

## 🙌 Acknowledgements

* Dr. Moulay El Hassan El Azhari – for mentorship and guidance
* Dr. Ahmed Fiaz – for co-supervision and technical feedback
* The Computer Science and Engineering faculty
* All peers who provided valuable insights during testing

---

## ✉️ Contact

**Oussama Ennaciri**
o.ennaciri@aui.ma
📍 Al Akhawayn University
