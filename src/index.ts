import blessed from 'blessed';
import { ParrotServer } from './server';
import { ParrotServerEventsEnum } from './consts/ParrotServerEvents.enum';
import { OrphanFilesHandler } from './handlers/OrphanFiles.handler';

const parrotServerInstance = new ParrotServer();

const screen = blessed.screen({
  smartCSR: true,
  autoPadding: true,
  fullUnicode: true,
  title: 'ParrotJS server',
});

// Header
const header = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: 1,
  content: `ParrotJS - ${parrotServerInstance.host} => ${parrotServerInstance.target}`,
  style: {
    fg: 'white',
    bg: 'blue',
  },
});

parrotServerInstance.on(ParrotServerEventsEnum.SERVER_LISTEN, () => {
  header.style.bg = 'green';
  header.style.fg = 'black';
  screen.render();
});

const content = blessed.box({
  top: 1,
  left: 0,
  width: '100%',
  height: '100%-2',
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  mouse: false,
  vi: true,
  tags: true,
  style: {
    fg: 'white',
    bg: 'black',
  },
});

// Footer
const footer = blessed.box({
  bottom: 0,
  left: 0,
  width: '100%',
  height: 1,
  content: 'q: [Q]uit | i: [I]ntercept',
  style: {
    fg: 'white',
    bg: 'blue',
  },
});

screen.append(header);
screen.append(content);
screen.append(footer);

screen.render();

parrotServerInstance.on(ParrotServerEventsEnum.LOG_INFO, (text: string) => {
  addContentLine(`{blue-fg}${text}{/}`, content, screen);
});

parrotServerInstance.on(ParrotServerEventsEnum.LOG_SUCCESS, (text: string) => {
  addContentLine(`{green-fg}${text}{/}`, content, screen);
});

parrotServerInstance.on(ParrotServerEventsEnum.LOG_ERROR, (text: string) => {
  addContentLine(`{red-fg}${text}{/}`, content, screen);
});

parrotServerInstance.on(ParrotServerEventsEnum.SERVER_STOP, () => {
  addContentLine(
    `{center}{red-bg}{white-fg}{bold}Server stopping in 2s...{/}{/center}`,
    content,
    screen,
  );
  setTimeout(() => {
    process.exit(0);
  }, 2000);
});

function addContentLine(
  text: string,
  content: blessed.Widgets.BoxElement,
  screen: blessed.Widgets.Screen,
) {
  const maxContentLines = Math.floor(Number(content.height));
  if (content.getLines().length > maxContentLines - 2) {
    content.shiftLine(1);
  }
  content.pushLine(text);
  screen.render();
}

screen.key(['escape', 'q', 'C-c'], () => {
  addContentLine(
    `{center}{red-bg}{white-fg}{bold}ParrotJS gracefully shutting down...{/}{/center}`,
    content,
    screen,
  );
  parrotServerInstance.server?.close();
});

screen.key(['i', 'I'], () => {
  let interceptStateMessage = `[!] Intercept mode is `;
  parrotServerInstance.bypassCache = !parrotServerInstance.bypassCache;
  if (parrotServerInstance.bypassCache) {
    interceptStateMessage += '{yellow-bg}{black-fg}DISABLED !{/}';
    header.style.bg = 'yellow';
    header.style.fg = 'black';
  } else {
    interceptStateMessage += '{green-bg}{black-fg}ENABLED !{/}';
    header.style.bg = 'green';
    header.style.fg = 'black';
  }
  screen.render();
  addContentLine(`{bold}${interceptStateMessage}{/}`, content, screen);
});

screen.key(['c', 'C'], () => {
  addContentLine(`{bold}[i] Try to clean...{/}`, content, screen);
  const cleanupMessage = `[!] Cleanup orphan files... `;
  const orphanFilesHandler = new OrphanFilesHandler(parrotServerInstance.serverConfig);
  orphanFilesHandler.on('Files', (files: Array<string>) => {
    addContentLine(`{bold}${cleanupMessage}{/}`, content, screen);
    if (files.length > 0) {
      files.forEach((f) => {
        addContentLine(`{bold}File path: ${f}{/}`, content, screen);
      });
    } else {
      addContentLine(`{bold}[i] No files to cleanup.{/}`, content, screen);
    }
  });
  orphanFilesHandler.cleanFiles();
});
