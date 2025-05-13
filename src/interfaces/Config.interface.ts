import { AxiosProxyConfig } from 'axios';
import { Request } from 'express';
import { StoredCachedRequest } from './StoredCachedRequest.interface';

export interface Config {
  httpsPort: number;
  httpPort: number;
  host: string;
  cachePath: string;
  requestsCacheFileName: string;
  encoding: BufferEncoding;
  baseUrl: string;
  bypassCache: boolean;
  overrideMode: boolean;
  skipRemote: boolean;
  isHttps: boolean;
  rejectUnauthorized: boolean;
  proxy: false | AxiosProxyConfig | undefined;
  logLevel: string;
  matchBy: (
    request: Request,
    cache: Array<StoredCachedRequest>,
  ) => StoredCachedRequest | null;
  customUserFn: CustomUserFn | undefined;
}

export type CustomUserFn = {
  matchBy:
    | undefined
    | ((
        request: Request,
        cache: Array<StoredCachedRequest>,
      ) => StoredCachedRequest | null);
  onBeforeRequest: undefined | (<T>(req: Request<T>) => Request<T>);
};
