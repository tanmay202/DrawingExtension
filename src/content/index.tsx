import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const ROOT_ID = "__page_annotation_layer_root__";

function mount() {
  if (document.getElementById(ROOT_ID)) {
    return;
  }

  const host = document.createElement("div");
  host.id = ROOT_ID;
  host.style.position = "fixed";
  host.style.inset = "0";
  host.style.zIndex = "2147483647";
  host.style.pointerEvents = "none";
  host.style.width = "100vw";
  host.style.height = "100vh";
  host.style.contain = "layout style";

  const shadow = host.attachShadow({ mode: "open" });
  const rootElement = document.createElement("div");
  rootElement.id = "annotation-app";
  shadow.appendChild(rootElement);

  const root = createRoot(rootElement);
  root.render(<App />);

  const attach = () => {
    const parent = document.documentElement || document.body;
    if (parent && !host.isConnected) {
      parent.appendChild(host);
    }
  };

  attach();
  if (!host.isConnected) {
    document.addEventListener("DOMContentLoaded", attach, { once: true });
  }
}

mount();
