import blessed from 'blessed';
import { ParrotServerEventsEnum } from './consts/ParrotServerEvents.enum';
import { OrphanFilesHandler } from './handlers/OrphanFiles.handler';
import { logger } from './helpers/Logger';
import { ParrotServer } from './server';

try {
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
    content: `ParrotJS - ${parrotServerInstance.host}${parrotServerInstance.serverConfig.httpsPort ? '[s]:' + parrotServerInstance.serverConfig.httpsPort : ''} => ${parrotServerInstance.target}`,
    style: {
      fg: 'white',
      bg: 'blue',
    },
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
    content:
      // eslint-disable-next-line max-len
      'q: [Q]uit | i: [I]ntercept | o: [O]verride | c: [C]lean orphans | s: [S]kip Remote',
    style: {
      fg: 'white',
      bg: 'blue',
    },
  });

  screen.append(header);
  screen.append(content);
  screen.append(footer);

  screen.render();

  logger.debug('Binding event listeners for the server.');
  parrotServerInstance.on(ParrotServerEventsEnum.SERVER_LISTEN, () => {
    logger.debug('Server is listening and ready.');
    header.style.bg = 'green';
    header.style.fg = 'black';
    screen.render();
  });

  parrotServerInstance.on(ParrotServerEventsEnum.LOG_INFO, (text: string) => {
    logger.debug(`Server is info log ${text}`);
    addContentLine(`{blue-fg}${text}{/}`, content, screen);
  });

  parrotServerInstance.on(ParrotServerEventsEnum.LOG_SUCCESS, (text: string) => {
    logger.debug(`Server is success log ${text}`);
    addContentLine(`{green-fg}${text}{/}`, content, screen);
  });

  parrotServerInstance.on(
    ParrotServerEventsEnum.LOG_ERROR,
    (text: string, error: unknown) => {
      logger.log('error', `Server reports an error ${text}`, error);
      addContentLine(`{red-fg}${text}{/}`, content, screen);
    },
  );

  parrotServerInstance.on(ParrotServerEventsEnum.LOG_WARN, (text: string) => {
    logger.debug(`Server is reporting a warning ${text}`);
    addContentLine(`{yellow-fg}${text}{/}`, content, screen);
  });

  parrotServerInstance.on(ParrotServerEventsEnum.SERVER_STOP, () => {
    logger.debug(`Server is stopping.`);
    addContentLine(
      `{center}{red-bg}{white-fg}{bold}Server stopping in 2s...{/}{/center}`,
      content,
      screen,
    );
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  });

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
      logger.debug(`User disabled intercept mode.`);
    } else {
      interceptStateMessage += '{green-bg}{black-fg}ENABLED !{/}';
      header.style.bg = 'green';
      header.style.fg = 'black';
      logger.debug(`User disabled enabled mode.`);
    }
    screen.render();
    addContentLine(`{bold}${interceptStateMessage}{/}`, content, screen);
  });

  screen.key(['c', 'C'], () => {
    logger.debug(`Starting orphan response files cleanup.`);
    addContentLine(
      `{bold}[i] Starting orphan response files cleanup.{/}`,
      content,
      screen,
    );
    const orphanFilesHandler = new OrphanFilesHandler(parrotServerInstance.serverConfig);
    orphanFilesHandler.on(ParrotServerEventsEnum.LOG_INFO, (message: string) => {
      addContentLine(`{bold}${message}{/}`, content, screen);
    });
    orphanFilesHandler.cleanFiles();
  });

  screen.key(['o', 'O'], () => {
    let interceptStateMessage = `[!] Override mode is `;
    parrotServerInstance.overrideMode = !parrotServerInstance.overrideMode;
    if (parrotServerInstance.overrideMode) {
      interceptStateMessage += '{yellow-bg}{black-fg}ENABLED !{/}';
      footer.style.bg = 'yellow';
      footer.style.fg = 'black';
      logger.debug(`User enabled override mode.`);
    } else {
      interceptStateMessage += '{green-bg}{black-fg}DISABLED !{/}';
      footer.style.bg = 'blue';
      footer.style.fg = 'white';
      logger.debug(`User disabled override mode.`);
    }
    screen.render();
    addContentLine(`{bold}${interceptStateMessage}{/}`, content, screen);
  });

  screen.key(['s', 'S'], () => {
    let skipRemoteStateMessage = `[!] Skip remote is `;
    parrotServerInstance.skipRemote = !parrotServerInstance.skipRemote;
    if (parrotServerInstance.skipRemote) {
      skipRemoteStateMessage += '{yellow-bg}{black-fg}ENABLED !{/}';
      logger.debug(`User enabled skip remote mode.`);
    } else {
      skipRemoteStateMessage += '{green-bg}{black-fg}DISABLED !{/}';
      logger.debug(`User disabled skip remote mode.`);
    }
    screen.render();
    addContentLine(`{bold}${skipRemoteStateMessage}{/}`, content, screen);
  });
} catch (e: unknown) {
  logger.log('error', 'Parrot crashed! Something went terribly wrong.', e);
}

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
