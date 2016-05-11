/*
 * notify.js
 *
 * Copyright (c) 2016 ALSENET SA
 *
 * Author(s):
 *
 *      Luc Deschenaux <luc.deschenaux@freesurf.ch>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Additional Terms:
 *
 *      You are required to preserve legal notices and author attributions in
 *      that material or in the Appropriate Legal Notices displayed by works
 *      containing it.
 *
 *      You are required to attribute the work as explained in the "Usage and
 *      Attribution" section of <http://doxel.org/license>.
 */

'use strict';

/**
 * @ngdoc service
 * @name webmappApp.notify
 * @description
 * # notify
 * Service in the webmappApp.
 */
angular.module('webmappApp')
  .service('notify', function () {
    // AngularJS will instantiate a singleton by calling "new" on this function
    this.message=function(message){
      $.notify({
        // options, see http://bootstrap-notify.remabledesigns.com/
        message: '<span class="fa fa-exclamation-triangle">&nbsp;</span>'+message
      },
      {
        // settings, see http://bootstrap-notify.remabledesigns.com/
        delay: 5000
      });
    }

  });
