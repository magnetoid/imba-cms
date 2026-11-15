export interface ResearchArea {
  id: string
  title: string
  thesis: string
  repoLabel: string
  repoUrl: string
}

/** The three questions the work is organised around. */
export const RESEARCH_AREAS: ResearchArea[] = [
  {
    id: 'consensus',
    title: 'Multi-model consensus & reasoning',
    thesis:
      'A single model is a single point of failure, and its failure mode is confidence rather than silence. The question is how heterogeneous models can be made to agree reliably — and how disagreement can be surfaced instead of averaged away.',
    repoLabel: 'github.com/magnetoid/Quorum',
    repoUrl: 'https://github.com/magnetoid/Quorum',
  },
  {
    id: 'agents',
    title: 'Autonomous / self-improving agents',
    thesis:
      'An agent that can repair itself can also break itself. The question is safe self-modification: how much of its own behaviour an agent may rewrite before the guarantees you depend on stop holding.',
    repoLabel: 'github.com/magnetoid/janus',
    repoUrl: 'https://github.com/magnetoid/janus',
  },
  {
    id: 'memory',
    title: 'Agent memory, guardrails & MCP tooling',
    thesis:
      'Context windows forget and recency crowds out importance. The question is what durable memory looks like — ranked by stability rather than recency — and what guardrails keep an agent from quietly drifting off its own architecture.',
    repoLabel: 'github.com/magnetoid/torsor-helper',
    repoUrl: 'https://github.com/magnetoid/torsor-helper',
  },
]
