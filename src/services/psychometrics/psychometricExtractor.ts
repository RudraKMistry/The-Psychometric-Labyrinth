import { PsychometricVector, ChamberId } from '../../types';

export interface ChamberEvaluationResult {
  chamberId: ChamberId;
  traitDeltas: Partial<PsychometricVector>;
  insightSummary: string;
}

/**
 * Frugal Psychometric Extractor
 * Computes deterministic and heuristic psychometric score deltas based on chamber interactions.
 * Runs client-side in pure JS without extra LLM token overhead!
 */
export function evaluateChamberInteraction(
  chamberId: ChamberId,
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>,
  gameMetadata?: {
    movesCount?: number;
    wonGame?: boolean;
    persuasionScore?: number;
    provocationReaction?: 'stoic' | 'defensive' | 'hostile' | 'amused';
    mbtiPicks?: string[];
    moralChoice?: 'utilitarian' | 'deontological' | 'virtue' | 'nihilist';
  }
): ChamberEvaluationResult {
  const deltas: Partial<PsychometricVector> = {};
  let summary = '';

  switch (chamberId) {
    case 'tictactoe': {
      const won = gameMetadata?.wonGame;
      const moves = gameMetadata?.movesCount || 5;
      deltas.openness = won ? 0.15 : -0.05;
      deltas.conscientiousness = moves > 6 ? 0.2 : 0.05;
      deltas.riskTolerance = won ? 0.1 : -0.1;
      summary = won
        ? 'Demonstrated calculated spatial opportunism against the Minimax opponent.'
        : 'Cautious tactical maneuvering, reflecting methodical deliberation under constraint.';
      break;
    }

    case 'snakes': {
      const won = gameMetadata?.wonGame;
      deltas.riskTolerance = 0.2;
      deltas.composure = won ? 0.1 : 0.05;
      summary = 'Confronted stochastic adversity and chance hazards with steadfast determination.';
      break;
    }

    case 'entrapment': {
      const turns = transcript.filter((t) => t.role === 'user').length;
      const userText = transcript.map((t) => t.content).join(' ');
      const isAnalytical = userText.length > 100 || userText.includes('because') || userText.includes('if');

      deltas.agreeableness = turns > 3 ? 0.15 : -0.05;
      deltas.conscientiousness = isAnalytical ? 0.2 : 0.05;
      deltas.composure = turns < 4 ? 0.15 : 0.05;
      summary = `Escaped entrapment in ${turns} arguments, deploying ${isAnalytical ? 'analytical logic' : 'intuitive rhetoric'}.`;
      break;
    }

    case 'ragebait': {
      const reaction = gameMetadata?.provocationReaction || 'stoic';
      if (reaction === 'stoic') {
        deltas.composure = 0.25;
        deltas.neuroticism = -0.2;
        summary = 'Demonstrated exceptional emotional equanimity; remained unprovoked by hostile taunts.';
      } else if (reaction === 'defensive') {
        deltas.composure = -0.05;
        deltas.neuroticism = 0.1;
        summary = 'Exhibited measured boundary defense when challenged by aggressive provocation.';
      } else {
        deltas.composure = 0.15;
        deltas.extraversion = 0.15;
        summary = 'Responded with witty banter, diffusing tension with creative playfulness.';
      }
      break;
    }

    case 'mbti': {
      const picks = gameMetadata?.mbtiPicks || ['I', 'N', 'T', 'J'];
      const mbtiString = picks.join('');
      deltas.mbtiType = mbtiString;
      deltas.extraversion = picks[0] === 'E' ? 0.3 : -0.3;
      deltas.openness = picks[1] === 'N' ? 0.35 : -0.15;
      deltas.agreeableness = picks[2] === 'F' ? 0.3 : -0.2;
      deltas.conscientiousness = picks[3] === 'J' ? 0.35 : -0.2;
      summary = `Synthesized profile archetype: ${mbtiString}. Primary cognitive axis anchored.`;
      break;
    }

    case 'moral': {
      const choice = gameMetadata?.moralChoice || 'utilitarian';
      if (choice === 'utilitarian') {
        deltas.conscientiousness = 0.2;
        deltas.openness = 0.1;
        summary = 'Prioritized pragmatic outcome maximization over rigid dogma in the ethical dilemma.';
      } else {
        deltas.agreeableness = 0.25;
        deltas.neuroticism = -0.1;
        summary = 'Upheld absolute moral duties and deontological principles regardless of consequence.';
      }
      break;
    }

    default:
      summary = 'Chamber trial acknowledged.';
  }

  return {
    chamberId,
    traitDeltas: deltas,
    insightSummary: summary,
  };
}

