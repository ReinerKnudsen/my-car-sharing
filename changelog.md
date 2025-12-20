# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Major: "breaking", "remove", "major" → bumps major version (1.0.0 → 2.0.0)
Minor: "add", "feature", "new" → bumps minor version (1.0.0 → 1.1.0)
Patch: Everything else → bumps patch version (1.0.0 → 1.0.1)

## [Unreleased]

### Added

-

### Changed

- Dashboard in Komponenten zerlegt und damit vereinfacht

### Fixed

-

## [2.3.0] - 2025-12-20

### Added

- add Differenzfahrten werden richtig angelegt
- add Differenzfahrten werden richtig angezeigt
- add Differenzfahrten können übernommen werden

## [2.2.0] - 2025-12-19

### Added

- add Skeletons beim Laden der Daten beim Start der App
- add DataContext für das lokale Halten von Daten in der Session

### Fixed

- nur noch die absolut letzte Fahrt kann gelöscht werden.

## [2.1.7] - 2025-12-19

### Changed

- updated the Readme.md with the latest changes

## [2.1.6] - 2025-12-17

### Fixed

- Cache busting für App Version

## [2.1.5] - 2025-12-17

### Fixed

- Fehler beim Abschicken des Einladungscodes behoben (dynamischer import im Code)

## [2.1.4] - 2025-12-17

### Changed

- github flow will sync back the resetted changelog from main to dev;

## [2.1.3] - 2025-12-17

### Changed

- updated th github flow for better deployment

## [2.1.2] - 2025-12-16

### Changed

- another change to the workflow

## [2.1.1] - 2025-12-16

### Changed

- changed generate-version.js
- changed the AppVersion component

## [2.1.0] - 2025-12-16

### Changed

- added generate-version.js
- added prebuild script to package.json
- altered the AppVersion component

## [2.0.3] - 2025-12-16

### Fixed

- updated toml file
- Version in profille page

## [2.0.0] - 2025-12-16

### Added

- major

## [1.0.0] - 2025-12-16

### Added

- Initial release of CarSharing app
- User authentication and registration with invitation codes
- Group management (Admin, Group Admin, regular users)
- Trip tracking with automatic cost calculation
- Booking system with calendar view
- Receipt management system
- Group account with balance tracking
- PayPal SDK integration for payments
- Admin settings for cost rates and PayPal configuration
- PWA support with iOS/Android icons
- Row Level Security (RLS) for secure data access
- Automatic group admin assignment for first user
- User blocking functionality
- Receipt types management

### Changed

-

### Deprecated

-

### Removed

-

### Fixed

-

### Security

-

[Unreleased]: https://github.com/username/my-carsharing/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/username/my-carsharing/releases/tag/v1.0.0
