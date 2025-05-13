# 🦜 ParrotJS

Frontend development made easy.

## What is ParrotJS?

ParrotJS is a _"cache"_ server that will remember your frontend app requests and respond to them with the same way your backend would.

Suppose we have the following communication flow:

```text

[Frontend] <=> [Backend]
        HTTP API

```

If we add ParrotJS to the mix we would now have the following flow:

```text
                        HTTP API
[Frontend] <=> [ParrotJS] <=> [Backend]
        HTTP API (cache)

```

ParrotJS will pretend to be your Backend by responding with the same headers and body for each type of your requests. If your backend is down/unreachable/offline you can keep working because ParrotJS will still _parrot_ the same responses it's keeping in cache.

## Getting started

To install ParrotJS Server, head to an empty folder for example:
`cd ~/workspace/parrot-my-cool-app`

Then run the following command:
`npx @chyfra/parrot-js --install`

Follow the prompts and once done, just run:
`npm start`

## Motivation

If you're a Frontend developer, like me. You've surely had to deal with some kind of backend API. The biggest hurdle is usually to run that backend API or call it remotely. This is where usually things become less _"standard"_ and you find yourself in one of those situations :

- Run the backend locally in your machine and call it locally
- Call a remote backend in a staging server for example
- Call the live server (yes, some teams do that for some reason)
- Run a Docker container with the backend
- Etc...

Of course, there are many drawbacks to this situation:

- Running the backend locally is resource intensive
- Having to keep up with the backend's dev progress
- Having to install all the needed backend's tools and dev environnement
- If the backend is not up to date or the dev is lagging behind, it will slow your frontend dev
- If the backend is down, you can't work until it's fixed
- Etc...

## What ParrotJS can do for you?

ParrotJS Server is a simple **cache** server. Its purpose is to relay any request from your frontend app to the backend then intercept the backend's response and send it to the frontend app.

Behind the scenes, ParrotJS Server will then build a cache folder and file hiearchy of all the requests and responses. It will be able to _"Parrot"_ those requests again and again.

### How it works

First you'll configure your Parrot. Second you'll point your frontend to Parrot. Finally you'll use your frontend app as usual and keep an eye on the cache folder.

1. Head to a folder for example `~/workspace/parrot-my-cool-app`, this will be your cache server for your backend. Parrot will make sure to keep your cache neatly organized in that folder.
2. Run the command `npx @chyfra/parrot-js --install`, the CLI will ask you few questions to initialize an `.env` and `parrot.functions.js` files.
3. Once done, just run `npm start` in that same folder.
4. Head to your frontend dev app and point your base URL to Parrot's address and port (defaults to `localhost:1120`)
5. Start your frontend dev app and navigate through it to make API calls. The more the better.
6. Note how Parrot is creating a `requests.json` file and subfolders with `*_body.json` and `*_headers.json` files in a `cache` folder.

Now let's understand how you can use all this at your advantage. Let's say that you have a simple `GET /user/ID_0029`:

- Under the folder `~workspace/parrot-my-cool-app/cache/` you'll notice a `requests.json`. It contains a stringified JSON array of all your intercepted requests. In this case you'll find an entry like the following:

```json
[
  {
    "method": "GET",
    "url": "/user",
    "body": {},
    "code": 200,
    "headers": "cache/user/ID_0029_headers_rand0mText.json",
    "response": "cache/user/ID_0029_body_rand0mText.json"
  }
]
```

- Each request will be indexed in the `requests.json` file
- Each request will point to a different `*_headers.json` and `*_body.json`
  - Headers will contain the response headers of your API, useful if for example you're using the headers to send important frontend data
  - Body contains the API's response body this makes it easy to change/edit

That's it! You can even add files on the fly or edit those JSONs and call Parrot's API, it will just respond with the new files' contents.

### Other useful features

Parrot can also be useful if you want to mock your backend API for quick testing purposes. Let's say you need the following endpoint:

`GET /products/P_00001`

You can simply head to the `cache/requests.json` and add an entry like:

```json
[
  {
    "method": "GET",
    "url": "/products/P_00001",
    "body": {},
    "code": 200,
    "responseHeaders": {
      "content-type": "application/json",
      "x-special-header": "My cool header app"
    },
    "responseBody": {
      "name": "Cool product 1",
      "id": "P_00001",
      "price": "99.99",
      "currency": "EUR"
    }
  }
]
```

If you request the resource for example:

```bash
curl https://localhost:9443/products/P_00001 --insecure -v
```

The result will be:

```text
< HTTP/1.1 200 OK
< X-Powered-By: Express
< Access-Control-Allow-Origin: *
< Content-Type: application/json; charset=utf-8
< x-special-header: My cool header app
< Content-Length: 73
< ETag: W/"49-FGon8DAcaTrGVIBfGfpE4N/I7z8"
< Date: Sun, 16 Feb 2025 16:04:06 GMT
< Connection: keep-alive
< Keep-Alive: timeout=5
<
* Connection #0 to host localhost left intact
{"name":"Cool product 1","id":"P_00001","price":"99.99","currency":"EUR"}
```

As you can see, Parrot responds to the request with the JSON headers and content you've set.

## Why not just mock in the frontend?

In a perfect world, I would mock all my API endpoints and go by my day. But if you've worked in any business context, you know how impossible this task can be. From one side, you have a backend that evolves with a separate team. And from another, the project manager asking you to ship your work ASAP.

Parrot relives you from mocking your APIs and just keeps a copy of your expected API responses. What's better is that you can even change the responses to test your code and how the UI will react to those changes without having to change anything in your frontend code.

## What about privacy?

ParrotJS runs (and should always run) in your local environnement to keep all your requests and responses safe. Everything is saved in plain JSON files you can read, change and delete. No data is collected about you, your work, or anything. This is also why ParrotJS is FREE and OpenSource.

## Current limitations/planned improvements

- [ ] Corporate proxy is hit or miss (Needs more testing, works for me behind my corporate office's proxy)
- [ ] Compare request content and privilege responses with content rather than without
- [ ] Ignore specific response codes? (this is possible to some extend in parrot.functions.js)
- [ ] Handles only JSON responses: Parrot handles all kind of responses but serializes them into JSON, not sure it's the best format tough
- [ ] Error catching (some cases where an error is thrown are not handled properly)
- [ ] Parse and call OpenAPI files? (could be useful to fetch and cache an entire collection)
- [ ] Smart error catching (for example if `/user/ID_0029` is cached, respond with the same data for `/user/ID_0030` and increment relevant items)
- [ ] Multiple API base URLs?
- [ ] Interactive-mode CLI for API handling? (useful?)
- [ ] WS and WSS protocol?
- [ ] GraphQL support?
- [ ] Add stats? (ttfb with target server, diff, cache?)
- [ ] Throttling to emulate slow API responses
- [x] Add timestamps and random IDs for requests
- [x] Add log files
- [ ] Visual/GUI/Web-server frontend tool?
- [x] Adding a plain JSON file in the `requests.json` (gets transformed) or handled like json with ref files?
- [x] Wildcard handling eg. `/api/v1/user/*/settings`
- [x] Add skip fetch remote mode (cache only)
- [ ] Add custom user function for skip mode in parrot.functions.js
- [ ] Improvements to wildcard handling (better responses?)
- [ ] `parrot.functions.js` in TS too?
- [ ] npx installer in a single line
- [ ] Make parrot act like a brwoser proxy and/or start a browser instance using puppeteer or playwright
- [ ] Session storage (store a `parrot.session.json`) that would contain the app's state (eg.: intercept mode disabled) and custom user values (like saving the auth token)
- [ ] Reconfiguration wizard through npm to reconfigure the `.env` file
- [ ] Override mode: don't override wildcards

## Contribute

This project is an idea I want to share with the world to make development easier for all of us. If you have a suggestion/idea, I will be very happy to communicate with you and improve this small piece of software.
