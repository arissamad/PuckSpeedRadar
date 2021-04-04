//
//  bulb.swift
//  PuckSpeedRadar
//
//  Created by Aris Samad-Yahaya on 3/14/21.
//
import AVFoundation
import Foundation

@objc(Bulb)
class Bulb: NSObject {
  
  @objc static var isOn = false
  
  @objc func turnOn() {
    Bulb.isOn = true
    print("Bulb is now ON")
    
    let speechSynthesizer = AVSpeechSynthesizer();
    speechSynthesizer.speak(AVSpeechUtterance(string: "The bulb is now on. Your shot speed is 75 miles per hour."));
  }
  
  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
