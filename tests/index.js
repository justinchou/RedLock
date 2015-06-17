/**
 * var sleep = require("../build/Release/sleep.node");
 * console.log(new Date().valueOf());
 * sleep.usleep(10000000);
 * console.log(new Date().valueOf());
 */

var RedLock = require("../src/RedLock");
var sleep = require("../build/Release/sleep.node");

var servers = [
    {host: '127.0.0.1', port: 6379},
    {host: '127.0.0.1', port: 6380},
    {host: '127.0.0.1', port: 6381}
];
var lock = new RedLock(servers);

var lockKey = "test";
var ttl = 10000;
var falseTimes = 0;
require("async").timesSeries(10000, function (times, next) {
    lock.lock(lockKey, ttl, function (err, result) {
        if (result) {
            console.warn("The %d Times Lock Time [ %j ] [ %j ]", times, new Date(), result);
        } else {
            console.warn("The %d Times Lock Time [ %j ] [ %j ]", times, new Date(), result);
        }
        sleep.sleep(1000);
        next(err, result);
    });
}, function (err, data) {
    console.warn(arguments);
});
