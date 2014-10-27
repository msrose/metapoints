# Metapoints

Increase your metapoints by contributing to this project.

Built with nodejs. You should know exactly what to do.

## But if you don't...

First of all, you get -1000 metapoints. Now follow these instructions to get set up.

Install [nodejs](http://nodejs.org/).

```
$ git clone https://github.com/msrose/metapoints metapoints
$ cd !$
$ touch points.json
$ node server.js points.json
```

Visit [http://localhost:1338/](http://localhost:1338/) to start getting meta.

## Configuring the Server

Start the server with optional command line arguments.

```
$ node server.js points.json [saveFreqInMins] [ip] [port]
```

- `saveFreqInMins`: The frequency with which the server writes the data to `points.json`. Default is `5`.
- `ip`: The address to start the HTTP server listening. Default is `localhost`.
- `port`: The port to start the server. Default is `1338`.

So if you specify your LAN IP, you can tell everyone on your network to sign up for metapoints at [http://you.lan.ip:1338]().

## Determining Your LAN IP

### On Windows

```
C:\Users\Me> ipconfig
```

and look for IPv4.

### On Unix

Not sure, but will find out soon. Try grepping through `ifconfig`.
