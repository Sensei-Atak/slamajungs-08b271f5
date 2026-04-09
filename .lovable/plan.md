

# Slama Jama Gröbenzell — Jugend-Basketball Team App

## Overview
A German-language web app for a youth basketball team with two roles (Coach & Spieler), built on React + Supabase. Clean, modern design inspired by Linear/Notion with primary color #5BAFD6.

## Design System Setup
- Load Inter font from Google Fonts
- Set primary color to #5BAFD6, backgrounds white/#F5F5F5, 8px border radius
- Responsive layout: sidebar nav on desktop, bottom nav bar on mobile
- All UI text in German

## Database Schema (Supabase)
- **profiles** — id, role (coach/spieler), name, jersey_number, position, avatar_url, is_active
- **meals** — id, user_id, image_url, caption, created_at
- **tasks** — id, title, description, created_by, is_closed, created_at
- **task_submissions** — id, task_id, player_id, video_url, submitted_at
- **games** — id, date, opponent, score_home, score_away, created_at
- **player_stats** — id, game_id, player_id, pts_override, fw_made, fw_attempted, twop_made, twop_attempted, threep_made, threep_attempted, reb, ast, blk, stl, to_count, fouls
- Storage buckets: `meal-photos`, `task-videos`
- RLS policies per spec (meals readable by all, deletable by owner/coach; task videos only visible to submitter + coach; stats readable by all, writable by coach only)

## Authentication
- Email/password login page (German labels)
- No self-registration — Coach creates all player accounts
- Password reset via Supabase
- Role-based navigation after login

## Navigation
- **Coach**: Feed | Aufgaben | Statistiken | Verwaltung | Mein Profil
- **Spieler**: Feed | Aufgaben | Statistiken | Mein Profil

## Feature 1: Mahlzeiten-Feed
- Scrollable feed of meal photo cards (newest first) with avatar, name, timestamp, photo, caption
- "Mahlzeit posten" button → photo upload + optional caption → publish
- Players delete own posts; Coach deletes any post
- Empty state with friendly German message

## Feature 2: Aufgaben-System
- **Players**: Two tabs (Offen / Abgegeben), upload video to complete tasks
- **Coach**: Create tasks (title + description), close tasks (marks non-submitters as "verpasst"), delete tasks
- Per-task submission status view for Coach (submitted / not submitted / missed)
- "Verpasste Abgaben" overview table in Verwaltung (player name, total tasks, submitted, missed, rate %)

## Feature 3: Spielstatistiken
- **Live Input Screen** (iPad-optimized, landscape, single screen): Player grid with stat columns (PTS auto-calc, FW, 2P, 3P, REB, AST, BLK, STL, TO, F) with +/- buttons (44px min), game info bar with date/opponent/score, "Spiel beenden & speichern" button
- **Game Summary Page**: Full stat table per game, "Bearbeiten" to re-enter live input
- **Player Stats Profile** (visible to all): Per-game stats table + season averages (PPG, RPG, APG, etc.)
- **Team Stats Overview** (visible to all): All players' season averages, sortable by column

## Verwaltung (Coach Only)
- Player management: list, add (name/jersey/position/email/password), deactivate, delete
- Game management: list past games, view stats, delete with confirmation

## Pages Summary
1. Login (with "Passwort vergessen")
2. Feed (Mahlzeiten)
3. Aufgaben (tasks)
4. Statistiken (team overview + player profiles + live input + game summary)
5. Verwaltung (Coach only — players + games + verpasste Abgaben)
6. Mein Profil

