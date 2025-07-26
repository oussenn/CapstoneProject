Here's a comprehensive `README.md` tailored for your GitHub repository, clearly documenting both the backend (`buildocc-bend`) and frontend (`buildocc`) parts of your capstone project:

---

```markdown
# 🧠 Dynamic Smart Heating Control with Real-Time Occupancy Monitoring System

A full-stack smart building control system that dynamically adjusts heating across campus buildings based on real-time occupancy data and class schedules. Built as part of a capstone project, this system improves energy efficiency through intelligent, data-driven decisions.

---

## 📁 Repository Structure

```

.
├── buildocc-bend     # Backend (FastAPI, PostgreSQL, SSE)
└── buildocc          # Frontend (Next.js, React, Tailwind CSS, Leaflet)

````

---

## 🔧 Backend - `buildocc-bend`

**Language**: Python  
**Entry Point**: `python app.py`

### 🛠 Frameworks & Libraries
- **[FastAPI](https://fastapi.tiangolo.com/)**: High-performance web framework for building APIs.
- **[Uvicorn](https://www.uvicorn.org/)**: ASGI server used to run the FastAPI app.
- **[psycopg[binary]](https://www.psycopg.org/)**: PostgreSQL database adapter.
- **[sse-starlette](https://github.com/sysid/sse-starlette)**: Server-Sent Events support for FastAPI.
- **[matplotlib](https://matplotlib.org/)**: Data visualization and plotting.
- **[numpy](https://numpy.org/)**: Scientific computing and numerical operations.

### 🗃 Database
- **PostgreSQL**: Stores class schedules, room data, and simulated/real-time occupancy levels.

### ⚙️ Features
- Real-time occupancy data streaming using **Server-Sent Events (SSE)**.
- Static file serving using `StaticFiles`.
- Database querying and integration with frontend dashboards.
- Supports simulation logic for testing occupancy modes.

---

## 💻 Frontend - `buildocc`

**Languages**: TypeScript, JavaScript  
**Framework**: Next.js (React-based)

### 🎨 Frameworks & Libraries
- **[Next.js](https://nextjs.org/)**: React-based framework for SSR/SSG and dynamic routing.
- **[React](https://reactjs.org/)**: UI library for building interactive dashboards.
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first CSS framework.
- **[PostCSS](https://postcss.org/)**: CSS transformation tool used with Tailwind.
- **[Leaflet](https://leafletjs.com/)** + **[react-leaflet](https://react-leaflet.js.org/)**: Map rendering and geospatial data visualization.
- **[leaflet.heat](https://github.com/Leaflet/Leaflet.heat)**: Heatmap plugin for Leaflet.
- **[Recharts](https://recharts.org/en-US/)**: Charting components built with React.
- **[@radix-ui/react-tabs](https://www.radix-ui.com/primitives/docs/components/tabs)**: Unstyled tab interface primitives.
- **`class-variance-authority`, `clsx`, `tailwind-merge`**: Utility libraries for managing `className`s and Tailwind composition.
- **[lucide-react](https://lucide.dev/)**: Icon library.
- **[react-router-dom](https://reactrouter.com/)**: Client-side routing.

### 🛠 Development Tools
- **TypeScript**: Static typing for better code maintainability.
- **ESLint**: Code linting and formatting.
- **Tailwind Animate**: Animation utilities for Tailwind.
- **PostCSS + Tailwind config**: Fully customizable styling.
- **@shadcn/ui**: (Dev dependency) Component styling library.

### 🌐 Deployment
- **Vercel** (Recommended): Seamless deployment of Next.js apps.
- Uses `next/font` for automatic font optimization and performance.

---

## 🚀 Features

- 📡 **Real-time occupancy monitoring** with data pushed from the backend via SSE.
- 🌍 **Interactive building heatmaps** for visualizing density of students in rooms.
- 📈 **Dynamic dashboards** showing scheduled classes, energy usage trends, and occupancy stats.
- ⚙️ **Smart control logic** that adjusts heating based on predicted vs. actual room use.
- 🛠 Designed with extensibility in mind: sensor integration, mobile app support, etc.

---

## 📊 Project Architecture Summary

| Layer     | Language(s)        | Frameworks & Libraries                                                              | Tools & Technologies          |
|-----------|--------------------|--------------------------------------------------------------------------------------|-------------------------------|
| Backend   | Python              | FastAPI, Uvicorn, psycopg, SSE, matplotlib, numpy                                   | PostgreSQL, StaticFiles       |
| Frontend  | TypeScript, JS      | Next.js, React, Tailwind, Leaflet, Recharts, Radix UI, clsx, lucide-react, etc.     | Vercel, ESLint, Tailwind CSS  |

---

## 🧪 Local Development

### 🐍 Backend
```bash
cd buildocc-bend
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
python app.py
````

### 🌐 Frontend

```bash
cd buildocc
npm install
npm run dev
```

---

## 🎓 About the Capstone Project

This project was developed as part of a senior engineering capstone titled:

**"Smart Heating Control System: Optimizing Energy Usage through Real-time Occupancy and Environmental Data Analysis"**

Supervised by **Dr. Moulay El Hassan El Azhari**
Co-supervised by **Dr. Ahmed Fiaz**

It is designed for deployment on university campuses to optimize building energy usage, reduce emissions, and improve environmental efficiency using real-time data streams and historical scheduling.

---

## 🧠 Future Enhancements

* Integration with **GoCampus API** for live occupancy feed.
* Deployment of **sensor arrays** for real-time room detection.
* **Mobile app** version for live monitoring by admins.
* Support for **machine learning** models to predict room usage patterns.

---

## 📄 License

This project is for academic use only. For commercial licensing, please contact the author.

---

## ✨ Acknowledgements

Special thanks to:

* **Dr. Moulay El Hassan El Azhari** (Supervisor)
* **Dr. Ahmed Fiaz** (Co-supervisor)
* All faculty, colleagues, and testers who contributed feedback

---

## 🙋‍♂️ Author

**Oussama Ennaciri**
📍 Al Akhawayn University
💡 Passionate about smart systems, real-time applications, and energy-efficient solutions.

---
