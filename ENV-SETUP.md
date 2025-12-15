# 🔧 Environment Setup - DEV vs PROD

## 📋 .env Konfiguration

### **Development (.env oder .env.local):**

```bash
# App Environment
VITE_APP_ENV=development

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### **Production (.env.production):**

```bash
# App Environment
VITE_APP_ENV=production

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🎯 Was wird unterschieden:

### 1. **Dashboard Header**

- **DEV:** "My CarSharing (DEV)"
- **PROD:** "My CarSharing"

→ Automatisch via `VITE_APP_ENV`

### 2. **HomeScreen Icon Label** (iOS/Android)

#### **Manuell anpassen:**

**Für DEV - `public/manifest.json`:**

```json
{
  "short_name": "CarSharing (DEV)",
  "name": "CarSharing App (DEV)",
  ...
}
```

**Für PROD - `public/manifest.json`:**

```json
{
  "short_name": "CarSharing",
  "name": "CarSharing App",
  ...
}
```

### 3. **Browser Tab Title**

#### **Manuell anpassen:**

**Für DEV - `index.html`:**

```html
<title>CarSharing (DEV)</title>
```

**Für PROD - `index.html`:**

```html
<title>CarSharing</title>
```

---

## 🚀 Build Commands:

```bash
# Development Build
npm run build

# Production Build (mit .env.production)
npm run build -- --mode production
```

---

## 💡 Workflow-Empfehlung:

### **Lokale Entwicklung:**

1. `.env` → `VITE_APP_ENV=development`
2. `manifest.json` → `"CarSharing (DEV)"`
3. `index.html` → `<title>CarSharing (DEV)</title>`

### **Production Deployment:**

1. **VOR dem Build:**
   - `manifest.json` → `"CarSharing"`
   - `index.html` → `<title>CarSharing</title>`
2. **Build mit:** `npm run build -- --mode production`
3. **Deployen**

### **Oder: Branch-basiert:**

- `main` Branch → Production (normale Namen)
- `dev` Branch → Development (mit DEV-Suffix)

---

## ⚡ Quick Scripts (optional):

Erstelle in `package.json`:

```json
{
  "scripts": {
    "build:dev": "vite build",
    "build:prod": "vite build --mode production",
    "prepare:dev": "node scripts/prepare-dev.js",
    "prepare:prod": "node scripts/prepare-prod.js"
  }
}
```

Dann:

```bash
npm run prepare:dev && npm run build:dev
npm run prepare:prod && npm run build:prod
```
