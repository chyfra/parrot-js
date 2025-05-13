import dotenv from 'dotenv';
import { Request } from 'express';
import { Config, CustomUserFn } from '../interfaces/Config.interface';
import { StoredCachedRequest } from '../interfaces/StoredCachedRequest.interface';

dotenv.config();

const matchByPath = `${process.cwd()}/parrot.functions.js`;

class ParrotConfig implements Config {
  public tempLogs: Array<{
    level: string;
    message: string;
  }> = [];

  // https://github.com/webpack/webpack/issues/4175#issuecomment-323023911
  requireDynamically(path: string) {
    path = path.split('\\').join('/');
    return eval(`require('${path}');`);
  }

  parseCustomUserFn = (): CustomUserFn | undefined => {
    try {
      const customUserFn = this.requireDynamically(matchByPath);
      this.tempLogs.push({
        level: 'info',
        message: `FILE '${matchByPath}' found, using user's 'parrot.functions.js'.`,
      });
      return {
        matchBy: customUserFn?.matchBy,
        onBeforeRequest: customUserFn?.onBeforeRequest,
      };
    } catch (e) {
      this.tempLogs.push({
        level: 'warn',
        message: `FILE '${matchByPath}' NOT found, using defaults.  ${JSON.stringify(e)}`,
      });
    }
    return undefined;
  };

  public customUserFn = this.parseCustomUserFn();

  safeCachePath = (value: string | undefined, defaultValue: string): string => {
    if (value) {
      if (value.includes(':/')) {
        // User set up a windows absolute path
        return value;
      } else if (value[0] === '/') {
        // User set up an absolute unix path
        return value;
      } else {
        // User set up a relative path
        return `${process.cwd()}/${value}`;
      }
    }
    // Default value
    return `${process.cwd()}/${defaultValue}`;
  };

  httpsPort = Number(process.env['PARROT_HTTPS_PORT']) || 9443;

  httpPort = Number(process.env['PARROT_HTTP_PORT']) || 1120;

  cachePath = this.safeCachePath(process.env['PARROT_CACHEPATH'], 'cache');

  requestsCacheFileName = process.env['PARROT_CACHE_FILENAME'] ?? 'requests.json';

  encoding = (process.env['PARROT_CACHE_FILE_ENCODING'] ?? 'utf8') as BufferEncoding;
  baseUrl = process.env['PARROT_API_BASE'] || 'http://localhost';
  bypassCache = process.argv.find((v) => v === 'bypass') ? true : false;
  overrideMode = false;
  skipRemote = false;
  isHttps = this.baseUrl.includes('https') || false;
  host = `http${this.isHttps ? 's' : ''}://localhost`;
  rejectUnauthorized =
    (process.env['PARROT_REJECT_UNAUTHORIZED']
      ? /true/.test(process.env['PARROT_REJECT_UNAUTHORIZED'])
      : false) || false;
  proxy = false as const;
  logLevel = process.env['PARROT_LOG_LEVEL']
    ? process.env['PARROT_LOG_LEVEL'].toLowerCase()
    : 'error';
  matchBy = (
    request: Request,
    cache: Array<StoredCachedRequest>,
  ): StoredCachedRequest | null => {
    const cachedRequest = cache.find(
      (cReq: StoredCachedRequest) =>
        cReq.method === request.method && cReq.url === request.url,
    );
    return cachedRequest || null;
  };
}

export const ServerConfig = new ParrotConfig();
