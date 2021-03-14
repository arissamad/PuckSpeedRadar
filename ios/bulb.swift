//
//  bulb.swift
//  PuckSpeedRadar
//
//  Created by Aris Samad-Yahaya on 3/14/21.
//

import Foundation

@objc(Bulb)
class Bulb: NSObject {
  
  @objc static var isOn = false
  
  @objc func turnOn() {
    Bulb.isOn = true
    print("Bulb is now ON 2")
  }
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
