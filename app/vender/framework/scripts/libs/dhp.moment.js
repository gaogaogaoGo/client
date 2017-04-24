/*!
 * project name: Dhp.Web.Resources
 * name:         dhp.moment.js
 * version:      v0.0.1
 * author:       w.xuan
 * email:        pro.w.xuan@.gmail.com
 * date:         2016/7/26
 */

'use strict';

var dhp;
(function (_) {
  if (!moment || !moment.tz) {
    return;
  }

  _.timing = _.timing || {};

  _.timing.convertToUserTimezone = function (date) {
    var momentDate = moment(date);
    var targetDate = momentDate.clone().tz(
      _.timing.timeZoneInfo.iana.timeZoneId
    );

    return targetDate;
  };
})(dhp || (dhp = {}));
 
