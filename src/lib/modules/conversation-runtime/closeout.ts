import type { Closeout } from "@/lib/domain/closeout";
import {
  CLOSEOUT_TOOL_KIND,
  CloseoutSchema,
  parseCloseoutTurnPayload,
} from "@/lib/domain/closeout";
import type { ConversationTurn } from "@/lib/domain/conversation-turn";
import type { LivingPrd } from "@/lib/domain/living-prd";
import { MISSION_LABELS, type Mission } from "@/lib/domain/mission";

/** Build the user prompt for one-shot closeout generation (Maya + PRD context). */
export function buildCloseoutPrompt(
  prd: LivingPrd,
  mission: Mission | null,
): string {
  const missionLabel =
    mission != null
      ? `${MISSION_LABELS[mission]} (${mission})`
      : prd.mission != null
        ? `${MISSION_LABELS[prd.mission]} (${prd.mission})`
        : "sin misión explícita";

  return [
    "El onboarding está listo y el Living PRD ya está guardado.",
    "Genera un cierre personalizado (no genérico) con:",
    "1) summary: un resumen breve de lo que aprendiste del negocio (2–4 oraciones).",
    "2) actions: entre 3 y 5 próximos pasos concretos de alto apalancamiento, cada uno con title y reason (por qué ese paso importa ahora, anclado al PRD/misión).",
    "3) invitation: una invitación cálida a seguir conversando.",
    "",
    `Misión de la sesión: ${missionLabel}`,
    `Living PRD (JSON):\n${JSON.stringify(prd, null, 2)}`,
    "",
    "Escribe todo en español colombiano cálido. Los títulos de acciones deben ser concretos y accionables (verbos).",
  ].join("\n");
}

/** Format closeout as the assistant chat message body. */
export function formatCloseoutMessage(closeout: Closeout): string {
  const lines = closeout.actions.map(
    (action, index) =>
      `${index + 1}. ${action.title}\n   Por qué: ${action.reason}`,
  );

  return [
    closeout.summary,
    "",
    "Próximos pasos de mayor apalancamiento:",
    "",
    ...lines,
    "",
    closeout.invitation,
  ].join("\n");
}

export function closeoutTurnPayload(closeout: Closeout) {
  return {
    kind: CLOSEOUT_TOOL_KIND,
    closeout,
  } as const;
}

/** Find a previously persisted closeout on session turns. */
export function findCloseoutInTurns(
  turns: ConversationTurn[],
): Closeout | null {
  for (let i = turns.length - 1; i >= 0; i -= 1) {
    const turn = turns[i];
    if (turn?.role !== "assistant") continue;
    const payload = parseCloseoutTurnPayload(turn.toolCalls);
    if (payload) return payload.closeout;
  }
  return null;
}

export function parseCloseout(value: unknown): Closeout {
  return CloseoutSchema.parse(value);
}
