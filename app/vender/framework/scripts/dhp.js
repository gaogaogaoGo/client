/*!
 * project name: Dhp.Web.Resources
 * name:         dhp.js
 * version:      v0.0.1
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2016/7/26
 */

'use strict';

var dhp;
(function (_, $) {
  // Application paths

  // Current application root path (including virtual directory if exists).
  _.appPath = _.appPath || '/';

  // Page load time.
  _.loadTime = Date.now();

  // Converts given path to absolute path using dhp.appPath variable.
  _.toDhpAppPath = function (path) {
    if (path.indexOf('/') === 0) {
      path = path.substring(1);
    }

    return _.appPath + path;
  };


  // Localization
  // Implements localization API that simplifies usage if localization scripts
  // generated by dhp.

  _.localization = _.localization || {};

  _.localization.defaultSourceName = undefined;

  _.localization.localize = function (key, sourceName) {
    sourceName = sourceName || _.localization.defaultSourceName;

    var source = _.localization.values[sourceName];

    if (!source) {
      _.log.warn('Could not find localization source: ' + sourceName);
      return key;
    }

    var value = source[key];

    if (value == undefined) {
      return key;
    }

    var copiedArguments = Array.prototype.slice.call(arguments, 0);
    copiedArguments.splice(1, 1);
    copiedArguments[0] = value;

    return _.utils.format.apply(this, copiedArguments);
  };

  _.localization.getSource = function (sourceName) {
    return function (key) {
      var copiedArguments = Array.prototype.slice.call(arguments, 0);
      copiedArguments.splice(1, 0, sourceName);

      return _.localization.localize.apply(this, copiedArguments);
    };
  };

  _.localization.isCurrentCulture = function (name) {
    return _.localization.currentCulture &&
           _.localization.currentCulture.name &&
           _.localization.currentCulture.name.indexOf(name) == 0;
  };

  _.localization.dhpWeb = _.localization.getSource('DhpWeb');


  // Authorization
  // Implements Authorization API that simplifies usage of authorization scripts
  // generated by dhp.

  _.auth = _.auth || {};

  _.auth.allPermissions = _.auth.allPermissions || {};

  _.auth.grantedPermissions = _.auth.grantedPermissions || {};

  // Deprecated. Use dhp.auth.isGranted instead.
  _.auth.hasPermission = function (permissionName) {
    return _.auth.isGranted.apply(this, arguments);
  };

  // Deprecated. Use dhp.auth.isAnyGranted instead.
  _.auth.hasAnyOfPermissions = function () {
    return _.auth.isAnyGranted.apply(this, arguments);
  };

  // Deprecated. Use dhp.auth.areAllGranted instead.
  _.auth.hasAllOfPermissions = function () {
    return _.auth.areAllGranted.apply(this, arguments);
  };

  _.auth.isGranted = function (permissionName) {
    return _.auth.allPermissions[permissionName] != undefined &&
           _.auth.grantedPermissions[permissionName] != undefined;
  };

  _.auth.isAnyGranted = function () {
    if (!arguments || arguments.length <= 0) {
      return true;
    }

    for (var i = 0; i < arguments.length; i += 1) {
      if (_.auth.isGranted(arguments[i])) {
        return true;
      }
    }

    return false;
  };

  _.auth.areAllGranted = function () {
    if (!arguments || arguments.length <= 0) {
      return true;
    }

    for (var i = 0; i < arguments.length; i += 1) {
      if (!_.auth.isGranted(arguments[i])) {
        return false;
      }
    }

    return true;
  };


  // Feature system
  // Implements Features API that simplifies usage of feature scripts generated by dhp.

  _.features = _.features || {};

  _.features.allFeatures = _.features.allFeatures || {};

  _.features.get = function (name) {
    return _.features.allFeatures[name];
  };

  _.features.getValue = function (name) {
    var feature = _.features.get(name);

    if (feature == undefined) {
      return undefined;
    }

    return feature.value;
  };

  _.features.isEnabled = function (name) {
    var value = _.features.getValue(name);
    return value == 'true' || value == 'True';
  };


  // Settings
  // Implements Settings API that simplifies usage of setting scripts generated by dhp.

  _.setting = _.setting || {};

  _.setting.values = _.setting.values || {};

  _.setting.get = function (name) {
    return _.setting.values[name];
  };

  _.setting.getBoolean = function (name) {
    var value = _.setting.get(name);
    return value == 'true' || value == 'True';
  };

  _.setting.getInt = function (name) {
    return parseInt(_.setting.values[name]);
  };


  // RealTime notifications

  _.notifications = _.notifications || {};

  _.notifications.severity = {
    INFO: 0,
    SUCCESS: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4
  };

  _.notifications.userNotificationState = {
    UNREAD: 0,
    READ: 1
  };

  _.notifications.getUserNotificationStateAsString = function (state) {
    switch (state) {
      case _.notifications.userNotificationState.READ:
        return 'READ';
      case _.notifications.userNotificationState.UNREAD:
        return 'UNREAD';
      default:
        _.log.warn('Unknown user notification state value: ' + state);
        return '?';
    }
  };

  _.notifications.getUiNotifyFuncBySeverity = function (severity) {
    switch (severity) {
      case _.notifications.severity.SUCCESS:
        return _.notify.success;
      case _.notifications.severity.WARN:
        return _.notify.warn;
      case _.notifications.severity.ERROR:
        return _.notify.error;
      case _.notifications.severity.FATAL:
        return _.notify.error;
      case _.notifications.severity.INFO:
      default:
        return _.notify.info;
    }
  };

  _.notifications.messageFormatters = {};

  _.notifications.messageFormatters['Dhp.Notifications.MessageNotificationData'] =
    function (userNotification) {
      return userNotification.notification.data.message;
    };

  _.notifications.messageFormatters['Dhp.Notifications.LocalizableMessageNotificationData'] =
    function (userNotification) {
      var localizedMessage = _.localization.localize(
        userNotification.notification.data.message.name,
        userNotification.notification.data.message.sourceName
      );

      if (userNotification.notification.data.properties) {
        if (!!$) {
          $.each(userNotification.notification.data.properties, function (key, value) {
            localizedMessage = localizedMessage.replace('{' + key + '}', value);
          });
        }
        else {
          var properties = Object.keys(userNotification.notification.data.properties);

          for (var i = 0; i < properties.length; i += 1) {
            localizedMessage = localizedMessage.replace(
              '{' + properties[i] + '}',
              userNotification.notification.data.properties[properties[i]]
            );
          }
        }
      }

      return localizedMessage;
    };

  _.notifications.getFormattedMsgFromUserNotification = function (userNotification) {
    var formatter = _.notifications.messageFormatters[userNotification.notification.data.type];

    if (!formatter) {
      _.log.warn(
        'No message formatter defined for given data type: ' +
        userNotification.notification.data.type
      );
      return '?';
    }

    if (!_.utils.isFunction(formatter)) {
      _.log.warn(
        'Message formatter should be a function! It is invalid for data type: ' +
        userNotification.notification.data.type
      );
      return '?';
    }

    return formatter(userNotification);
  };

  _.notifications.showUiNotifyForUserNotification = function (userNotification, options) {
    var message = _.notifications.getFormattedMsgFromUserNotification(userNotification);
    var uiNotifyFunc = _.notifications.getUiNotifyFuncBySeverity(
      userNotification.notification.severity
    );
    uiNotifyFunc(message, undefined, options);
  };


  // Logging
  // Implements Logging API that provides secure & controlled usage of console.log

  _.log = _.log || {};

  _.log.levels = { DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, FATAL: 5 };

  _.log.level = _.log.levels.DEBUG;

  _.log.log = function (logObject, logLevel) {
    if (!window.console || !window.console.log) {
      return;
    }

    if (logLevel != undefined && logLevel < _.log.level) {
      return;
    }

    console.log(logObject);
  };

  _.log.debug = function (logObject) {
    _.log.log("DEBUG: ", _.log.levels.DEBUG);
    _.log.log(logObject, _.log.levels.DEBUG);
  };

  _.log.info = function (logObject) {
    _.log.log("INFO: ", _.log.levels.INFO);
    _.log.log(logObject, _.log.levels.INFO);
  };

  _.log.warn = function (logObject) {
    _.log.log("WARN: ", _.log.levels.WARN);
    _.log.log(logObject, _.log.levels.WARN);
  };

  _.log.error = function (logObject) {
    _.log.log("ERROR: ", _.log.levels.ERROR);
    _.log.log(logObject, _.log.levels.ERROR);
  };

  _.log.fatal = function (logObject) {
    _.log.log("FATAL: ", _.log.levels.FATAL);
    _.log.log(logObject, _.log.levels.FATAL);
  };


  // Notification
  // Defines Notification API, not implements it

  _.notify = _.notify || {};

  _.notify.success = function (/*msg, title, options*/) {
    _.log.warn('dhp.notify.success is not implemented!');
  };

  _.notify.info = function (/*msg, title, options*/) {
    _.log.warn('dhp.notify.info is not implemented!');
  };

  _.notify.warn = function (/*msg, title, options*/) {
    _.log.warn('dhp.notify.warn is not implemented!');
  };

  _.notify.error = function (/*msg, title, options*/) {
    _.log.warn('dhp.notify.error is not implemented!');
  };


  // Message
  // Defines Message API, not implements it

  _.message = _.message || {};

  // TODO: Promise ?
  var showMsg = function (msg, title) {
    alert((title || '') + ' ' + msg);

    if (!$) {
      _.log.warn(
          'dhp.message can not return promise since jQuery is not defined!'
      );
      return null;
    }

    return $.Deferred(function ($dfd) {
      $dfd.resolve();
    });
  };

  _.message.info = function (msg, title) {
    _.log.warn('dhp.message.info is not implemented!');
    return showMsg(msg, title);
  };

  _.message.success = function (msg, title) {
    _.log.warn('dhp.message.success is not implemented!');
    return showMsg(msg, title);
  };

  _.message.warn = function (msg, title) {
    _.log.warn('dhp.message.warn is not implemented!');
    return showMsg(msg, title);
  };

  _.message.error = function (msg, title) {
    _.log.warn('dhp.message.error is not implemented!');
    return showMsg(msg, title);
  };

  _.message.confirm = function (msg, titleOrCb, cb) {
    _.log.warn('dhp.message.confirm is not implemented!');

    if (titleOrCb && !(typeof titleOrCb == 'string')) {
      cb = titleOrCb;
    }

    var result = confirm(msg);
    cb && cb(result);
  };


  // UI

  _.ui = _.ui || {};


  // UI block
  // Defines UI Block API, not implements it

  _.ui.block = function (/*elm*/) {
    _.log.warn('dhp.ui.block is not implemented!');
  };

  _.ui.unblock = function (/*elm*/) {
    _.log.warn('dhp.ui.unblock is not implemented!');
  };


  // UI busy
  // Defines UI Busy API, not implements it

  _.ui.setBusy = function (/*elm, optionsOrPromise*/) {
    _.log.warn('dhp.ui.setBusy is not implemented!');
  };

  _.ui.clearBusy = function (/*elm*/) {
    _.log.warn('dhp.ui.clearBusy is not implemented!');
  };


  // Simple event bus

  _.event = (function () {
    var _cbs = {};

    var on = function (evtName, cb) {
      if (!_cbs[evtName]) {
        _cbs[evtName] = [];
      }

      _cbs[evtName].push(cb);
    };

    var off = function (evtName, cb) {
      var cbs = _cbs[evtName];

      if (!cbs) {
        return;
      }

      var index = -1;

      for (var i = 0; i < cbs.length; i += 1) {
        if (cbs[i] === cb) {
          index = i;
          break;
        }
      }

      if (index < 0) {
        return;
      }

      _cbs[evtName].splice(index, 1);
    };

    var trigger = function (evtName) {
      var cbs = _cbs[evtName];

      if (!cbs || !cbs.length) {
        return;
      }

      var args = Array.prototype.slice.call(arguments, 1);

      for (var i = 0; i < cbs.length; i++) {
        cbs[i].apply(this, args);
      }
    };

    return {
      on: on,
      off: off,
      trigger: trigger
    };
  })();


  // Utils

  _.utils = _.utils || {};

  /**
   * Create a namespace.
   * @param root {object} -The root namespace object.
   * @param ns {string} -Namespace string.
   * @returns {*} The created namespace object chain.
   * @example
   *   var task = dhp.utils.createNamespace(dhp, 'services.task');
   *   service => dhp.services.task
   *   first argument (root) must be defined first.
   */
  _.utils.createNamespace = function (root, ns) {
    var parts = ns.split('.');

    for (var i = 0; i < parts.length; i += 1) {
      if (typeof root[parts[i]] === "undefined") {
        root[parts[i]] = {};
      }

      root = root[parts[i]];
    }

    return root;
  };

  /**
   * Find and replaces a string (search) to another string (replacement) in given string.
   * @param str {string} -The gaol of replaced string.
   * @param search {string} -The search string for replace.
   * @param replace {string} -The replaced.
   * @returns {string} Return replaced string.
   * @example
   *   dhp.utils.replace('This is a test string', 'is', 'X'); =>
   *   'ThX X a test string'
   */
  _.utils.replace = function (str, search, replace) {
    var fix = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return str.replace(new RegExp(fix, 'g'), replace);
  };

  /**
   * Formats a string just like string.Format in C#.
   * @param str {string} -A composite format string that includes one or more format items.
   * @param args0 {string} -The first or only object to format.
   *   ...
   * @returns {*} A copy of format in which the format items have been replaced
   *   by the string representations of the corresponding arguments.
   * @example
   *   dhp.utils.format('Hello {0}', 'Tu'); => Hello Tu
   */
  _.utils.format = function () {
    if (arguments.length < 1) {
      return null;
    }

    var str = arguments[0];

    for (var i = 1; i < arguments.length; i += 1) {
      var placeHolder = '{' + (i - 1) + '}';
      str = _.utils.replace(str, placeHolder, arguments[i]);
    }

    return str;
  };

  /**
   * The string to convert to pascal case.
   * @param str {string} -Converted to strings
   * @returns {*|string} String
   */
  _.utils.toPascalCase = function (str) {
    if (!str || !str.length) {
      return str;
    }

    if (str.length === 1) {
      return str.charAt(0).toUpperCase();
    }

    return str.charAt(0).toUpperCase() + str.substr(1);
  };

  /**
   * The string to convert to camel case.
   * @param str {string} -Converted to strings
   * @returns {*|string} String
   */
  _.utils.toCamelCase = function (str) {
    if (!str || !str.length) {
      return str;
    }

    if (str.length === 1) {
      return str.charAt(0).toLowerCase();
    }

    return str.charAt(0).toLowerCase() + str.substr(1);
  };

  /**
   * Truncate string.
   * @param str {string} -The string to be truncated.
   * @param length {number} -The string Cutting position.
   * @returns {*|string} Truncated string.
   */
  _.utils.truncate = function (str, length) {
    if (!str || !str.length || str.length <= length) {
      return str;
    }

    return str.substr(0, length);
  };

  /**
   * Truncate string with postfix.
   * @param str {string} -The string to be truncated.
   * @param length {number} -The string Cutting position.
   * @param postfix {string} -Postfix string.
   * @returns {*|string} Truncated string.
   */
  _.utils.truncateWithPostfix = function (str, length, postfix) {
    postfix = postfix || '...';

    if (!str || str.length || str.length <= length) {
      return str;
    }

    if (length <= postfix.length) {
      return postfix.substr(0, length);
    }

    return str.substr(0, length - postfix.length) + postfix;
  };

  /**
   * Gets a object is function.
   * @param obj {*} -Check to object.
   * @returns {boolean} True, if object is function.
   */
  _.utils.isFunction = function (obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  };

  /**
   * Empty function.
   */
  _.utils.loop = function () {};


  // Timing

  _.timing = _.timing || {};

  _.timing.utcClkProvider = (function () {
    var toUtc = function (date) {
      return Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
        date.getUTCMilliseconds()
      );
    };

    var now = function () {
      return Date.now();
    };

    var normalize = function (date) {
      if (!date) {
        return date;
      }

      return new Date(toUtc(date));
    };

    return {
      now: now,
      normalize: normalize
    };
  })();

  _.timing.localClkProvider = (function () {
    var toLocal = function (date) {
      return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds(),
        date.getMilliseconds()
      );
    };

    var now = function () {
      return toLocal(Date.now());
    };

    var normalize = function (date) {
      if (!date) {
        return date;
      }

      return toLocal(date);
    };

    return {
      now: now,
      normalize: normalize
    };
  })();

  dhp.timing.unspecifiedClockProvider = (function () {
    var now = function () {
      return new Date();
    };

    var normalize = function (date) {
      return date;
    };

    return {
      now: now,
      normalize: normalize
    };
  })();

  _.timing.convertToUserTimezone = function (date) {
    var local = date.getTime();
    var utc = local + (date.getTimezoneOffset() * 60000);
    var target =
      parseInt(utc) +
      parseInt(_.timing.timeZoneInfo.windows.currentUtcOffsetInMilliseconds);
    return new Date(target);
  };


  // Clock

  _.clock = _.clock || {};

  _.clock.provider = _.timing.unspecifiedClockProvider;

  _.clock.now = function () {
    if (!!_.clock.provider) {
      return _.clock.provider.now();
    }

    return Date.now();
  };

  _.clock.normalize = function (date) {
    if (_.clock.provider) {
      return _.clock.provider.normalize(date);
    }

    return date;
  };
})(dhp || (dhp = {}), jQuery);
 
