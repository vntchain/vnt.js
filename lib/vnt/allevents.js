/*
    This file is part of vnt.js.

    vnt.js is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    vnt.js is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with vnt.js.  If not, see <http://www.gnu.org/licenses/>.
*/
/**
 * @file allevents.js
 * @author Marek Kotewicz <marek@ethdev.com>
 * @date 2014
 */

var sha3 = require('../utils/sha3');
var Event = require('./event');
var formatters = require('./formatters');
var utils = require('../utils/utils');
var Filter = require('./filter');
var watches = require('./methods/watches');

var AllEvents = function (requestManager, json, address) {
    this._requestManager = requestManager;
    this._json = json;
    this._address = address;
};

AllEvents.prototype.encode = function (options) {
    options = options || {};
    var result = {};

    ['fromBlock', 'toBlock'].filter(function (f) {
        return options[f] !== undefined;
    }).forEach(function (f) {
        result[f] = formatters.inputBlockNumberFormatter(options[f]);
    });

    result.address = this._address;

    return result;
};

AllEvents.prototype.decode = function (data) {
    data.data = data.data || '';


    var eventTopic = (utils.isArray(data.topics) && utils.isString(data.topics[0])) ? data.topics[0].slice(2) : '';
    var match = this._json.filter(function (j) {
        return eventTopic === sha3(utils.transformToFullName(j));
    })[0];

    if (!match) { // cannot find matching event?
        return formatters.outputLogFormatter(data);
    }

    var event = new Event(this._requestManager, match, this._address);
    return event.decode(data);
};

AllEvents.prototype.execute = function (options, callback) {

    if (utils.isFunction(arguments[arguments.length - 1])) {
        callback = arguments[arguments.length - 1];
        if(arguments.length === 1)
            options = null;
    }

    var o = this.encode(options);
    var formatter = this.decode.bind(this);
    return new Filter(o, 'vnt', this._requestManager, watches.vnt(), formatter, callback);
};

AllEvents.prototype.attachToContract = function (contract) {
    var execute = this.execute.bind(this);
    contract.allEvents = execute;
};

module.exports = AllEvents;