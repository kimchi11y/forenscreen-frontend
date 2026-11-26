import { wireRegister } from "./lib/flow.js";

const $ = (id) => document.getElementById(id);
const src = new URLSearchParams(window.location.search).get("src") ?? "";

let source;
try {
  source = new URL(src);
} catch {
  source = null;
}

if (!source || !["http:", "https:", "data:", "blob:"].includes(source.protocol)) {
  $("source").textContent = "This image can't be registered from here.";
  $("register").disabled = true;
} else {
  $("source").textContent = source.protocol === "data:" ? "From this page" : `From ${source.hostname}`;
  $("preview").src = src;
  $("own").src = src;
}

$("cancel").addEventListener("click", () => window.close());

let blob = null;
wireRegister(
  { register: $("register"), result: $("result"), compare: $("compare"), earlierImg: $("earlier"), anyway: $("anyway") },
  async () => {
    // Fetched only now, after the user clicked Register.
    blob ??= await (await fetch(src)).blob();
    return blob;
  },
  () => decodeURIComponent(source?.pathname.split("/").pop() || "image"),
);
