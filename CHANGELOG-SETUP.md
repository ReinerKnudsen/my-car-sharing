# 📋 Changelog Automation Setup

Dieses Projekt verwendet ein automatisiertes Changelog-System basierend auf [Keep a Changelog](https://keepachangelog.com/) und [Semantic Versioning](https://semver.org/).

---

## 🎯 **Wie es funktioniert**

### **1. Pre-Commit Hook (Git Hook)**
Jedes Mal wenn du versuchst zu committen:
- ✅ Prüft ob `changelog.md` staged ist
- ❌ Blockiert den Commit falls nicht
- 📝 Öffnet die Changelog-Datei automatisch

**Beispiel:**
```bash
git add src/pages/Dashboard.tsx
git commit -m "fix: dashboard loading issue"

# Output:
🚨 Changelog not updated!
📝 Opening changelog.md for you to edit...

✏️  Please update the changelog, save it, then run:
   git add changelog.md
   git commit
```

### **2. Changelog pflegen**
In `changelog.md` trägst du deine Änderungen ein:

```markdown
## [Unreleased]

### Added
- neues Feature X

### Changed
- Dashboard UI verbessert

### Fixed
- Buchungsformular validiert jetzt korrekt
```

**Kategorien:**
- `### Added` - Neue Features
- `### Changed` - Änderungen an bestehendem Code
- `### Fixed` - Bug-Fixes
- `### Deprecated` - Bald entfernt
- `### Removed` - Entfernt
- `### Security` - Sicherheits-Updates

### **3. Automatische Versionierung**
Die GitHub Actions erkennen automatisch den Typ des Updates:

| **Keywords in Changelog** | **Version Bump** | **Beispiel** |
|---------------------------|------------------|--------------|
| `breaking`, `remove`, `major` | Major (1.0.0 → 2.0.0) | Breaking Changes |
| `add`, `feature`, `new` | Minor (1.0.0 → 1.1.0) | Neue Features |
| Alles andere | Patch (1.0.0 → 1.0.1) | Bug-Fixes |

---

## 🚀 **Workflow**

### **Normaler Commit:**
```bash
# 1. Mache deine Code-Änderungen
git add src/pages/Dashboard.tsx

# 2. Versuche zu committen
git commit -m "fix: dashboard bug"

# 3. Pre-commit Hook blockiert → changelog.md wird geöffnet

# 4. Füge Eintrag hinzu:
## [Unreleased]
### Fixed
- Dashboard zeigt jetzt alle Fahrten korrekt an

# 5. Stage changelog und committe erneut
git add changelog.md
git commit -m "fix: dashboard bug"

# ✅ Commit erfolgreich!
```

### **Pull Request erstellen:**
```bash
# 1. Push deinen Branch
git push origin feature/dashboard-fix

# 2. Erstelle PR auf GitHub
# → Der GitHub Workflow "pr-changelog.yml" läuft automatisch
# → Die PR-Beschreibung wird mit deinen Changelog-Einträgen aktualisiert
```

### **Pull Request mergen:**
```bash
# Wenn der PR in main gemerged wird:
# 1. GitHub Workflow "changelog-automation.yml" läuft
# 2. Script analysiert Unreleased-Einträge
# 3. Bestimmt Version-Bump (major/minor/patch)
# 4. Aktualisiert package.json und changelog.md
# 5. Erstellt Git-Tag (z.B. v1.1.0)
# 6. Erstellt GitHub Release mit Release Notes
```

---

## 📁 **Dateistruktur**

```
my-carsharing/
├── changelog.md                    # Changelog-Datei (MANUELL PFLEGEN!)
├── package.json                    # Version wird automatisch aktualisiert
├── scripts/
│   ├── update-changelog.js         # Automatische Versionierung
│   ├── test-changelog.js           # Test-Script
│   └── pr-description-updater.js   # PR-Beschreibung aktualisieren
├── .github/
│   └── workflows/
│       ├── changelog-automation.yml # Läuft bei Merge
│       └── pr-changelog.yml         # Läuft bei PR-Erstellung
└── .git/
    └── hooks/
        └── pre-commit              # Zwingt Changelog-Update
```

---

## 🧪 **Testen**

### **Changelog Automation testen:**
```bash
npm run changelog:test
```

**Output:**
```
🧪 Testing Changelog Automation Functions

1. Testing version increment:
  1.0.0 + patch = 1.0.1
  1.0.0 + minor = 1.1.0
  1.0.0 + major = 2.0.0

2. Testing version bump determination:
  "- fixed bug in login" → patch (expected: patch)
  "- added new feature" → minor (expected: minor)
  "- breaking change: removed old API" → major (expected: major)

3. Testing with current changelog:
  Unreleased entries found:
    Added: 2 items
    Changed: 1 items
    Fixed: 1 items
    Suggested bump type: minor
    Current version: 1.0.0
    New version would be: 1.1.0
```

### **Changelog Update manuell ausführen:**
```bash
npm run changelog:update
```

---

## ⚙️ **Konfiguration**

### **Branch ändern:**
Standardmäßig läuft die Automation auf dem `main`-Branch.

In `.github/workflows/changelog-automation.yml` und `.github/workflows/pr-changelog.yml`:
```yaml
on:
  pull_request:
    branches: [main]  # ← Hier ändern (z.B. zu [dev])
```

### **Pre-Commit Hook deaktivieren:**
```bash
# Temporär:
git commit --no-verify -m "message"

# Permanent:
rm .git/hooks/pre-commit
```

### **Editor anpassen:**
In `.git/hooks/pre-commit`:
```bash
# Nutzt automatisch:
# 1. windsurf (wenn installiert)
# 2. cursor (wenn installiert)
# 3. $EDITOR (Fallback)
# 4. nano (Fallback)
```

---

## 📊 **Changelog-Format**

```markdown
# Changelog

## [Unreleased]

### Added
- neue Feature-Beschreibung

### Changed
- Änderung-Beschreibung

### Fixed
- Bug-Fix-Beschreibung

## [1.2.0] - 2025-12-16

### Added
- Feature X wurde hinzugefügt
- Feature Y wurde implementiert

### Fixed
- Bug Z wurde behoben
```

---

## 🔄 **Semantic Versioning**

```
Version: MAJOR.MINOR.PATCH
Beispiel: 2.1.3

MAJOR (2.x.x)
  - Breaking Changes
  - Inkompatible API-Änderungen
  - Keyword: "breaking", "remove", "major"

MINOR (x.1.x)
  - Neue Features (rückwärtskompatibel)
  - Keyword: "add", "feature", "new"

PATCH (x.x.3)
  - Bug-Fixes (rückwärtskompatibel)
  - Standard für alle anderen Änderungen
```

---

## 🎉 **Vorteile**

✅ **Automatische Versionierung** - Keine manuellen Version-Updates  
✅ **Konsistente Changelogs** - Strukturiert nach Keep a Changelog  
✅ **GitHub Releases** - Automatisch erstellt mit Release Notes  
✅ **PR-Integration** - Changelog direkt in PR-Beschreibung  
✅ **Erzwungene Dokumentation** - Pre-Commit Hook verhindert vergessene Einträge  
✅ **Semantic Versioning** - Automatische Version-Bumps basierend auf Keywords  

---

## 🛠️ **Troubleshooting**

### **Pre-Commit Hook funktioniert nicht:**
```bash
# Hook ausführbar machen:
chmod +x .git/hooks/pre-commit

# Hook testen:
.git/hooks/pre-commit
```

### **GitHub Actions schlagen fehl:**
```bash
# Lokal testen:
npm run changelog:test

# @octokit/rest installieren:
npm install --save-dev @octokit/rest
```

### **Version stimmt nicht:**
```bash
# Manuell korrigieren in package.json
"version": "1.2.3"

# Dann changelog.md aktualisieren
## [1.2.3] - 2025-12-16
```

---

## 📚 **Weitere Ressourcen**

- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Git Hooks](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)

---

**Happy Coding! 🚗💨**

