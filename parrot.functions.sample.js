'use strict';

/**
 * This is a basic example of the matching function you should implement
 * This is how Parrot will match your requests by default.
 * Feel free to customize this function to suit your needs.
 * @param {Express.Request} request the actual request you've sent to Parrot
 * @param {Array<CachedRequest>} cache the full cache array from `requests.json`
 * @returns CachedRequest
 */
function matchBy(request, cache) {
  const cachedRequest = cache.find((cachedRequestItem) => {
    if (cachedRequestItem.method === request.method) {
      const cachedRequestUrlElements = cachedRequestItem.url.split('/');
      const requestUrlElements = request.url.split('/');
      if (cachedRequestUrlElements.length === requestUrlElements.length) {
        const r = cachedRequestUrlElements.reduce((acc, el, idx) => {
          return (el === requestUrlElements[idx] || el === '*') && acc;
        }, true);
        return r;
      }
    }
    return false;
  });
  return cachedRequest || null;
}
/**
 * This function will get called after your your frontend is received by parrot
 * and before parrot requests at its turn the remote API. It helps you for example
 * change the headers like in this example, add an auth token
 * @param {Express.request} request
 * @returns Express.request
 */
function onBeforeRequest(request) {
  // You can for example add a custom auth token
  // request.headers['authorization'] = 'Bearer MY_TOP_SECRET_TOKEN';
  return request;
}

module.exports = {
  matchBy,
  onBeforeRequest,
};
