import { ELEMENT_TYPE } from "../constants";

export const generateConfig = (overrides = {}) => {
  return {
    id: crypto.randomUUID(),
    ...overrides,
  };
};

export const createOverlay = () => {
  const overlay = document.createElement(ELEMENT_TYPE.DIV);
  overlay.classList.add("overlay");
  document.body.appendChild(overlay);

  return overlay;
};

export const removeOverlay = () => {
  document.querySelector(".overlay").remove();
};

export const saveToLocalStore = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getFromLocalStore = (key) => {
  const localStoreState = localStorage.getItem(key);
  if (!localStoreState) return [];
  return JSON.parse(localStoreState);
};
