/**
 * Soft-save gate stub for Ticket #5.
 * Ticket #7 (AuthBridge) will replace this with real auth + business merge.
 */
export type SaveContinueHandler = () => void | Promise<void>;

export const SAVE_CONTINUE_HASH = "#save";

export function createSaveContinueStub(
  onNotice: (message: string) => void,
): SaveContinueHandler {
  return () => {
    if (typeof window !== "undefined") {
      window.location.hash = SAVE_CONTINUE_HASH.slice(1);
    }
    onNotice(
      "Pronto podrás guardar tu PRD. AuthBridge llega en el próximo ticket.",
    );
  };
}
