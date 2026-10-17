export const FILTERS = {
  all: () => true,
  active: (todo) => !todo.done,
  completed: (todo) => todo.done,
};

export const initialState = { todos: [], filter: 'all' };

const update = (state, id, fn) => ({
  ...state,
  todos: state.todos.map((todo) => (todo.id === id ? fn(todo) : todo)),
});

const handlers = {
  add(state, { id, title }) {
    const trimmed = title.trim();
    if (!trimmed) return state;
    return { ...state, todos: [...state.todos, { id, title: trimmed, done: false }] };
  },
  toggle: (state, { id }) => update(state, id, (todo) => ({ ...todo, done: !todo.done })),
  toggleAll(state) {
    const done = !state.todos.every((todo) => todo.done);
    return { ...state, todos: state.todos.map((todo) => ({ ...todo, done })) };
  },
  rename(state, { id, title }) {
    const trimmed = title.trim();
    if (!trimmed) return handlers.remove(state, { id });
    return update(state, id, (todo) => ({ ...todo, title: trimmed }));
  },
  remove: (state, { id }) => ({ ...state, todos: state.todos.filter((todo) => todo.id !== id) }),
  clearCompleted: (state) => ({ ...state, todos: state.todos.filter(FILTERS.active) }),
  setFilter: (state, { filter }) => (filter in FILTERS ? { ...state, filter } : state),
};

export function reduce(state, action) {
  const handler = handlers[action.type];
  if (!handler) throw new Error(`Unknown action: ${action.type}`);
  return handler(state, action);
}

export const visibleTodos = (state) => state.todos.filter(FILTERS[state.filter]);
export const remainingCount = (state) => state.todos.filter(FILTERS.active).length;

export function parseState(json) {
  try {
    const data = JSON.parse(json);
    const todos = Array.isArray(data?.todos)
      ? data.todos.filter(
          (t) => typeof t?.id === 'string' && typeof t.title === 'string' && typeof t.done === 'boolean',
        )
      : [];
    const filter = data?.filter in FILTERS ? data.filter : 'all';
    return { todos: todos.map(({ id, title, done }) => ({ id, title, done })), filter };
  } catch {
    return initialState;
  }
}
