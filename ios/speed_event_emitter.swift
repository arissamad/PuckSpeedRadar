import Foundation

@objc(SpeedEventEmitter)
class SpeedEventEmitter: RCTEventEmitter {
  
  var hasListener: Bool = false
  
  @objc override func startObserving() {
    hasListener = true
    print("startObserving()");
  }
  
  @objc override func stopObserving() {
    hasListener = false
    print("stopObserving()");
  }
  
  
  @objc override func supportedEvents() -> [String]! {
    return [
      "speed-available"
    ];
  }
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
