# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-03-10

### Added

- Retro cassette deck UI with tape rack and transport controls
- Theme toggle, keyboard shortcuts, queue management, and favorites
- Visualizer, VU meters, tempo control, loop control, and WAV export
- Radio mode with pre-generated RJ transition announcements
- Tune editor and persistent local storage hooks
- RJ generation scripts and local Kokoro helper server script
- Automated test suite with Vitest

### Changed

- Tunes are loaded dynamically from `public/tunes/manifest.json` with static seed fallback
- Audio routing includes EQ, master gain, analyzer, and export capture path
- Project metadata aligned to AGPL-3.0-or-later licensing
