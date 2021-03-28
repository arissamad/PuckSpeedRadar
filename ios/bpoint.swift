//
//  bpoint.swift
//  PuckSpeedRadar
//
//  Created by Aris Samad-Yahaya on 3/27/21.
//

import Foundation

class BPoint {
  var x: Int;
  var y: Int;
  
  init(_ incomingX: Int, _ incomingY: Int) {
    x = incomingX;
    y = incomingY;
  }
  
  func getX() -> Int {
    return x;
  }

  func setX(incomingX: Int) {
    x = incomingX;
  }

  func getY() -> Int {
    return y;
  }

  func setY(incomingY: Int) {
    y = incomingY;
  }
  
  func equals(_ other: BPoint) -> Bool {
    if(x != other.x) { return false; }
    if(y != other.y) { return false; }
    
    return true;
  }
  
  func toString() -> String {
    return "(\(x), \(y)";
  }
}
