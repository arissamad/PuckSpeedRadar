//
//  polygon.swift
//  PuckSpeedRadar
//
//  Created by Aris Samad-Yahaya on 3/27/21.
//

import Foundation

class Polygon {
  
  var xpoints: [Int];
  var ypoints: [Int];
  
  init() {
    xpoints = [];
    ypoints = [];
  }
  
  func addPoint(_ x: Int, _ y: Int) {
    xpoints.append(x);
    ypoints.append(y);
  }
  
  func getX(_ index: Int) -> Int {
    return xpoints[index];
  }
  
  func getY(_ index: Int) -> Int {
    return ypoints[index];
  }
  
  func size() -> Int {
    return xpoints.count;
  }
  
  func getXPoints() -> [Int] {
    let newArray = xpoints;
    return newArray;
  }
  
  func getYPoints() -> [Int] {
    let newArray = ypoints;
    return newArray;
  }
}
