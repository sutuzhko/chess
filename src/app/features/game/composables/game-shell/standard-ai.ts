import { getAiProfile } from '@app/features/game/config/ai-config.js';
import { parseUci } from '@modules/game/application/uci.js';
import type { ShellCtx } from './types.js';
import { renderStatus, updateEngineCard } from './ui-display.js';

export function aiSide(ctx: ShellCtx): 'white' | 'black' | null {
  const v = ctx.form.aiSideValue.value;
  return v === 'white' || v === 'black' ? v : null;
}

export async function maybeRunAi(ctx: ShellCtx): Promise<void> {
  const { ui, infra, mut, form } = ctx;
  if (mut.aiBusy || ui.gameMode !== 'standard') return;
  if (!infra.repo.has(mut.matchId)) return;
  const match = infra.repo.get(mut.matchId);
  if (match.status.kind !== 'in-progress') return;
  const target = aiSide(ctx);
  if (!target || match.currentSnapshot.sideToMove !== target) return;

  mut.aiBusy = true;
  renderStatus(ctx);
  updateEngineCard(ctx);
  try {
    const profile = getAiProfile(form.aiDepthValue.value);
    const result = await infra.requestBest.execute({
      matchId: mut.matchId,
      maxDepth: profile.depth,
      multiPV: profile.multiPV,
      temperature: profile.temperature,
      noiseCP: profile.noiseCP,
      blunderProb: profile.blunderProb,
    });
    const move = parseUci(result.bestMoveUci);
    infra.makeMove.execute({
      matchId: mut.matchId,
      from: move.from,
      to: move.to,
      ...(move.promotion ? { promotion: move.promotion } : {}),
    });
  } catch (e) {
    console.error('AI error', e);
  } finally {
    mut.aiBusy = false;
    renderStatus(ctx);
    updateEngineCard(ctx);
    void maybeRunAi(ctx);
  }
}
