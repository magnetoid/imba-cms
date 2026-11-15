export interface SystemEntry {
  id: string
  name: string
  kind: string
  problem: string
  approach: string
  status: string
  /** Only set for repositories confirmed public. Private work is described, not linked. */
  repoUrl?: string
  repoLabel?: string
}

/**
 * Systems & experiments, written as a publications list: Problem -> Approach -> Status.
 *
 * PROVISIONAL: the descriptions for Janus, Blob, Morpheus OS, WooPulse and Tenso were
 * written without repository access — those repos are private and staying that way.
 * They describe the problem each system addresses and the shape of its approach; they
 * deliberately contain no measurements, benchmarks or version claims, because none
 * could be verified. Correct them against the real implementations when convenient.
 *
 * Repo links appear only for Quorum, Janus and torsor-helper, each confirmed to
 * resolve publicly. Nothing else is linked.
 */
export const SYSTEMS: SystemEntry[] = [
  {
    id: 'quorum',
    name: 'Quorum',
    kind: 'Multi-LLM consensus reasoning engine',
    problem:
      'A single language model is a single point of failure, and the dangerous failure is not refusal but confident invention. Betting a workflow on one model also bets it on one vendor.',
    approach:
      'Convene a council of models on the same question and treat the answers as votes. Cluster them semantically with embeddings so paraphrase counts as agreement, score the level of agreement, and escalate to more expensive tiers only when the cheap ones fail to converge. Where the council genuinely splits, the split is reported rather than resolved.',
    status: 'Open source, Apache-2.0. Active.',
    repoUrl: 'https://github.com/magnetoid/Quorum',
    repoLabel: 'github.com/magnetoid/Quorum',
  },
  {
    id: 'janus',
    name: 'Janus',
    kind: 'Self-developing, self-healing AI agent',
    problem:
      'Agents fail in ways their authors did not anticipate, and every recovery path written by hand is a path someone has to maintain. An agent that cannot change itself needs a human for every repair; an agent that can change itself can also dismantle the guarantees it was trusted for.',
    approach:
      'Keep the agent\'s invariants as an explicit specification separate from its behaviour. When a run fails, localise the fault, propose a change to the agent\'s own tooling and policy, and test that change against the invariants before it is allowed to take effect. Modifications outside the permitted surface are refused rather than negotiated, and every accepted change is journalled so it can be audited and rolled back. The interesting question is where that permitted surface should end.',
    status: 'In development.',
    repoUrl: 'https://github.com/magnetoid/janus',
    repoLabel: 'github.com/magnetoid/janus',
  },
  {
    id: 'torsor-helper',
    name: 'torsor-helper',
    kind: 'Local-first MCP server for agent memory and guardrails',
    problem:
      'A new session is a blank slate, long sessions drift, and agents optimise for what was said recently rather than what is durably true. They rebuild code that already exists and reintroduce patterns that were explicitly rejected, with no audit trail.',
    approach:
      'An external memory the agent re-reads at session start, ranked by stability rather than recency, fused from vector and full-text search. Architectural decisions are captured as enforceable rules with a drift check, so a rejected pattern fails the build instead of quietly returning. Markdown is the source of truth, which keeps the agent\'s memory reviewable and diffable like the rest of the repository.',
    status: 'Open source, MIT. Local-first — no API key required to run the memory layer.',
    repoUrl: 'https://github.com/magnetoid/torsor-helper',
    repoLabel: 'github.com/magnetoid/torsor-helper',
  },
  {
    id: 'blob',
    name: 'Blob',
    kind: 'Agentic-first AI team workspace',
    problem:
      'Collaboration tools were built for teams of people who occasionally call an AI. That makes the agent a guest: it speaks through a chat box, owns no state, holds no permissions of its own, and forgets the thread between sessions. Every serious piece of agent work then lives in someone\'s private history instead of in the team\'s.',
    approach:
      'Give agents first-class membership — their own identity, scoped permissions, and durable threads of work a human can pick up and hand back. The workspace, not the transcript, is what persists, so a task survives whoever or whatever last touched it. Anything that leaves the workspace stays behind a human gate.',
    status: 'In development. Private.',
  },
  {
    id: 'morpheus-os',
    name: 'Morpheus OS',
    kind: 'AI-native commerce operating system',
    problem:
      'Commerce platforms consume an AI API as an afterthought. Neither a rules engine nor a chatbot is a tool-using agent that can read a store and act on it, and monoliths make extension risky enough that most never try.',
    approach:
      'A deliberately small core — catalog, cart, checkout, fulfilment — with everything else as a plugin under a modularity contract that tears down cleanly when a plugin is disabled. Agents are treated as a first-class audience: a merchant assistant in the core, an agent kernel with capability scopes, and audience-scoped protocol endpoints so external AI clients can transact without a bespoke integration.',
    status: 'Running in production. Private.',
  },
  {
    id: 'woopulse',
    name: 'WooPulse',
    kind: 'AI-powered WooCommerce command center',
    problem:
      'A solo store operator has to be a merchandiser, a copywriter, a pricing analyst, and a competitor researcher at once. The tooling that does this well is priced and scoped for teams of ten.',
    approach:
      'Connect over the WooCommerce REST API and score opportunities from the first sync. Consensus drafting across several models where judgement matters — copy and outreach — and cheap local models where it does not, so the economics of the AI layer stay sane. Privacy-sensitive stores can route generation through a local model instead of a hosted API.',
    status: 'Live. Private.',
  },
  {
    id: 'tenso',
    name: 'Tenso',
    kind: 'Experimental language for neural-network development',
    problem:
      'General-purpose languages describe neural networks through library calls, so the things that actually break a model — tensor shape, differentiability, device placement — are conventions checked at runtime rather than properties the language knows about. A shape error surfaces as a stack trace deep in a training run instead of as a compile error.',
    approach:
      'Treat the network itself as a first-class construct rather than a value assembled by library calls, and push shape and differentiability into the type system so that a mis-wired model fails to compile. An exploration of what becomes expressible once that is true, not a bet that it should replace anything.',
    status: 'Exploration. Not a product.',
  },
]
