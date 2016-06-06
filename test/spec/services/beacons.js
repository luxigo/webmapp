'use strict';

describe('Service: beacons', function () {

  // load the service's module
  beforeEach(module('webmappApp'));

  // instantiate service
  var beacons;
  beforeEach(inject(function (_beacons_) {
    beacons = _beacons_;
  }));

  it('should do something', function () {
    expect(!!beacons).toBe(true);
  });

});
