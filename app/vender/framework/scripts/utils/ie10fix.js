/*!
 * project name: Dhp.Web.Resources
 * name:         ie10fix.js
 * version:      v0.0.1
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2016/7/26
 */

'use strict';

(function () {
  // Windows Phone 8 and Internet Explorer 10 FIX
  if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
    var msViewportStyle = document.createElement("style");
    msViewportStyle.appendChild(
      document.createTextNode(
        "@-ms-viewport{width:auto!important}"
      )
    );

    document.getElementsByTagName("head")[0].appendChild(msViewportStyle);
  }
})();
 
