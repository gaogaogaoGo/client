/*!
 * project name: Dhp.Web.Resources
 * name:         dhp.toastr.js
 * version:      v0.0.1
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2016/7/26
 */

'use strict';

var dhp;
(function (_) {
  if (!window.toastr) {
    return;
  }

  window.toastr.options.positionClass = 'toast-bottom-right';

  var showNotification = function (type, message, title, options) {
    window.toastr[type](message, title, options);
  };

  _.notify.success = function (message, title, options) {
    showNotification('success', message, title, options);
  };

  _.notify.info = function (message, title, options) {
    showNotification('info', message, title, options);
  };

  _.notify.warn = function (message, title, options) {
    showNotification('warning', message, title, options);
  };

  _.notify.error = function (message, title, options) {
    showNotification('error', message, title, options);
  };
})(dhp || (dhp = {}));
 
