Eine moderne Finanztracking-App mit Angular Frontend und NestJS Backend.

![Angular](https://img.shields.io/badge/Angular-20-red)
![NestJS](https://img.shields.io/badge/NestJS-10-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🚀 Features

- ✅ Transaktionen hinzufügen (Einnahmen/Ausgaben)
- ✅ Visuelle Darstellung mit Charts (NgxCharts)
- ✅ Transaktionen löschen
- ✅ Responsive Design für Mobile & Desktop
- ✅ TypeScript für Type Safety
- ✅ Real-time Updates

## 🛠️ Tech Stack

**Frontend:**
- Angular 20
- NgxCharts für Visualisierung
- SCSS für Styling
- TypeScript
- Reactive Forms

**Backend:**
- NestJS
- TypeORM
- SQLite Database
- TypeScript

## 📁 Projektstruktur

```
Finanztracker/
├── backend/          # NestJS Backend
│   ├── src/
│   │   ├── transactions/
│   │   └── main.ts
│   ├── package.json
│   └── ...
├── frontend/         # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── models/
│   │   └── ...
│   ├── package.json
│   └── ...
├── README.md
└── .gitignore
```

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 oder höher)
- npm oder yarn

### 1. Repository klonen
```bash
git clone https://github.com/NicoSchumm/finanztracker.git
cd finanztracker
```

### 2. Backend starten
```bash
cd backend
npm install
npm run start:dev
```

### 3. Frontend starten
```bash
cd frontend
npm install
ng serve
```

## 🌐 URLs

- **Frontend:** http://localhost:4200
- **Backend API:** http://localhost:3000

## 📝 API Endpoints

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/transactions` | Alle Transaktionen abrufen |
| POST | `/transactions` | Neue Transaktion erstellen |
| DELETE | `/transactions/:id` | Transaktion löschen |

## 🎯 Aktuelle Features

- [x] **Dashboard** - Übersicht aller Transaktionen
- [x] **Transaktionen erstellen** - Income/Expense mit Validierung
- [x] **Chart-Visualisierung** - Bar Chart mit NgxCharts
- [x] **Delete-Funktionalität** - Transaktionen löschen
- [x] **Responsive Design** - Mobile & Desktop optimiert
- [x] **Form Validation** - Client-side Validierung

## 🚧 Geplante Features

- [ ] 📂 Kategorien für Transaktionen
- [ ] 🔍 Filter und Suche
- [ ] 📊 Export-Funktionalität (CSV/PDF)
- [ ] 📱 PWA Features für Mobile App
- [ ] 🌙 Dark Theme
- [ ] 💱 Mehrere Währungen
- [ ] 💰 Budgets und Limits
- [ ] 📈 Erweiterte Charts (Pie, Line)

## 🖼️ Screenshots

_Screenshots werden bald hinzugefügt_

## 🤝 Entwicklung

### Git Workflow
```bash
# Neue Änderungen hinzufügen
git add .
git commit -m "✨ Add new feature: [Beschreibung]"
git push origin main
```

### Code Standards
- TypeScript für Frontend und Backend
- ESLint für Code Quality
- Prettier für Code Formatting
- Angular Style Guide für Frontend
- NestJS Best Practices für Backend
