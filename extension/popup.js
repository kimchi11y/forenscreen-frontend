import { whoami } from "./lib/api.js";
import { wireRegister } from "./lib/flow.js";

const $ = (id) => document.getElementById(id);
let chosen = null;

async function showAccount() {
  const me = await whoami();
  if (me.connected) {
    $("account").textContent = me.offline
      ? "Connected (ForenScreen can't be reached right now)."
      : `Connected${me.email ? ` as ${me.email}` : ""}.`;
    $("picker").hidden = false;
  } else {
    $("account").textContent = me.reason ?? "Not connected to a ForenScreen account.";
    $("connect-row").hidden = false;
  }
}

function choose(file) {
  if (!file || !file.type.startsWith("image/")) return;
  chosen = file;
  const url = URL.createObjectURL(file);
  $("preview").src = url;
  $("own").src = url;
  $("preview").hidden = false;
  $("compare").hidden = true;
  $("result").hidden = true;
  $("anyway").hidden = true;
  $("register").disabled = false;
}

$("connect").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "open-app", path: "/extension" });
  window.close();
});
$("file").addEventListener("change", (event) => choose(event.target.files?.[0]));
const drop = $("drop");
drop.addEventListener("dragover", (event) => { event.preventDefault(); drop.classList.add("active"); });
drop.addEventListener("dragleave", () => drop.classList.remove("active"));
drop.addEventListener("drop", (event) => {
  event.preventDefault();
  drop.classList.remove("active");
  choose(event.dataTransfer?.files?.[0]);
});

wireRegister(
  { register: $("register"), result: $("result"), compare: $("compare"), earlierImg: $("earlier"), anyway: $("anyway") },
  async () => chosen,
  () => chosen?.name ?? "image",
);
showAccount();
