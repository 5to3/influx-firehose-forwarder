# influx-firehose-forwarder

![Travis (.org)](https://img.shields.io/travis/marianzange/influx-firehose-forwarder.svg)
![npm](https://img.shields.io/npm/v/influx-firehose-forwarder.svg)

A simple forwarder that acts as an InfluxDB subscriber, forwarding each write to an AWS Firehose
stream. This forwarder is useful if you want to do just in time backups of writes to an InfluxDB.
It acts as a subscriber that is called by InfluxDB upon every single write. Since InfluxDB retries
failed sends, this code doesn't include any queing or retry logic.

At 5to3 we're running this on a Raspberry Pi in our lab. It collects data from multiple sensors
and stores it in InfluxDB. To avoid data loss in the worst-case-scenario, we're directly
shipping off each measurement to a Firehose stream with S3 backend.

## Installation

The easiest way is to install this package globally through NPM:

```bash
$ npm -i -g influx-firehose-forwarder
```

## How to keep it running

If you're running the forwarder on an OS with systemd, you can easily add it as a unit
to keep it running and automatically restarting in case of an error. Simply use the following
example unit as a starting point for your own configuration.

```
[Unit]
Description=InfluxDB Firehose forwarder

[Service]
ExecStart=/usr/local/bin/node /opt/firehose/app.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=influx-firehose-forwarder
User=someuser
Group=somegroup
Environment=NODE_ENV=production
Environment=FH_HOST=localhost
Environment=FH_PORT=3000

[Install]
WantedBy=multi-user.target
```

## Adding the forwarder as a subscriber to InfluxDB

Use the Influx shell to add the forwarder as a new subscriber:

```bash
$ influx
> CREATE SUBSCRIPTION "sub0" ON "your_db"."autogen" DESTINATIONS ALL 'http://127.0.0.1:3000'
> SHOW SUBSCRIPTIONS
name: your_db
retention_policy name mode destinations
---------------- ---- ---- ------------
autogen          sub0 ALL  [http://127.0.0.1:3000]
```
