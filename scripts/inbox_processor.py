#!/usr/bin/env python3
"""
=============================================================================
SOVEREIGN INBOX PROCESSOR
=============================================================================
Runs at end of each day (via /sovereign_shutdown workflow).
Scans /home/james/sovereign_inbox/ for unprocessed daily_* folders,
classifies each file by type/content, routes it to its proper destination
in the Sovereign OS, and generates a routing summary.

Usage:
    python3 scripts/inbox_processor.py
    python3 scripts/inbox_processor.py --dry-run     (preview only, no moves)
    python3 scripts/inbox_processor.py --day 06052026 (process specific day)

ROUTING TABLE:
    Session exports (Gemini/Claude .md)  → dna/archives/sessions/
    Persona/character instruction .md    → dna/vault/personas/
    NotebookLM exports                   → dna/notebook_lm_exports/
    Game log exports                     → dna/archives/game_logs/
    Plain .txt notes                     → dna/vault/notes/
    Images (.jpg/.png/.webp/.gif)        → media_vault/01_Assets/Inbox/
    Video (.mp4/.mov)                    → media_vault/01_Assets/Video/Inbox/
    PDFs                                 → dna/vault/documents/
    JSON data files                      → dna/vault/data/
    Python/JS/TS scripts                 → _archive/scratch_scripts/inbox/
    Unrecognized                         → sovereign_inbox/needs_review/
=============================================================================
"""

import os
import sys
import shutil
import argparse
from datetime import datetime
from zoneinfo import ZoneInfo
from pathlib import Path

def get_local_now():
    return datetime.now(ZoneInfo("America/New_York"))

def get_local_date():
    return get_local_now().date()

# ── Path constants ──────────────────────────────────────────────────────────
INBOX_ROOT     = Path("/home/james/sovereign_inbox")
SOVEREIGN_ROOT = Path("/home/james/SovereignOS")
DNA            = SOVEREIGN_ROOT / "dna"
MEDIA_VAULT    = SOVEREIGN_ROOT / "media_vault"

DESTINATIONS = {
    "sessions":    DNA / "archives" / "sessions",
    "personas":    DNA / "vault" / "personas",
    "notebooklm":  DNA / "notebook_lm_exports",
    "game_logs":   DNA / "archives" / "game_logs",
    "notes":       DNA / "vault" / "notes",
    "documents":   DNA / "vault" / "documents",
    "data":        DNA / "vault" / "data",
    "images":      MEDIA_VAULT / "01_Assets" / "Inbox",
    "video":       MEDIA_VAULT / "01_Assets" / "Video" / "Inbox",
    "scripts":     SOVEREIGN_ROOT / "_archive" / "scratch_scripts" / "inbox",
    "needs_review": INBOX_ROOT / "needs_review",
}

# ── Content-based classification signals ────────────────────────────────────
SESSION_SIGNALS   = ["## Prompt:", "## Response:", "Exported:", "gemini.google.com",
                     "claude.ai", "Antigravity", "Dr. Kosmos"]
PERSONA_SIGNALS   = ["persona", "character", "system instruction", "you are a",
                     "Sovereign DNA", "dr_kosmos", "mean_gene", "uncle_stevie"]
GAME_LOG_SIGNALS  = ["auto_export_", "inning", "at_bat", "FanStack", "game_log",
                     "chatbots_sys", "persona_relay"]
NOTEBOOKLM_SIGNALS = ["notebooklm", "notebook_lm", "NotebookLM"]


def classify_file(filepath: Path) -> str:
    """Classify a file and return the routing destination key."""
    name  = filepath.name.lower()
    ext   = filepath.suffix.lower()

    # ── Extension-based fast path ──
    if ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".jfif"):
        return "images"
    if ext in (".mp4", ".mov", ".avi", ".mkv"):
        return "video"
    if ext == ".pdf":
        return "documents"
    if ext in (".py", ".js", ".ts", ".tsx", ".sh"):
        return "scripts"
    if ext == ".json":
        return "data"
    if ext == ".txt":
        return "notes"

    # ── Markdown: content-based routing ──
    if ext == ".md":
        # Check filename first for quick wins
        for sig in NOTEBOOKLM_SIGNALS:
            if sig.lower() in name:
                return "notebooklm"
        for sig in GAME_LOG_SIGNALS:
            if sig.lower() in name:
                return "game_logs"

        # Read first 3KB for content signals (avoid reading huge files fully)
        try:
            with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                sample = f.read(3072)
        except Exception:
            return "needs_review"

        sample_lower = sample.lower()

        for sig in NOTEBOOKLM_SIGNALS:
            if sig.lower() in sample_lower:
                return "notebooklm"
        for sig in SESSION_SIGNALS:
            if sig in sample:
                return "sessions"
        for sig in GAME_LOG_SIGNALS:
            if sig.lower() in sample_lower:
                return "game_logs"
        for sig in PERSONA_SIGNALS:
            if sig.lower() in sample_lower:
                return "personas"

        # Generic markdown — treat as a note
        return "notes"

    # ── Catch-all ──
    return "needs_review"


def safe_move(src: Path, dest_dir: Path, dry_run: bool = False) -> Path:
    """
    Move src to dest_dir. Handles filename collisions with a counter suffix.
    Returns the final destination path.
    """
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest = dest_dir / src.name

    # Collision handling — never overwrite
    counter = 1
    while dest.exists():
        stem   = src.stem
        suffix = src.suffix
        dest   = dest_dir / f"{stem}_{counter:02d}{suffix}"
        counter += 1

    if not dry_run:
        shutil.move(str(src), str(dest))

    return dest


def process_daily_folder(daily_dir: Path, dry_run: bool = False) -> dict:
    """Process a single daily_* folder. Returns routing summary dict."""
    summary = {
        "folder":    daily_dir.name,
        "processed": 0,
        "skipped":   0,
        "routes":    {},
        "files":     [],
    }

    files = [f for f in daily_dir.rglob("*") if f.is_file()]
    if not files:
        return summary

    for fpath in sorted(files):
        dest_key  = classify_file(fpath)
        dest_dir  = DESTINATIONS[dest_key]
        dest_path = safe_move(fpath, dest_dir, dry_run=dry_run)

        summary["files"].append({
            "file":        fpath.name,
            "destination": dest_key,
            "moved_to":    str(dest_path),
        })
        summary["routes"][dest_key] = summary["routes"].get(dest_key, 0) + 1
        summary["processed"] += 1

    # Remove empty daily folder after processing
    if not dry_run:
        try:
            daily_dir.rmdir()
        except OSError:
            pass  # Non-empty subdirs remain — that's fine

    return summary


def generate_report(summaries: list, dry_run: bool) -> str:
    """Generate a human-readable routing report."""
    mode   = "[DRY RUN] " if dry_run else ""
    ts     = get_local_now().strftime("%Y-%m-%d %H:%M")
    lines  = [
        f"# {mode}Sovereign Inbox Processing Report",
        f"**Run:** {ts}",
        "",
    ]

    total_files = sum(s["processed"] for s in summaries)
    lines.append(f"**Total files routed:** {total_files}")
    lines.append("")

    for s in summaries:
        lines.append(f"## 📂 {s['folder']} ({s['processed']} files)")
        if not s["routes"]:
            lines.append("  _(empty — skipped)_")
            continue
        for dest, count in sorted(s["routes"].items()):
            lines.append(f"  - `{dest}`: {count} file(s)")
        lines.append("")

    if total_files == 0:
        lines.append("_Nothing to process. Inbox is clean._")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Sovereign Inbox Processor")
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview routing without moving any files")
    parser.add_argument("--day", type=str, default=None,
                        help="Process a specific day folder (e.g. 06052026)")
    args = parser.parse_args()

    print(f"🗂️  Sovereign Inbox Processor {'[DRY RUN]' if args.dry_run else ''}")
    print(f"    Inbox: {INBOX_ROOT}")
    print()

    today_str = get_local_date().strftime("%m%d%Y")  # mmddyyyy to match naming

    # Find daily folders to process
    if args.day:
        candidates = [INBOX_ROOT / f"daily_{args.day}"]
    else:
        # All daily_* folders EXCEPT today's (don't process mid-day)
        candidates = sorted([
            d for d in INBOX_ROOT.iterdir()
            if d.is_dir()
            and d.name.startswith("daily_")
            and d.name != f"daily_{today_str}"
            and d.name != "today"
            and d.name != "processed"
            and d.name != "needs_review"
        ])

    if not candidates:
        print("✅ Nothing to process — inbox is clean.")
        return

    summaries = []
    for daily_dir in candidates:
        if not daily_dir.exists():
            print(f"  ⚠️  {daily_dir.name} not found — skipping")
            continue
        print(f"  📅 Processing {daily_dir.name}...")
        summary = process_daily_folder(daily_dir, dry_run=args.dry_run)
        summaries.append(summary)
        print(f"     → {summary['processed']} files routed")

    # Generate and save report
    report = generate_report(summaries, dry_run=args.dry_run)
    print()
    print(report)

    if not args.dry_run:
        report_path = INBOX_ROOT / "processed" / f"report_{get_local_now().strftime('%Y%m%d_%H%M')}.md"
        report_path.parent.mkdir(parents=True, exist_ok=True)
        report_path.write_text(report, encoding="utf-8")
        print(f"\n📄 Report saved: {report_path}")

        # Refresh today/ symlink to today's actual daily folder
        today_folder = INBOX_ROOT / f"daily_{get_local_date().strftime('%m%d%Y')}"
        today_folder.mkdir(exist_ok=True)
        today_link = INBOX_ROOT / "today"
        if today_link.exists() or today_link.is_symlink():
            today_link.unlink()
        today_link.symlink_to(today_folder.name)  # relative symlink
        print(f"🔗 today/ → {today_folder.name}")


if __name__ == "__main__":
    main()
