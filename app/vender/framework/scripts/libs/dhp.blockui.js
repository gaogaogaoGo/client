/*!
 * project name: Dhp.Web.Resources
 * name:         dhp.blockui.js
 * version:      v0.0.1
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2016/7/26
 */

'use strict';

var dhp;
(function (_, $) {
  if (!$ || !$.blockUI) {
    return;
  }

  $.extend($.blockUI.defaults, {
    message: ' ',
    css: { },
    overlayCSS: {
      backgroundColor: '#aaa',
      opacity: .3,
      cursor: 'wait'
    }
  });

  _.ui.block = function (elm) {
    if (!elm) {
      $.blockUI();
    }
    else {
      $(elm).block();
    }
  };

  _.ui.unblock = function (elm) {
    if (!elm) {
      $.unblockUI();
    }
    else {
      $(elm).unblock();
    }
  };
})(dhp || (dhp = {}), jQuery);
 
