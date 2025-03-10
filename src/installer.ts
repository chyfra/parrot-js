/**
 * Installer CLI app will go here
 * It needs to:
 * - Init a sample config file or fill it with the user's answers
 * - Init an env file
 * - Create the cache folder
 * - Check if the init is ready and start parrot
 */
import { spawn } from 'child_process';
import { copy, remove, rename, writeFile } from 'fs-extra';
import kleur from 'kleur';
import prompts from 'prompts';

const parseArgumentsAndStart = () => {
  const args = process.argv;
  const dryRun = !!args.find((e) => e === '--dry');
  if (args.find((e) => e === '-h' || e === '--help')) {
    console.log(
      kleur.bgGreen('### ParrotJS -- Help ###'),
      '\n\n',
      kleur.white('To install ParrotJS please run\n'),
      kleur.underline('npx @chyfra/parrot-js -i\n'),
      kleur.white('or\n'),
      kleur.underline('npx @chyfra/parrot-js --install\n\n'),
      kleur.bgYellow(kleur.black('Note: Please run the install in an empty folder.')),
      '\n\n',
      kleur.white('To display the help page run\n'),
      kleur.underline('npx @chyfra/parrot-js -h\n'),
      kleur.white('or\n'),
      kleur.underline('npx @chyfra/parrot-js --help\n\n'),
      kleur.white('Dry run (debug purposes)\n'),
      kleur.underline('npx @chyfra/parrot-js --dry\n\n'),
      kleur.bgGreen(kleur.black('More commands in the future o/')),
      '\n',
    );
    process.exit(0);
  }
  if (args.find((e) => e === '-i' || e === '--install')) {
    confirmAndInstall(dryRun);
  }
  if (dryRun) {
    confirmAndInstall(dryRun);
  }
};

const startPostInstallConfig = async (dryRun = false) => {
  const response = await prompts([
    {
      type: 'text',
      name: 'PARROT_API_BASE',
      message: 'Target host eg.(https://api.dicebear.com) do not add a / at the end',
      validate: (prev: string) => {
        return (
          prev.startsWith('http://') ||
          prev.startsWith('https://') ||
          'Please enter an url starting with http:// or https://'
        );
      },
      initial: 'https://api.dicebear.com',
    },
    {
      type: 'text',
      name: 'PARROT_HTTPS_PORT',
      message: 'Set the HTTPS port (default is 9443)',
      validate: (prev: string) => {
        return !isNaN(parseInt(prev)) || 'Please enter a valid port number';
      },
      initial: '9443',
    },
    {
      type: 'text',
      name: 'PARROT_HTTP_PORT',
      message: 'Set the HTTP port (default is 1120)',
      validate: (prev: string) => {
        return !isNaN(parseInt(prev)) || 'Please enter a valid port number';
      },
      initial: '1120',
    },
    {
      type: 'text',
      name: 'PARROT_CACHEPATH',
      message: 'Set the cache path (default is `cache`, if unsure, just press enter)',
      validate: (prev: string) => {
        // TODO: Add folder validation?
        return prev.length > 0;
      },
      initial: 'cache',
    },
    {
      type: 'select',
      name: 'PARROT_LOG_LEVEL',
      message: 'Choose your log level (this will be written in a separate log file)',
      choices: [
        { value: 'ERROR', title: 'ERROR: Errors only.' },
        { value: 'WARN', title: 'WARN: Warnings and errors.' },
        { value: 'INFO', title: 'INFO: Info, warnings and errors.' },
        { value: 'DEBUG', title: 'DEBUG: Debug and all their friends.' },
        { value: 'VERBOSE', title: 'VERBOSE: Verbose, tell us everything!' },
        { value: 'SILLY', title: 'SILLY: I want to know EVERYTHING!' },
      ],
      initial: 0,
    },
    {
      type: 'text',
      name: 'PARROT_CACHE_FILENAME',
      message:
        'Set the main requests filename (default `requests.json`, if unsure press enter)',
      validate: (prev: string) => {
        return (
          (prev.length > 6 && prev.endsWith('.json')) ||
          'The filename must be at least one character and ends with `.json`'
        );
      },
      initial: 'requests.json',
    },
    {
      type: 'select',
      name: 'PARROT_CACHE_FILE_ENCODING',
      message: 'Set the file encoding (default is `utf8` just press enter)',
      choices: [
        { value: 'ascii', title: 'ascii' },
        { value: 'utf8', title: 'utf8' },
        { value: 'utf', title: 'utf' },
        { value: 'utf16le', title: 'utf16le' },
        { value: 'utf', title: 'utf' },
        { value: 'ucs2', title: 'ucs2' },
        { value: 'ucs', title: 'ucs' },
        { value: 'base64', title: 'base64' },
        { value: 'base64url', title: 'base64url' },
        { value: 'latin1', title: 'latin1' },
        { value: 'binary', title: 'binary' },
        { value: 'hex', title: 'hex' },
      ],
      initial: 1,
    },
    {
      type: 'select',
      name: 'PARROT_REJECT_UNAUTHORIZED',
      message: `Reject self-signed SSL certificates? (default & recommended is: false)
       Note: set to true only if you know what you're doing :) .`,
      choices: [
        { value: 'false', title: 'false: ignore self-signed SSL certs' },
        { value: 'true', title: `true: self-signed certs won't work` },
      ],
      initial: 0,
    },
  ]);
  writeEnvFile(response, dryRun);
};

const confirmAndInstall = async (dryRun = false) => {
  console.clear();
  const response = await prompts([
    {
      type: 'confirm',
      name: 'confirmInstall',
      message: 'Do you wish to install ParrotJS server files in this folder?',
      initial: true,
    },
  ]);
  if (response.confirmInstall === true) {
    const isInstallSuccess = await execCommands(dryRun);
    console.log(process.cwd());
    if (!dryRun) {
      const parrotInstallPath = `${process.cwd()}/node_modules/@chyfra/parrot-js`;
      await copy(parrotInstallPath, process.cwd(), {
        overwrite: true,
      }).catch((e) => {
        console.log(
          kleur.red(`[Err] Coulnd't move ${parrotInstallPath} to ${process.cwd()}`),
          '\n',
          kleur.blue('Make sure the folder is writable and you have full access.'),
          '\n',
          e.toString(),
        );
      });
      await remove(parrotInstallPath).catch((e) => {
        console.log(kleur.yellow(`[Warn] Cannot remove '${parrotInstallPath}' folder.`));
        console.log(kleur.yellow(`[Warn] This is not catastrophic, but is unexpected.`));
        console.log(e);
      });
      await rename(`${process.cwd()}/.env.sample`, `${process.cwd()}/.env`).catch((e) => {
        console.log(
          kleur.red(`[Err] Can't copy the .env file`),
          '\n',
          e.toString(),
          '\n',
          kleur.blue(
            'You can still run ParrotJS Server by renaming the .env.sample to .env',
          ),
          '\n',
          kleur.blue('and customizing the .env file values.'),
        );
      });
      await rename(
        `${process.cwd()}/parrot.functions.sample.js`,
        `${process.cwd()}/parrot.functions.js`,
      ).catch((e) => {
        console.log(
          kleur.red(`Can't rename the parrot.functions.js file.`),
          '\n',
          e.toString(),
          '\n',
        );
      });
    }
    if (isInstallSuccess) {
      console.info(
        kleur.blue(
          '[i] Install complete! The next prompts will help you setup your .env file.',
        ),
      );
      startPostInstallConfig(dryRun);
      return;
    }
  }
};

const execCommands = (dryRun: boolean) => {
  const result = new Promise<string>((resolve, reject) => {
    console.log(kleur.blue('Installing files, please wait, this might take some time.'));
    if (dryRun) {
      resolve('Install finished! (dryRun)');
    } else {
      const packageName = '@chyfra/parrot-js';
      const npmProcess = spawn('npm', ['install', packageName], { stdio: 'inherit' });
      npmProcess.on('close', (code) => {
        if (code === 0) {
          resolve(`Installed ${packageName}.`);
        } else {
          console.error(`[${packageName}] Installation failed with code ${code}.`);
          reject(new Error(`npm install ${packageName} failed with code ${code}`));
        }
      });

      npmProcess.on('error', (err) => {
        console.error(`[${packageName}] Error spawning npm process: ${err}`);
        reject(err); // Reject if the process couldn't be spawned
      });
    }
  });
  return result;
};

const writeEnvFile = (
  config: {
    [key: string]: string;
  },
  dryRun: boolean,
) => {
  const result = Object.keys(config)
    .map((k) => `${k}=${config[k]}`)
    .toString()
    .replaceAll(',', '\n');
  if (dryRun) {
    console.log(kleur.blue('[i] Output .env file:'));
    console.log(kleur.bgGreen(kleur.black(result)));
  } else {
    writeFile('./.env', result, {
      encoding: config['PARROT_CACHE_FILE_ENCODING'] as BufferEncoding,
    })
      .then(() => {
        console.log(kleur.green('[ok] .env file written successfully!'));
        console.log(
          kleur.blue(
            '[i] To start the server, just run `npm start` inside the install folder.',
          ),
        );
      })
      .catch((e) => {
        console.error(
          kleur.red('An unexpected error occured when trying to write the .env file'),
        );
        console.error(kleur.red('Error details'), e.toString());
        console.info(kleur.blue('Below the generated .env file contents.'));
        console.log(result);
      });
  }
};

parseArgumentsAndStart();
