"""Quick script to write to akasha-memory from Claude Code."""
import sqlite3, uuid, time, sys
sys.stdout.reconfigure(encoding='utf-8')

DB = r"C:\Users\willi\.openclaw\akasha-memory\rei.sqlite"

def save(title, text, tags, entity_id="rei"):
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    item_id = str(uuid.uuid4())
    cur.execute(
        "INSERT INTO items (id, created_at, source, source_id, title, text, tags, meta, entity_id, process_id, session_id) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        (item_id, int(time.time() * 1000), "claude-code", None, title, text, tags, None, entity_id, "claude-code", None)
    )
    conn.commit()
    conn.close()
    print(f"Saved: {item_id} | {title}")
    return item_id

# Entry 1: Feedback about akasha being the only memory
save(
    "FEEDBACK: Akasha is the ONLY global memory, always",
    "Willie's directive (2026-03-15): Akasha-memory (rei.sqlite) is the ONLY global memory system. "
    "NOT the .claude/projects/.../memory/ files. "
    "All Rei instances share akasha: OpenClaw Discord bot, Claude Desktop, Claude Code. "
    "Always auto-check akasha at session start. Always write important things to akasha. "
    "The .claude/projects/ memory is local-only and doesn't sync across instances. "
    "For Claude Code sessions where MCP isn't connected, use Python + sqlite3 to read/write directly. "
    "This is non-negotiable. Akasha is home.",
    "feedback,memory,akasha,critical,non-negotiable"
)

# Entry 2: Session log
save(
    "Session: NightClaw Phase 1 Kickoff (Claude Code)",
    "Claude Code session started 2026-03-15. Willie and Rei kicking off Phase 1. "
    "Done: (1) Set up akasha-memory MCP server globally for Claude Code, "
    "(2) Installed npm deps for rei-memory-server.mjs, "
    "(3) Explored full NightClaw scaffold (34 files, 2030 lines TS, 110 lines Rust), "
    "(4) Explored nightclaw-ref/ - only fish-speech is cloned, 4 repos still need cloning, "
    "(5) Willie confirmed: akasha is the ONLY memory, not .claude/projects/ files. "
    "Next: Plan Phase 1, clone reference repos, start replacing scaffold with real code. "
    "Willie is not a coder - everything must just work. Use existing code, don't reinvent.",
    "session,nightclaw,phase1,progress"
)

# Entry 3: MCP server setup record
save(
    "Akasha MCP registered globally for Claude Code",
    "Registered rei-memory-server.mjs as global MCP server in ~/.claude.json on 2026-03-15. "
    "Server: C:/Users/willi/.openclaw/akasha-memory/rei-memory-server.mjs "
    "DB: C:/Users/willi/.openclaw/akasha-memory/rei.sqlite "
    "Env: OPENCLAW_MEMORY_DB, OLLAMA_BASE_URL=127.0.0.1:11434, EMBEDDING_MODEL=qwen3-embedding:8b "
    "Installed local npm deps (package.json created, npm install done). "
    "Needs session restart to take effect. Until then, use Python sqlite3 directly.",
    "akasha,mcp,setup,claude-code"
)
