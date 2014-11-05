# Metapoints

Increase your metapoints by contributing to this project.

Built with nodejs. You should know exactly what to do.

## But if you don't...

First of all, you get -1000 metapoints. Now follow these instructions to get set up.

Install [nodejs](http://nodejs.org/).

```
$ git clone https://github.com/msrose/metapoints metapoints
$ cd !$
$ cp config.example.json config.json
$ cp authquestions.example.json authquestions.json
$ node server.js
```

Visit [http://localhost:1338/](http://localhost:1338/) to start getting meta.

## Configuring the Server

Start the server with optional command line argument indicating the config file to use.

```
$ node server.js points.json [configFile]
```

See the [example config file](./config.example.json) and the [example auth questions file](./authquestions.example.json) for how to format config and auth questions.
