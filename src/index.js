import {
  ACTION,
  APP_STATE,
  CONTENT_TYPE,
  ELEMENT_TYPE,
  SIGN,
} from "./constants";
import "./styles.css";
import {
  createOverlay,
  generateConfig,
  getFromLocalStore,
  removeOverlay,
  saveToLocalStore,
} from "./utils";

let state = [];
const content = document.querySelector(".content");
const addListButton = document.querySelector(".add-list");

let startListId = null;
let startCardId = null;
let listHovered = null;

/**
 * !This function called whenever state is changed
 *
 * 1. This will rerender the whole content tree again
 * and again.
 *
 * 2. One approach would be to write a custom
 * selective rendering logic but that's an overhead.
 * Instead we can use a preexisting lib/framework in
 * the market that solves this.
 *
 * TODO: Add pagination/ virtualization
 */
const render = () => {
  content.innerHTML = "";

  for (let i = 0; i < state.length; i++) {
    const { id, title, type, cards } = state[i];
    const listElement = document.createElement(ELEMENT_TYPE.DIV);
    listElement.classList.add("list");
    listElement.dataset.id = id;
    listElement.dataset.type = type;
    listElement.innerHTML = `
      <div class='list-top'>
        <div class='list-title'>${title}</div>
        <div class="remove-list"><button data-id=${id} data-action=${ACTION.REMOVE_LIST}>${SIGN.CROSS}</button></div>
      </div>
      <div class="card-container"></div>
      <div class="add-card"><button data-id=${id} data-action=${ACTION.ADD_CARD}>${SIGN.PLUS}</button></div>
    `;

    if (!cards) continue;

    for (let j = 0; j < cards.length; j++) {
      const { id: cardId, type: cardType, title, description } = cards[j];
      const cardElement = document.createElement(ELEMENT_TYPE.DIV);

      cardElement.classList.add("card");
      cardElement.dataset.id = cardId;
      cardElement.dataset.listId = id;
      cardElement.dataset.type = cardType;
      cardElement.draggable = true;
      cardElement.innerHTML = `
        <div class='card-top'>
          <div class='card-title'>${title}</div>
          <div class='card-cross'>
            <button data-id=${id} data-card-id=${cardId} data-action=${ACTION.REMOVE_CARD}>${SIGN.CROSS}</button>
          </div>
        </div>
        <p class='card-description'>${description}</p>
      `;

      listElement.querySelector(".card-container").appendChild(cardElement);
    }

    content.appendChild(listElement);
  }

  saveToLocalStore(APP_STATE, state);
};

const onAddListClick = () => {
  const overlay = createOverlay();

  // TODO: make template/ web component outta this
  overlay.innerHTML = `
    <div class='form-container'>
      <div class='title'>Add List</div>
      <div>
        <form class='form'>
          <div>
            <label class='form-item form-title-container'>
            <p>Title:</p>
            <input class='input' name='title' />
            </label>
          </div>
          <button>Submit</button>
        </form>
      </div>
    </div>
  `;

  const form = overlay.querySelector(".form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const { title } = Object.fromEntries(formData);

    if (title) {
      state.push(generateConfig({ type: CONTENT_TYPE.LIST, title, cards: [] }));
    }

    removeOverlay();
    render();
  });
};

const onContentClick = (e) => {
  const listId = e.target.dataset.id;
  if (!listId) return;
  const action = e.target.dataset.action;
  if (!action) return;
  const list = state.find(({ id }) => id === listId);
  if (!list) return;

  switch (action) {
    case ACTION.ADD_CARD:
      const overlay = createOverlay();

      // TODO: make template/ web component outta this
      overlay.innerHTML = `
        <div class='form-container'>
          <div class='title'>Add Card</div>
          <div>
            <form class='form'>
              <div class='form-item form-title-container'>
                <label>
                <p>Title:</p>
                <input class='input' name='title' />
                </label>
              </div>
              <div class='form-item form-description-container'>
                <label>
                <p>Description:</p>
                <textarea class='input' name='description' ></textarea>
                </label>
              </div>
              <button>Submit</button>
            </form>
          </div>
        </div>
      `;

      const form = overlay.querySelector(".form");

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const { title, description } = Object.fromEntries(formData);

        if (title && description) {
          list.cards.push(
            generateConfig({
              type: CONTENT_TYPE.CARD,
              title,
              description,
            })
          );
        }

        render();
        removeOverlay();
      });
      break;
    case ACTION.REMOVE_CARD:
      const cardId = e.target.dataset.cardId;
      if (!cardId) return;
      list.cards = list.cards.filter(({ id }) => id !== cardId);
      break;
    case ACTION.REMOVE_LIST:
      state = state.filter(({ id }) => id !== listId);
      break;
    default:
      break;
  }

  render();
};

const onDragStart = (e) => {
  const cardId = e.target.dataset.id;
  const listElement = e.target.closest(".list");
  const listId = listElement?.dataset?.id;

  if (!cardId || !listId) return;

  startCardId = cardId;
  startListId = listId;
};

const onDragEnd = (e) => {};

const onDragOver = (e) => {
  e.preventDefault();

  const listElement = e.target.closest(".list");
  const listId = listElement?.dataset?.id;

  if (!listId || listHovered) return;

  listHovered = listElement;
  listElement.classList.add("hover");
};

const onDragEnter = (e) => {};

const onDragLeave = (e) => {
  listHovered?.classList.remove("hover");
  listHovered = null;
};

const onDragDrop = (e) => {
  const listElement = e.target.closest(".list");
  const listId = listElement?.dataset?.id;

  listHovered?.classList.remove("hover");
  listHovered = null;

  if (!listId) return;

  if (startListId === listId) return;

  const startList = state.find(({ id }) => id === startListId);
  const dropList = state.find(({ id }) => id === listId);
  const card = startList.cards.find(({ id }) => id === startCardId);

  startList.cards = startList.cards.filter(({ id }) => id !== startCardId);
  dropList.cards.unshift(card);

  startCardId = null;
  startListId = null;

  render();
};

const onDomContentLoad = () => {
  state = getFromLocalStore(APP_STATE);
  render();
};

addListButton.addEventListener("click", onAddListClick);
content.addEventListener("click", onContentClick);
content.addEventListener("dragstart", onDragStart);
content.addEventListener("dragend", onDragEnd);
content.addEventListener("dragover", onDragOver);
content.addEventListener("dragenter", onDragEnter);
content.addEventListener("dragleave", onDragLeave);
content.addEventListener("drop", onDragDrop);
addEventListener("DOMContentLoaded", onDomContentLoad);
