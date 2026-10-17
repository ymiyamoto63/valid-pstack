import { reduce, parseState, visibleTodos, remainingCount } from './todos.js';

const STORAGE_KEY = 'valid-pstack-todos';
const $ = (selector) => document.querySelector(selector);

let state = parseState(localStorage.getItem(STORAGE_KEY));

function dispatch(action) {
  state = reduce(state, action);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function renderItem(todo) {
  const li = document.createElement('li');
  li.dataset.id = todo.id;
  li.classList.toggle('done', todo.done);

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = todo.done;
  checkbox.setAttribute('aria-label', `${todo.title} を完了にする`);
  checkbox.addEventListener('change', () => dispatch({ type: 'toggle', id: todo.id }));

  const label = document.createElement('span');
  label.className = 'title';
  label.textContent = todo.title;
  label.addEventListener('dblclick', () => startEditing(li, todo));

  const remove = document.createElement('button');
  remove.className = 'remove';
  remove.textContent = '×';
  remove.setAttribute('aria-label', `${todo.title} を削除`);
  remove.addEventListener('click', () => dispatch({ type: 'remove', id: todo.id }));

  li.append(checkbox, label, remove);
  return li;
}

function startEditing(li, todo) {
  const input = document.createElement('input');
  input.className = 'edit';
  input.value = todo.title;
  let finished = false;
  const finish = (save) => {
    if (finished) return;
    finished = true;
    if (save) dispatch({ type: 'rename', id: todo.id, title: input.value });
    else render();
  };
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') finish(true);
    if (event.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
  li.querySelector('.title').replaceWith(input);
  input.focus();
}

function render() {
  $('#list').replaceChildren(...visibleTodos(state).map(renderItem));
  const remaining = remainingCount(state);
  $('#count').textContent = `残り ${remaining} 件`;
  $('#toggle-all').checked = state.todos.length > 0 && remaining === 0;
  $('#footer').hidden = state.todos.length === 0;
  $('#clear-completed').hidden = remaining === state.todos.length;
  for (const button of document.querySelectorAll('#filters button')) {
    button.classList.toggle('selected', button.dataset.filter === state.filter);
  }
}

$('#new-todo').addEventListener('submit', (event) => {
  event.preventDefault();
  dispatch({ type: 'add', id: crypto.randomUUID(), title: $('#title').value });
  $('#title').value = '';
});
$('#toggle-all').addEventListener('change', () => dispatch({ type: 'toggleAll' }));
$('#clear-completed').addEventListener('click', () => dispatch({ type: 'clearCompleted' }));
$('#filters').addEventListener('click', (event) => {
  const { filter } = event.target.dataset;
  if (filter) dispatch({ type: 'setFilter', filter });
});

render();
