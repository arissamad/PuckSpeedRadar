import Foundation

@objc(MyEventEmitter)
class MyEventEmitter: RCTEventEmitter {
  
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
      "image-available"
    ];
  }
  
  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
