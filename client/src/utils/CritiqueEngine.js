// ═══════════════════════════════════════════════════════════════════════════
// CRITIQUE ENGINE — V2 AI Design Analysis Engine
// Five-part critique structure: Opening, Strength, Opportunity,
// Standards Note, Signature Closer.
// All critiques cite specific measurements, named principles,
// and actionable recommendations.
// ═══════════════════════════════════════════════════════════════════════════

// ── Dimension Labels ─────────────────────────────────────────────────────
const DIM_LABELS = {
  color: 'color harmony',
  spatial: 'spatial composition',
  style: 'style coherence',
  layering: 'textural depth',
  wall: 'wall composition',
  brief: 'brief compliance',
  narrative: 'design narrative'
};

const DIM_ADVICE = {
  color: {
    high: 'Your color palette shows real intention.',
    low: 'The color relationships need attention.',
    tips: [
      'Try the 60-30-10 rule: dominant/secondary/accent distribution.',
      'Check your undertones — warm beige and cool gray fight each other.',
      'Consider Munsell value consistency: keep lightness levels intentional.',
      'Itten would say you need more contrast of extension — vary the area ratios.',
    ]
  },
  spatial: {
    high: 'The spatial flow is well-resolved.',
    low: 'Spatial relationships have issues.',
    tips: [
      'Sofa-to-coffee-table distance should be 14-18 inches (DSD standard).',
      'Primary walkways need 36 inches minimum clearance.',
      'Conversation circles work best within an 8-foot diameter.',
      'Check Arnheim visual balance — weight feels uneven across the room.',
    ]
  },
  style: {
    high: 'The style identity is clear and confident.',
    low: 'The style feels scattered.',
    tips: [
      'Strengthen the dominant style above 60% of visual weight.',
      'If mixing styles, choose allies — mid-century and modern, not modern and baroque.',
      'Your weighted visual density should match your style target.',
      'Material palette should echo your style period: teak for mid-century, brass for art deco.',
    ]
  },
  layering: {
    high: 'Beautiful textural layering — the room has depth.',
    low: 'The room needs more textural depth.',
    tips: [
      'Aim for 5 layers: structural, foundation, accent, styling, organic.',
      'Mix at least 4 texture families: smooth, soft, woven, rough, metallic, organic.',
      'Balance hard and soft materials for tactile variety.',
      'Add botanical elements — biophilic design reduces stress measurably.',
    ]
  },
  wall: {
    high: 'Strong wall composition — the verticals work.',
    low: 'The walls need more attention.',
    tips: [
      'Art center height should be 57-60 inches on freestanding walls.',
      'Art above furniture: 6-12 inches gap, 50-75% of furniture width.',
      'Need at least 2 lighting layers: ambient + task or accent.',
      'Consider a feature wall — all identical walls score lower.',
    ]
  },
  brief: {
    high: 'You read the assignment — the brief is well-served.',
    low: 'The design doesn\'t fully address the brief.',
    tips: [
      'Check required furniture types — are they all present?',
      'Verify seating count meets the brief requirement.',
      'Color temperature should match the brief direction.',
    ]
  },
  narrative: {
    high: 'There\'s a real story here — intentional design.',
    low: 'The room lacks a cohesive story.',
    tips: [
      'Thread a color through multiple tiers — palette should flow from walls to accessories.',
      'Repeat key materials across items (e.g., brass in lamps, hardware, frames).',
      'Create clear focal hierarchy: primary, secondary, supporting.',
      'Edit: every piece should contribute to the narrative or go.',
    ]
  }
};

// ── Judge-Specific Voice ─────────────────────────────────────────────────

const JUDGE_OPENERS = {
  margaux: {
    excellent: 'This is what restraint looks like. Every piece earns its place.',
    good: 'Getting closer. I can see the intention, but there\'s still noise.',
    fair: 'Too much. Strip it back and let the architecture breathe.',
    poor: 'This room is fighting itself. Start with subtraction.',
  },
  dex: {
    excellent: 'NOW we\'re talking! This room has SOUL.',
    good: 'I see the spark — now turn it into a bonfire.',
    fair: 'You\'re playing it safe. Where\'s the risk? Where\'s the joy?',
    poor: 'A room this timid isn\'t worth entering. Go bigger.',
  },
  yuki: {
    excellent: 'There is a quiet truth in this room. It breathes.',
    good: 'Almost. Let the imperfections speak — they have wisdom.',
    fair: 'It feels constructed. Let go of perfection and find honesty.',
    poor: 'Too much intention, not enough soul. Let the room find itself.',
  },
  ava: {
    excellent: 'Beautifully proportioned. This room has proper bones.',
    good: 'The foundation is solid. Refine the proportions and you\'re there.',
    fair: 'The proportions aren\'t quite right. Study the classical orders.',
    poor: 'I see potential, but this needs architectural discipline.',
  },
  rio: {
    excellent: 'What a story! Every corner has a chapter to tell.',
    good: 'Interesting start — now surprise me. What\'s unexpected?',
    fair: 'I keep waiting for the plot twist. Where\'s the surprise?',
    poor: 'There\'s no story here. Travel the world and bring something back.',
  },
  algo: {
    excellent: total => `Score: ${total}/100. All metrics within optimal parameters. Impressive.`,
    good: total => `Score: ${total}/100. Above average with optimization opportunities.`,
    fair: total => `Score: ${total}/100. Multiple dimensions below threshold. Review data.`,
    poor: total => `Score: ${total}/100. Significant metric failures detected across dimensions.`,
  }
};

const JUDGE_STRENGTH = {
  margaux: (dim, score) => `Your ${DIM_LABELS[dim]} shows real discipline — ${score}/100.`,
  dex:     (dim, score) => `The ${DIM_LABELS[dim]} is electric — ${score}/100!`,
  yuki:    (dim, score) => `The ${DIM_LABELS[dim]} has a beautiful honesty — ${score}/100.`,
  ava:     (dim, score) => `Excellent ${DIM_LABELS[dim]} — ${score}/100. A testament to good taste.`,
  rio:     (dim, score) => `The ${DIM_LABELS[dim]} caught my eye — ${score}/100. That's where the magic is.`,
  algo:    (dim, score) => `Peak dimension: ${DIM_LABELS[dim]} at ${score}/100.`,
};

const JUDGE_WEAKNESS = {
  margaux: (dim, score, tip) => `The ${DIM_LABELS[dim]} needs editing — ${score}/100. ${tip}`,
  dex:     (dim, score, tip) => `The ${DIM_LABELS[dim]} needs more drama — ${score}/100. ${tip}`,
  yuki:    (dim, score, tip) => `The ${DIM_LABELS[dim]} doesn't feel natural — ${score}/100. ${tip}`,
  ava:     (dim, score, tip) => `The ${DIM_LABELS[dim]} breaks the harmony — ${score}/100. ${tip}`,
  rio:     (dim, score, tip) => `The ${DIM_LABELS[dim]} plays it too safe — ${score}/100. ${tip}`,
  algo:    (dim, score, tip) => `Lowest dimension: ${DIM_LABELS[dim]} at ${score}/100. Recommendation: ${tip}`,
};

const JUDGE_CLOSER = {
  margaux: total => total > 80 ? 'I\'d live here.' : total > 60 ? 'Edit more, think less.' : 'Start over. With less.',
  dex:     total => total > 80 ? 'Move in and throw a party.' : total > 60 ? 'Almost party-ready.' : 'Needs a personality transplant.',
  yuki:    total => total > 80 ? 'This room will age beautifully.' : total > 60 ? 'Let it breathe a while longer.' : 'Find the quiet center.',
  ava:     total => total > 80 ? 'This will stand the test of time.' : total > 60 ? 'Close — study the masters.' : 'Back to fundamentals.',
  rio:     total => total > 80 ? 'I want to know the story behind every piece.' : total > 60 ? 'Add one unexpected element.' : 'Find something with a passport.',
  algo:    total => total > 80 ? 'Optimization level: professional.' : total > 60 ? 'Iterative improvement recommended.' : 'Major revision required.',
};

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE CRITIQUE
// Five-part structure: Opening, Strength, Opportunity, Standards, Closer
// ═══════════════════════════════════════════════════════════════════════════

// Designer opinion integration (lazy import to avoid circular deps)
let _designerOpinions = null;
function getDesignerOpinions() {
  if (!_designerOpinions) {
    try { _designerOpinions = require('./DesignerOpinions.js'); } catch { _designerOpinions = null; }
  }
  return _designerOpinions;
}

export function generateCritique(judge, dimensionScores, total, roomAnalysis = {}) {
  const tier = total > 80 ? 'excellent' : total > 60 ? 'good' : total > 40 ? 'fair' : 'poor';

  // Find best and worst dimensions
  const dims = Object.entries(dimensionScores).filter(([k]) => k !== 'brief');
  const sorted = dims.sort((a,b) => b[1] - a[1]);
  const bestDim = sorted[0]?.[0] || 'color';
  const bestScore = sorted[0]?.[1] || 0;
  const worstDim = sorted[sorted.length-1]?.[0] || 'spatial';
  const worstScore = sorted[sorted.length-1]?.[1] || 0;

  // Pick a relevant tip for the weakness
  const tips = DIM_ADVICE[worstDim]?.tips || [];
  const tip = tips[Math.floor(Math.random() * tips.length)] || 'Review this dimension.';

  // 1. Opening
  let opener;
  if (judge.id === 'algo') {
    opener = JUDGE_OPENERS.algo[tier](total);
  } else {
    opener = JUDGE_OPENERS[judge.id]?.[tier] || `Score: ${total}/100.`;
  }

  // 2. Strength
  const strength = JUDGE_STRENGTH[judge.id]?.(bestDim, bestScore) || `Strong ${DIM_LABELS[bestDim]}: ${bestScore}/100.`;

  // 3. Opportunity (with standards citation)
  const weakness = JUDGE_WEAKNESS[judge.id]?.(worstDim, worstScore, tip) || `${DIM_LABELS[worstDim]} needs work: ${worstScore}/100.`;

  // 4. Standards Note (DSD citation if available)
  let standardsNote = '';
  if (roomAnalysis.topViolation) {
    const v = roomAnalysis.topViolation;
    standardsNote = `Standards note: ${v.issue} (${v.source}).`;
  } else if (roomAnalysis.dsdPassRate !== undefined) {
    const pct = Math.round(roomAnalysis.dsdPassRate * 100);
    standardsNote = `DSD compliance: ${pct}% of applicable standards met.`;
  }

  // 5. Brief compliance note
  let briefNote = '';
  if (roomAnalysis.briefPenalties && roomAnalysis.briefPenalties.length > 0) {
    const topPenalty = roomAnalysis.briefPenalties[0];
    const briefNotes = {
      margaux: `Did you read the brief? ${topPenalty}.`,
      dex: `The brief asked for something specific — ${topPenalty}. Don't ignore your client!`,
      yuki: `The client's needs aren't fully met — ${topPenalty}.`,
      ava: `A professional reads the brief. Issue: ${topPenalty}.`,
      rio: `Creative freedom is great, but the client said — ${topPenalty}.`,
      algo: `Brief deviation detected: ${topPenalty}.`,
    };
    briefNote = briefNotes[judge.id] || '';
  }

  // 6. Designer opinion quote (new in V2)
  let designerQuote = '';
  const opinions = getDesignerOpinions();
  if (opinions && opinions.getCritiqueOpinions) {
    const quotes = opinions.getCritiqueOpinions(judge.id, roomAnalysis, 1);
    if (quotes.length > 0) {
      const q = quotes[0];
      designerQuote = q.phrase;
    }
  }

  // 7. Closer
  const closer = JUDGE_CLOSER[judge.id]?.(total) || '';

  return {
    opener,
    strength,
    weakness,
    standardsNote,
    briefNote,
    designerQuote,
    closer,
    // Full text for display
    fullText: [opener, strength, weakness, standardsNote, briefNote, designerQuote, closer].filter(Boolean).join(' ')
  };
}

export default { generateCritique };