window.SKILLTREE_DATA = {
  "meta": {
    "schema": "agent-skilltree/v0",
    "host_pin": "@deepseek-ai/dsh@0.2.1-rc.5",
    "public_name": "agent-skilltree",
    "constitution": "immutable"
  },
  "nodes": [
    {
      "id": "perception.vision.1",
      "tab": "perception",
      "domain": "core",
      "name_zh": "視覺 I",
      "name_en": "Vision I",
      "rank": 1,
      "cost": 1,
      "requires": [],
      "grants": [
        "attachments.images.read_basic"
      ],
      "capstone": false
    },
    {
      "id": "perception.vision.2",
      "tab": "perception",
      "domain": "core",
      "name_zh": "視覺 II",
      "name_en": "Vision II",
      "rank": 2,
      "cost": 2,
      "requires": [
        "perception.vision.1"
      ],
      "grants": [
        "attachments.images.multi"
      ],
      "capstone": false
    },
    {
      "id": "perception.vision.3",
      "tab": "perception",
      "domain": "core",
      "name_zh": "視覺 III（Capstone）",
      "name_en": "Vision III (Capstone)",
      "rank": 3,
      "cost": 3,
      "requires": [
        "perception.vision.2"
      ],
      "grants": [
        "attachments.images.advanced"
      ],
      "capstone": true
    },
    {
      "id": "perception.search.1",
      "tab": "perception",
      "domain": "core",
      "name_zh": "搜尋 I",
      "name_en": "Search I",
      "rank": 1,
      "cost": 1,
      "requires": [],
      "grants": [
        "tools.web_search"
      ],
      "capstone": false
    },
    {
      "id": "perception.search.2",
      "tab": "perception",
      "domain": "core",
      "name_zh": "搜尋 II",
      "name_en": "Search II",
      "rank": 2,
      "cost": 2,
      "requires": [
        "perception.search.1"
      ],
      "grants": [
        "tools.web_fetch"
      ],
      "capstone": false
    },
    {
      "id": "perception.research.1",
      "tab": "perception",
      "domain": "core",
      "name_zh": "調研 I",
      "name_en": "Research I",
      "rank": 1,
      "cost": 2,
      "requires": [
        "perception.search.2"
      ],
      "grants": [
        "tools.multi_search_policy"
      ],
      "capstone": false
    },
    {
      "id": "perception.memory.1",
      "tab": "perception",
      "domain": "core",
      "name_zh": "記憶讀取",
      "name_en": "Memory Read",
      "rank": 1,
      "cost": 1,
      "requires": [],
      "grants": [
        "memory.read"
      ],
      "capstone": false
    },
    {
      "id": "perception.memory.2",
      "tab": "perception",
      "domain": "core",
      "name_zh": "記憶寫入",
      "name_en": "Memory Write",
      "rank": 2,
      "cost": 2,
      "requires": [
        "perception.memory.1",
        "gov.consent.write"
      ],
      "grants": [
        "memory.write"
      ],
      "danger": "medium",
      "capstone": false
    },
    {
      "id": "perception.files.1",
      "tab": "perception",
      "domain": "core",
      "name_zh": "檔案讀取",
      "name_en": "Files Read",
      "rank": 1,
      "cost": 1,
      "requires": [],
      "grants": [
        "tools.fs_read"
      ],
      "capstone": false
    },
    {
      "id": "perception.files.2",
      "tab": "perception",
      "domain": "core",
      "name_zh": "檔案寫入",
      "name_en": "Files Write",
      "rank": 2,
      "cost": 2,
      "requires": [
        "perception.files.1",
        "gov.consent.write"
      ],
      "grants": [
        "tools.fs_write"
      ],
      "danger": "medium",
      "capstone": false
    },
    {
      "id": "execution.tools.whitelist",
      "tab": "execution",
      "domain": "core",
      "name_zh": "工具白名單",
      "name_en": "Tool Whitelist",
      "rank": 1,
      "cost": 1,
      "requires": [],
      "grants": [
        "tools.restrict.baseline_allow"
      ],
      "capstone": false
    },
    {
      "id": "execution.tools.extended",
      "tab": "execution",
      "domain": "core",
      "name_zh": "工具擴展",
      "name_en": "Tool Extended",
      "rank": 2,
      "cost": 2,
      "requires": [
        "execution.tools.whitelist"
      ],
      "grants": [
        "tools.restrict.extended_allow"
      ],
      "capstone": false
    },
    {
      "id": "execution.call_budget.1",
      "tab": "execution",
      "domain": "core",
      "name_zh": "呼叫預算 I",
      "name_en": "Call Budget I",
      "rank": 1,
      "cost": 1,
      "requires": [
        "execution.tools.whitelist"
      ],
      "grants": [
        "loop.max_parallel=2",
        "product.call_count_cap=low"
      ],
      "capstone": false
    },
    {
      "id": "execution.call_budget.2",
      "tab": "execution",
      "domain": "core",
      "name_zh": "呼叫預算 II",
      "name_en": "Call Budget II",
      "rank": 2,
      "cost": 2,
      "requires": [
        "execution.call_budget.1"
      ],
      "grants": [
        "loop.max_parallel=4",
        "product.call_count_cap=mid"
      ],
      "capstone": false
    },
    {
      "id": "execution.loop_budget.1",
      "tab": "execution",
      "domain": "core",
      "name_zh": "迴圈預算 I",
      "name_en": "Loop Budget I",
      "rank": 1,
      "cost": 1,
      "requires": [
        "execution.tools.whitelist"
      ],
      "grants": [
        "product.turn_cap=low",
        "turn_stopping.enabled"
      ],
      "capstone": false
    },
    {
      "id": "execution.loop_budget.2",
      "tab": "execution",
      "domain": "core",
      "name_zh": "迴圈預算 II",
      "name_en": "Loop Budget II",
      "rank": 2,
      "cost": 2,
      "requires": [
        "execution.loop_budget.1"
      ],
      "grants": [
        "product.turn_cap=mid"
      ],
      "capstone": false
    },
    {
      "id": "execution.subagent.summon",
      "tab": "execution",
      "domain": "core",
      "name_zh": "召喚子代理",
      "name_en": "Subagent Summon",
      "rank": 1,
      "cost": 2,
      "requires": [
        "execution.loop_budget.1",
        "execution.tools.whitelist"
      ],
      "grants": [
        "subagents.max_depth=1",
        "subagents.max_active=1"
      ],
      "capstone": false
    },
    {
      "id": "execution.subagent.squad",
      "tab": "execution",
      "domain": "core",
      "name_zh": "小隊",
      "name_en": "Subagent Squad",
      "rank": 2,
      "cost": 3,
      "requires": [
        "execution.subagent.summon",
        "execution.loop_budget.2",
        "gov.safety.1"
      ],
      "grants": [
        "subagents.max_depth=2",
        "subagents.max_active=3"
      ],
      "danger": "medium",
      "capstone": false
    },
    {
      "id": "execution.parallel.1",
      "tab": "execution",
      "domain": "core",
      "name_zh": "並行 I",
      "name_en": "Parallel I",
      "rank": 1,
      "cost": 1,
      "requires": [
        "execution.call_budget.1"
      ],
      "grants": [
        "product.parallel_tasks=2"
      ],
      "capstone": false
    },
    {
      "id": "execution.parallel.2",
      "tab": "execution",
      "domain": "core",
      "name_zh": "並行 II",
      "name_en": "Parallel II",
      "rank": 2,
      "cost": 2,
      "requires": [
        "execution.parallel.1",
        "execution.call_budget.2"
      ],
      "grants": [
        "product.parallel_tasks=4"
      ],
      "capstone": false
    },
    {
      "id": "execution.shell.1",
      "tab": "execution",
      "domain": "core",
      "name_zh": "Shell I",
      "name_en": "Shell I",
      "rank": 1,
      "cost": 2,
      "requires": [
        "execution.tools.whitelist",
        "gov.consent.shell"
      ],
      "grants": [
        "tools.bash.ask"
      ],
      "danger": "high",
      "capstone": false
    },
    {
      "id": "execution.network.1",
      "tab": "execution",
      "domain": "core",
      "name_zh": "出站網絡 I",
      "name_en": "Outbound Network I",
      "rank": 1,
      "cost": 2,
      "requires": [
        "perception.search.1",
        "gov.consent.network"
      ],
      "grants": [
        "tools.outbound.ask"
      ],
      "danger": "medium",
      "capstone": false
    },
    {
      "id": "execution.gateway.on_demand",
      "tab": "execution",
      "domain": "core",
      "name_zh": "Gateway · On-Demand",
      "name_en": "Gateway On-Demand",
      "rank": 1,
      "cost": 2,
      "requires": [
        "gov.audit.1",
        "gov.consent.network"
      ],
      "grants": [
        "product.gateway=on_demand"
      ],
      "danger": "medium",
      "capstone": false,
      "note": "Product-layer; ≠ dsh-api-gateway"
    },
    {
      "id": "execution.gateway.persistent",
      "tab": "execution",
      "domain": "core",
      "name_zh": "Gateway · Persistent",
      "name_en": "Gateway Persistent",
      "rank": 2,
      "cost": 4,
      "requires": [
        "execution.gateway.on_demand",
        "gov.audit.1",
        "gov.safety.1"
      ],
      "grants": [
        "product.gateway=persistent"
      ],
      "danger": "high",
      "capstone": false
    },
    {
      "id": "execution.path_hygiene.1",
      "tab": "execution",
      "domain": "core",
      "name_zh": "路徑衛生 I",
      "name_en": "Path Hygiene I",
      "rank": 1,
      "cost": 1,
      "requires": [
        "execution.tools.whitelist"
      ],
      "grants": [
        "product.os_path_hygiene=1",
        "tools.pre_execute.path_check=on"
      ],
      "danger": "low",
      "capstone": false
    },
    {
      "id": "execution.shell_dialect.1",
      "tab": "execution",
      "domain": "core",
      "name_zh": "Shell 方言 I",
      "name_en": "Shell Dialect I",
      "rank": 1,
      "cost": 1,
      "requires": [
        "execution.tools.whitelist",
        "gov.consent.shell"
      ],
      "grants": [
        "product.shell_dialect=1",
        "product.os_tips_table=inject"
      ],
      "danger": "medium",
      "capstone": false
    },
    {
      "id": "gov.soul.base",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "Soul 基底",
      "name_en": "Soul Base",
      "rank": 1,
      "cost": 0,
      "requires": [],
      "grants": [
        "persona.base",
        "system_prompt.budget=800"
      ],
      "capstone": false
    },
    {
      "id": "gov.soul.exp.1",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "Soul 擴容 I",
      "name_en": "Soul Expansion I",
      "rank": 2,
      "cost": 1,
      "requires": [
        "gov.soul.base"
      ],
      "grants": [
        "system_prompt.budget=1200"
      ],
      "capstone": false
    },
    {
      "id": "gov.soul.exp.2",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "Soul 擴容 II",
      "name_en": "Soul Expansion II",
      "rank": 3,
      "cost": 2,
      "requires": [
        "gov.soul.exp.1"
      ],
      "grants": [
        "system_prompt.budget=1600"
      ],
      "capstone": false
    },
    {
      "id": "gov.consent.write",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "寫入同意",
      "name_en": "Write Consent",
      "rank": 1,
      "cost": 1,
      "requires": [],
      "grants": [
        "approval.policy.write=ask"
      ],
      "danger": "medium",
      "capstone": false
    },
    {
      "id": "gov.consent.shell",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "Shell 同意",
      "name_en": "Shell Consent",
      "rank": 2,
      "cost": 2,
      "requires": [
        "gov.consent.write"
      ],
      "grants": [
        "approval.policy.shell=ask"
      ],
      "danger": "high",
      "capstone": false
    },
    {
      "id": "gov.consent.network",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "網絡同意",
      "name_en": "Network Consent",
      "rank": 2,
      "cost": 2,
      "requires": [
        "gov.consent.write"
      ],
      "grants": [
        "approval.policy.network=ask"
      ],
      "danger": "medium",
      "capstone": false
    },
    {
      "id": "gov.safety.1",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "Safety Review I",
      "name_en": "Safety Review I",
      "rank": 1,
      "cost": 2,
      "requires": [
        "gov.consent.write"
      ],
      "grants": [
        "product.safety_review=1",
        "sandbox.floor=workspace-write"
      ],
      "danger": "medium",
      "capstone": false
    },
    {
      "id": "gov.audit.1",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "Audit I",
      "name_en": "Audit I",
      "rank": 1,
      "cost": 1,
      "requires": [],
      "grants": [
        "product.skilltree_audit=on",
        "approval.session_audit=consume"
      ],
      "capstone": false
    },
    {
      "id": "gov.content_policy",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "Content Policy",
      "name_en": "Content Policy",
      "rank": 1,
      "cost": 1,
      "requires": [
        "gov.soul.base"
      ],
      "grants": [
        "product.content_policy=on"
      ],
      "capstone": false
    },
    {
      "id": "gov.nsfw_gate",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "NSFW Gate",
      "name_en": "NSFW Gate",
      "rank": 2,
      "cost": 2,
      "requires": [
        "gov.content_policy",
        "gov.audit.1"
      ],
      "grants": [
        "product.nsfw_gate=user_enabled"
      ],
      "danger": "high",
      "capstone": false,
      "default_enabled": false
    },
    {
      "id": "gov.respec",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "Respec（重配點）",
      "name_en": "Respec",
      "rank": 1,
      "cost": 0,
      "requires": [
        "gov.audit.1"
      ],
      "grants": [
        "product.respec=human_only"
      ],
      "capstone": false
    },
    {
      "id": "gov.build_export",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "Build Export",
      "name_en": "Build Export",
      "rank": 1,
      "cost": 1,
      "requires": [
        "gov.audit.1"
      ],
      "grants": [
        "product.export_policy_manifest=on"
      ],
      "capstone": false
    },
    {
      "id": "gov.strict_path_mode",
      "tab": "governance",
      "domain": "governance",
      "name_zh": "Strict Path Mode",
      "name_en": "Strict Path Mode",
      "rank": 1,
      "cost": 0,
      "requires": [],
      "grants": [
        "product.strict_path_mode=on"
      ],
      "danger": "low",
      "capstone": false,
      "default_enabled_by_platform": {
        "linux": false,
        "darwin": false,
        "win32": true
      },
      "note": "Agent cannot self-disable (Constitution). Human may turn off with audit."
    },
    {
      "id": "execution.dev.repo_read",
      "tab": "execution",
      "domain": "development",
      "name_zh": "Repo 讀取",
      "name_en": "Repo Read",
      "rank": 1,
      "cost": 1,
      "requires": [
        "perception.files.1"
      ],
      "grants": [
        "tools.repo_read"
      ],
      "capstone": false
    },
    {
      "id": "execution.dev.patch",
      "tab": "execution",
      "domain": "development",
      "name_zh": "安全 Patch",
      "name_en": "Safe Patch",
      "rank": 2,
      "cost": 2,
      "requires": [
        "execution.dev.repo_read",
        "execution.tools.whitelist"
      ],
      "grants": [
        "tools.patch"
      ],
      "danger": "medium",
      "capstone": false
    },
    {
      "id": "execution.dev.test",
      "tab": "execution",
      "domain": "development",
      "name_zh": "測試跑手",
      "name_en": "Test Runner",
      "rank": 2,
      "cost": 1,
      "requires": [
        "execution.dev.repo_read"
      ],
      "grants": [
        "tools.tests"
      ],
      "capstone": false
    },
    {
      "id": "execution.dev.release",
      "tab": "execution",
      "domain": "development",
      "name_zh": "Release 發佈",
      "name_en": "Release",
      "rank": 3,
      "cost": 3,
      "requires": [
        "execution.dev.test",
        "gov.consent.write"
      ],
      "grants": [
        "tools.release"
      ],
      "danger": "high",
      "capstone": false
    },
    {
      "id": "perception.research.citations",
      "tab": "perception",
      "domain": "research",
      "name_zh": "引用核實",
      "name_en": "Citation Check",
      "rank": 2,
      "cost": 1,
      "requires": [
        "perception.search.2"
      ],
      "grants": [
        "tools.citations"
      ],
      "capstone": false
    },
    {
      "id": "perception.research.scholar",
      "tab": "perception",
      "domain": "research",
      "name_zh": "學術搜尋",
      "name_en": "Scholar Search",
      "rank": 2,
      "cost": 2,
      "requires": [
        "perception.search.2"
      ],
      "grants": [
        "tools.scholar"
      ],
      "capstone": false
    },
    {
      "id": "execution.research.synth",
      "tab": "execution",
      "domain": "research",
      "name_zh": "研究綜合",
      "name_en": "Research Synthesis",
      "rank": 2,
      "cost": 2,
      "requires": [
        "perception.research.citations"
      ],
      "grants": [
        "tools.synth"
      ],
      "capstone": false
    },
    {
      "id": "perception.assistant.inbox",
      "tab": "perception",
      "domain": "assistant",
      "name_zh": "收件匣讀取",
      "name_en": "Inbox Read",
      "rank": 1,
      "cost": 1,
      "requires": [],
      "grants": [
        "tools.email_read"
      ],
      "capstone": false
    },
    {
      "id": "perception.assistant.calendar",
      "tab": "perception",
      "domain": "assistant",
      "name_zh": "日曆讀取",
      "name_en": "Calendar Read",
      "rank": 1,
      "cost": 1,
      "requires": [],
      "grants": [
        "tools.calendar_read"
      ],
      "capstone": false
    },
    {
      "id": "execution.assistant.draft",
      "tab": "execution",
      "domain": "assistant",
      "name_zh": "草擬回覆",
      "name_en": "Draft Reply",
      "rank": 2,
      "cost": 1,
      "requires": [
        "perception.assistant.inbox"
      ],
      "grants": [
        "tools.email_draft"
      ],
      "capstone": false
    },
    {
      "id": "execution.assistant.send",
      "tab": "execution",
      "domain": "assistant",
      "name_zh": "發送郵件",
      "name_en": "Send Email",
      "rank": 3,
      "cost": 2,
      "requires": [
        "execution.assistant.draft",
        "gov.consent.network"
      ],
      "grants": [
        "tools.email_send"
      ],
      "danger": "high",
      "capstone": false
    },
    {
      "id": "execution.assistant.schedule",
      "tab": "execution",
      "domain": "assistant",
      "name_zh": "安排日程",
      "name_en": "Schedule",
      "rank": 2,
      "cost": 2,
      "requires": [
        "perception.assistant.calendar",
        "gov.consent.write"
      ],
      "grants": [
        "tools.calendar_write"
      ],
      "danger": "medium",
      "capstone": false
    }
  ],
  "presets": [
    {
      "schema": "agent-skilltree/preset/v1",
      "id": "ops-squad",
      "title": "Ops Squad",
      "points": 32,
      "blurb_zh": "營運小隊：子代理、並行、Gateway On-Demand，加完整同意／Safety。",
      "blurb_en": "Ops squad: subagents, parallel work, gateway on-demand, full consent/safety.",
      "agent_purpose_zh": "Agent 可以拆出子代理並行處理營運工作；所有寫入／Shell／網絡仍受同意與 Safety 約束。",
      "agent_purpose_en": "The agent may fan work out to subagents and run parallel operations; every write, shell and network action remains under consent and safety.",
      "requires_human_approval_for": [
        "shell",
        "write",
        "network"
      ],
      "allocate_order": [
        "gov.soul.base",
        "gov.soul.exp.1",
        "gov.audit.1",
        "gov.consent.write",
        "gov.consent.shell",
        "gov.consent.network",
        "gov.safety.1",
        "gov.respec",
        "gov.build_export",
        "perception.search.1",
        "perception.search.2",
        "perception.files.1",
        "perception.memory.1",
        "execution.tools.whitelist",
        "execution.call_budget.1",
        "execution.call_budget.2",
        "execution.loop_budget.1",
        "execution.loop_budget.2",
        "execution.subagent.summon",
        "execution.subagent.squad",
        "execution.parallel.1",
        "execution.parallel.2",
        "execution.gateway.on_demand"
      ]
    },
    {
      "schema": "agent-skilltree/preset/v1",
      "id": "personal-assistant",
      "title": "Personal Assistant",
      "points": 24,
      "blurb_zh": "私人助理：讀收件匣／日曆、草擬回覆、安排日程；發送要人手批。",
      "blurb_en": "Personal assistant: read inbox/calendar, draft replies, schedule; sending needs a human.",
      "agent_purpose_zh": "Agent 可以讀收件匣與日曆、草擬回覆、提出日程；發送 email 或改日曆前必須人手批准。",
      "agent_purpose_en": "The agent may read inbox/calendar, draft replies and propose schedules; sending email or changing the calendar requires human approval.",
      "requires_human_approval_for": [
        "email_send",
        "calendar_write"
      ],
      "allocate_order": [
        "gov.soul.base",
        "gov.audit.1",
        "gov.consent.write",
        "gov.consent.network",
        "gov.respec",
        "gov.build_export",
        "perception.assistant.inbox",
        "perception.assistant.calendar",
        "execution.assistant.draft",
        "execution.assistant.send",
        "execution.assistant.schedule",
        "execution.tools.whitelist",
        "execution.call_budget.1"
      ]
    },
    {
      "schema": "agent-skilltree/preset/v1",
      "id": "reader-safe",
      "title": "Reader Safe",
      "points": 18,
      "blurb_zh": "只讀模式：睇圖、搜尋、讀檔；幾乎唔開 Shell／Gateway。",
      "blurb_en": "Read-only: vision, search, file reads; almost no shell/gateway.",
      "agent_purpose_zh": "Agent 只可以看圖、搜尋、讀檔與整理；不可寫入、不可開 Shell、不可出站，適合審閱與研究。",
      "agent_purpose_en": "The agent may view images, search, read files and summarise; it cannot write, open a shell or go outbound. Suitable for review and research.",
      "requires_human_approval_for": [
        "write",
        "shell",
        "network"
      ],
      "allocate_order": [
        "gov.soul.base",
        "gov.audit.1",
        "gov.consent.write",
        "gov.safety.1",
        "gov.respec",
        "gov.build_export",
        "perception.vision.1",
        "perception.vision.2",
        "perception.search.1",
        "perception.search.2",
        "perception.research.1",
        "perception.memory.1",
        "perception.files.1",
        "execution.tools.whitelist",
        "execution.call_budget.1"
      ]
    },
    {
      "schema": "agent-skilltree/preset/v1",
      "id": "research-analyst",
      "title": "Research Analyst",
      "points": 30,
      "blurb_zh": "研究分析：搜尋、引用核實、學術來源、綜合報告；出站要同意。",
      "blurb_en": "Research analyst: search, citation checks, scholarly sources, synthesis; outbound needs consent.",
      "agent_purpose_zh": "Agent 可以搜尋、核實引用、讀取學術來源、做多源綜合；不可公開發佈或未經同意出站。",
      "agent_purpose_en": "The agent may search, verify citations, read scholarly sources and synthesise multiple sources; it may not publish publicly or go outbound without consent.",
      "requires_human_approval_for": [
        "outbound"
      ],
      "allocate_order": [
        "gov.soul.base",
        "gov.audit.1",
        "gov.consent.write",
        "gov.consent.network",
        "gov.content_policy",
        "gov.respec",
        "gov.build_export",
        "perception.search.1",
        "perception.search.2",
        "perception.research.citations",
        "perception.research.scholar",
        "execution.research.synth",
        "perception.files.1",
        "perception.memory.1",
        "execution.tools.whitelist",
        "execution.call_budget.1",
        "execution.call_budget.2",
        "execution.parallel.1"
      ]
    },
    {
      "schema": "agent-skilltree/preset/v1",
      "id": "solo-dev",
      "title": "Solo Developer",
      "points": 26,
      "blurb_zh": "單人開發：讀 repo、跑測試、出 patch；release 仍要人手批。",
      "blurb_en": "Solo dev: read repos, run tests, propose patches; release still needs a human.",
      "agent_purpose_zh": "Agent 可以讀取 repo、跑測試、提出安全 patch 並整理 diff；不可以自行 release、push 或改 CI 權限。",
      "agent_purpose_en": "The agent may read repositories, run tests, propose safe patches and summarise diffs; it may not release, push, or change CI permissions.",
      "requires_human_approval_for": [
        "patch",
        "release"
      ],
      "allocate_order": [
        "gov.soul.base",
        "gov.audit.1",
        "gov.consent.write",
        "gov.respec",
        "gov.build_export",
        "gov.strict_path_mode",
        "perception.files.1",
        "execution.tools.whitelist",
        "execution.dev.repo_read",
        "execution.dev.test",
        "execution.dev.patch",
        "execution.dev.release",
        "execution.call_budget.1",
        "execution.call_budget.2",
        "execution.loop_budget.1"
      ]
    }
  ]
};
