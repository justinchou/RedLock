/**
 * FileName: RedLock
 * Created by "Justin Chou <zhou78620051@126.com>".
 * On Date: 6/15/2015.
 * At Time: 16:33 AM
 */

var path = require("path");
var util = require("util");
var uuid = require("uuid");
var redis = require("redis");
var async = require("async");
var sleep;
try {
    sleep = require("../build/Release/sleep.node");
} catch (e) {
    console.warn("C++ Version Node-Sleep Not Compiled! Use JS Version");
    sleep = {
        "sleep": function () {
            console.warn("sleep func in RedLock algorithm is not valid!");
        },
        "usleep": function () {
            console.warn("usleep func in RedLock algorithm is not valid!");
        }
    }
}

var unlock_script = require("fs").readFileSync(path.join(__dirname, "unlock_script.lua"));

function PositiveNumber(num) {
    if (typeof num != "number") {
        return 0;
    }
    if (num < 0) {
        return 0;
    }
    return num;
}

function RedLock(servers, retryDelay, retryCount) {
    if (!util.isArray(servers)) {
        throw new Error("Argument Servers Must Be An Array");
    }
    this.retryDelay = PositiveNumber(retryDelay) || 200;
    this.retryCount = PositiveNumber(retryCount) || 3;
    this.clockDriftFactor = 0.01;

    this.quorum = Math.min(servers.length, Math.floor(servers.length / 2, 10) + 1);

    this.servers = servers;
    this.instances = [];
}

/**
 * Lock With Retry
 * @param {String} resource:
 * @param {Number} ttl:
 * @param {Function} cb
 */
RedLock.prototype.lock = function (resource, ttl, cb) {
    var self = this;
    this.__initInstance();

    var token = uuid.v4().replace(/-/g, "");
    var retry = self.retryCount;
    var lockStatus = false;

    async.doUntil(
        function(cb){
            self.__trySingleLock(resource, ttl, token, function(err, data){
                if (err) {
                    var delay = parseInt(Math.floor(self.retryDelay / 2) + Math.random() * self.retryDelay, 10);
                    sleep.usleep(delay * 1000000);
                    retry -= 1;
                    cb(null);
                    return;
                }
                lockStatus = data;
                cb(null);
            });
        },
        function(){
            return retry <= 0 || lockStatus;
        },
        function(err){
            cb(null, lockStatus);
        }
    );
};

/**
 * Try To Lock One Time
 * @param resource
 * @param ttl
 * @param token
 * @param cb
 * @private
 */
RedLock.prototype.__trySingleLock = function (resource, ttl, token, cb) {
    var self = this;
    self.__initInstance();
    var quorum = 0;
    var startTime = new Date().valueOf();

    async.times(self.instances.length, function (n, next) {
        self.__lockInstance(self.instances[n], resource, token, ttl, function (err, counter) {
            quorum += counter;
            next(null);
        });
    }, function (err, data) {
        var drift = (ttl * self.clockDriftFactor) + 2;
        var validityTime = ttl - (new Date().valueOf() - startTime) / 1000 - drift;

        if (quorum >= self.quorum && validityTime > 0) {
            cb(null, {
                'validity': validityTime,
                'resource': resource,
                'token': token
            });
        } else {
            self.unlock({
                'resource': resource,
                'token': token
            });
            var msg = util.format("Lock Failed Need [ %s ] quorum, But Only [ %s ] Voted And Left Time Is  %s !", self.quorum, quorum, validityTime);
            cb(new Error(msg));
        }
    });
}

/**
 * UnLock
 * @param {Object} lock {"resource":String, "token":String}
 *
 * OR
 *
 * @param {String} resource
 * @param {String} token
 */
RedLock.prototype.unlock = function () {
    var self = this;
    self.__initInstance();

    var resource, token;
    if (arguments.length == 1) {
        resource = arguments[0].resource;
        token = arguments[0].token;
    } else {
        resource = arguments[0];
        token = arguments[0];
    }

    this.instances.forEach(function (instance) {
        self.__unlockInstance(instance, resource, token);
    });
};

/**
 * init connection
 * @private
 */
RedLock.prototype.__initInstance = function () {
    var self = this;
    if (self.instances.length == 0) {
        self.servers.forEach(function (server) {
            var client = redis.createClient(server.port, server.host, {debug: true});
            client.on('error', function (err) {
                console.error('Connect Redis Error: %s', err.stack);
            });
            self.instances.push(client);
        });
    }
};

/**
 * Lock Single Instance
 * @param {Object} instance: Redis Connection Instance
 * @param {String} resource:
 * @param {String} token:
 * @param {Number} ttl:
 * @param {Function=} cb
 * @private
 */
RedLock.prototype.__lockInstance = function (instance, resource, token, ttl, cb) {
    instance.set(resource,token,"PX",ttl,"NX",function(err, flag){
        if (err || flag != "OK") {
            cb(null, 0);
        } else {
            cb(null, 1);
        }
    });
};

/**
 * UnLock Single Instance
 * @param {Object} instance: Redis Connection Instance
 * @param {String} resource:
 * @param {String} token:
 * @param {Function=} cb
 * @private
 */
RedLock.prototype.__unlockInstance = function (instance, resource, token, cb) {
    if (typeof cb != "function") {
        cb = function () {
        };
    }
    instance.eval(unlock_script, 1, resource, token, cb);
};

module.exports = RedLock;
