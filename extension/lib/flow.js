// The "you chose an image -> confirm -> result" flow shared by the popup and
// the right-click window. Nothing is uploaded until the Register button.

import { describe, registerImage } from "./api.js";

const TONES = { registered: "ok", already: "ok", similar: "warn" };

/**
 * Wire a Register button to upload `getBlob()` and show the outcome.
 * `elements`: { register, result, compare, earlierImg, anyway }.
 */
export function wireRegister(elements, getBlob, fileName) {
  const { register, result, compare, earlierImg, anyway } = elements;

  async function run(confirmSimilar) {
    register.disabled = true;
    anyway.hidden = true;
    result.className = "status";
    result.textContent = "Registering…";
    result.hidden = false;
    const outcome = await registerImage(await getBlob(), fileName(), { confirmSimilar });
    result.textContent = describe(outcome);
    result.className = `status ${TONES[outcome.status] ?? "bad"}`;
    if (outcome.status === "similar") {
      // Show the earlier original beside this one, so the user can judge.
      if (outcome.preview) {
        earlierImg.src = outcome.preview;
        compare.hidden = false;
      }
      anyway.hidden = false;
    } else if (outcome.status !== "registered" && outcome.status !== "already") {
      register.disabled = false;
    }
  }

  register.addEventListener("click", () => run(false));
  anyway.addEventListener("click", () => run(true));
}
