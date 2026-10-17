import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialState, reduce, visibleTodos, remainingCount, parseState } from '../src/todos.js';

const run = (...actions) => actions.reduce(reduce, initialState);
const titles = (todos) => todos.map((t) => t.title);

test('adds trimmed todos and ignores blank titles', () => {
  const state = run({ type: 'add', id: 'a', title: '  milk ' }, { type: 'add', id: 'b', title: '   ' });
  assert.deepEqual(state.todos, [{ id: 'a', title: 'milk', done: false }]);
});

test('filters show active and completed todos', () => {
  const state = run(
    { type: 'add', id: 'a', title: 'milk' },
    { type: 'add', id: 'b', title: 'eggs' },
    { type: 'toggle', id: 'a' },
  );
  assert.deepEqual(titles(visibleTodos(reduce(state, { type: 'setFilter', filter: 'active' }))), ['eggs']);
  assert.deepEqual(titles(visibleTodos(reduce(state, { type: 'setFilter', filter: 'completed' }))), ['milk']);
  assert.deepEqual(titles(visibleTodos(state)), ['milk', 'eggs']);
  assert.equal(remainingCount(state), 1);
});

test('unknown filter keeps the current one', () => {
  assert.equal(run({ type: 'setFilter', filter: 'bogus' }).filter, 'all');
});

test('toggleAll completes everything, then reopens everything', () => {
  const once = run({ type: 'add', id: 'a', title: 'milk' }, { type: 'add', id: 'b', title: 'eggs' }, { type: 'toggleAll' });
  assert.equal(remainingCount(once), 0);
  assert.equal(remainingCount(reduce(once, { type: 'toggleAll' })), 2);
});

test('renaming to blank removes the todo', () => {
  const state = run({ type: 'add', id: 'a', title: 'milk' }, { type: 'rename', id: 'a', title: 'oat milk' });
  assert.deepEqual(titles(state.todos), ['oat milk']);
  assert.deepEqual(reduce(state, { type: 'rename', id: 'a', title: ' ' }).todos, []);
});

test('clearCompleted keeps only active todos', () => {
  const state = run(
    { type: 'add', id: 'a', title: 'milk' },
    { type: 'add', id: 'b', title: 'eggs' },
    { type: 'toggle', id: 'b' },
    { type: 'clearCompleted' },
  );
  assert.deepEqual(titles(state.todos), ['milk']);
});

test('unknown action throws', () => {
  assert.throws(() => reduce(initialState, { type: 'nope' }), /Unknown action/);
});

test('parseState round-trips saved state and survives corrupt input', () => {
  const state = run({ type: 'add', id: 'a', title: 'milk' }, { type: 'setFilter', filter: 'active' });
  assert.deepEqual(parseState(JSON.stringify(state)), state);
  assert.deepEqual(parseState('{not json'), initialState);
  assert.deepEqual(parseState('{"todos":[{"id":1}],"filter":"x"}'), initialState);
});
