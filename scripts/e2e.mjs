import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const path = req.url === '/' ? '/index.html' : req.url;
  try {
    res.writeHead(200, { 'content-type': types[extname(path)] ?? 'text/plain' });
    res.end(await readFile(join(root, path)));
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, resolve));
const url = `http://localhost:${server.address().port}/`;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

const titles = () => page.locator('#list .title').allTextContents();
const add = async (title) => {
  await page.fill('#title', title);
  await page.press('#title', 'Enter');
};

try {
  await page.goto(url);
  assert.equal(await page.isHidden('#footer'), true, 'footer hidden when list is empty');

  await add('牛乳を買う');
  await add('  メールを返す  ');
  await add('   ');
  assert.deepEqual(await titles(), ['牛乳を買う', 'メールを返す'], 'adds trimmed todos, ignores blank');
  assert.equal(await page.textContent('#count'), '残り 2 件');

  await page.check('li:has-text("牛乳を買う") input[type=checkbox]');
  assert.equal(await page.textContent('#count'), '残り 1 件', 'toggle updates remaining count');

  await page.click('[data-filter=active]');
  assert.deepEqual(await titles(), ['メールを返す'], 'active filter');
  await page.click('[data-filter=completed]');
  assert.deepEqual(await titles(), ['牛乳を買う'], 'completed filter');
  await page.click('[data-filter=all]');

  await page.dblclick('li:has-text("メールを返す") .title');
  await page.fill('li .edit', '上司にメールを返す');
  await page.press('li .edit', 'Enter');
  assert.deepEqual(await titles(), ['牛乳を買う', '上司にメールを返す'], 'double-click edit renames');

  await page.reload();
  assert.deepEqual(await titles(), ['牛乳を買う', '上司にメールを返す'], 'persisted across reload');
  assert.equal(await page.isChecked('li:has-text("牛乳を買う") input[type=checkbox]'), true, 'done state persisted');

  await page.click('#clear-completed');
  assert.deepEqual(await titles(), ['上司にメールを返す'], 'clear completed');

  await page.check('#toggle-all');
  assert.equal(await page.textContent('#count'), '残り 0 件', 'toggle all');

  await page.hover('li:has-text("上司にメールを返す")');
  await page.click('li:has-text("上司にメールを返す") .remove');
  assert.deepEqual(await titles(), [], 'remove');
  assert.equal(await page.isHidden('#footer'), true, 'footer hidden again');

  await page.evaluate(() => localStorage.setItem('valid-pstack-todos', '{broken'));
  await page.reload();
  assert.deepEqual(await titles(), [], 'corrupt storage loads as empty');

  await add('スクリーンショット用');
  await add('完了したタスク');
  await page.check('li:has-text("完了したタスク") input[type=checkbox]');
  await page.screenshot({ path: process.env.SCREENSHOT ?? join(root, 'screenshot.png') });

  assert.deepEqual(errors, [], 'no page errors');
  console.log('e2e: all checks passed');
} finally {
  await browser.close();
  server.close();
}
