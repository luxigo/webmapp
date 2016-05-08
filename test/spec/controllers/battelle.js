'use strict';

describe('Controller: BattelleCtrl', function () {

  // load the controller's module
  beforeEach(module('trackerApp'));

  var BattelleCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BattelleCtrl = $controller('BattelleCtrl', {
      $scope: scope
      // place here mocked dependencies
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(BattelleCtrl.awesomeThings.length).toBe(3);
  });
});
