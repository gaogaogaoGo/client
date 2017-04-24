/*!
 * project name: Dhp.Web.Resources
 * name:         dhp.sweetalert.js
 * version:      v0.0.1
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2016/8/19
 */

'use strict';

var dhp;
(function (_, $) {
  if (!$ || !window.sweetAlert) {
    return;
  }

  var wa = window.sweetAlert;

  _.libs = _.libs || {};

  _.libs.sweetAlert = {
    config: {
      default: {},
      info: { type: 'info' },
      success: { type: 'success' },
      warn: { type: 'warning' },
      error: { type: 'error' },
      confirm: {
        type: 'warning',
        title: 'Are you sure?',
        showCancelButton: true,
        cancelButtonText: 'Cancel',
        confirmButtonColor: "#dd6b55",
        confirmButtonText: 'Yes'
      }
    }
  };

  var showMsg = function (type, msg, title) {
    if (!title) {
      title = msg;
      msg = undefined;
    }

    var options = $.extend(
      {},
      _.libs.sweetAlert.config.default,
      _.libs.sweetAlert.config[type],
      {
        title: title,
        text: msg
      }
    );

    return $.Deferred(function ($dfd) {
      wa(options, function () {
        $dfd.resolve();
      });
    });
  };

  _.message.info = function (msg, title) {
    return showMsg('info', msg, title);
  };

  _.message.success = function (msg, title) {
    return showMsg('success', msg, title);
  };

  _.message.warn = function (msg, title) {
    return showMsg('warn', msg, title);
  };

  _.message.error = function (msg, title) {
    return showMsg('error', msg, title);
  };

  _.message.confirm = function (msg, title, cb) {
    if ($.isFunction(title)) {
      cb = title;
      title = null;
    }

    var options = $.extend(
      {},
      _.libs.sweetAlert.config.default,
      _.libs.sweetAlert.config.confirm,
      {
        text: msg,
        title: title
      }
    );

    return $.Deferred(function ($dfd) {
      wa(options, function (confirmed) {
        cb && cb(confirmed);
        $dfd.resolve(confirmed);
      });
    });
  };

  _.event.on('dhp.dynamicScriptsInitialized', function () {
    _.libs.sweetAlert.config.confirm.title = _.localization.dhpWeb('AreYouSure');
    _.libs.sweetAlert.config.confirm.cancelButtonText = _.localization.dhpWeb('Cancel');
    _.libs.sweetAlert.config.confirm.confirmButtonText = _.localization.dhpWeb('Yes');
  });
})(dhp || (dhp = {}), jQuery);
 
