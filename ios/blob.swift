//
//  blob.swift
//  PuckSpeedRadar
//
//  Created by Aris Samad-Yahaya on 3/27/21.
//

import Foundation

class Blob {

  var label: Int;
  var outerContour: Polygon;
  var innerContours: [Polygon];
  
  var area: Double = -1.0;
  var perimeter: Double = -1.0;
  var circularity: Double = -1.0;
  var centerOfGravity: BPoint?;
  
  init(outerContour: Polygon, label: Int) {
    self.outerContour = outerContour;
    self.label = label;
    innerContours = [];
  }
  
  //  funcfunc  addInnerContour(contour: Polygon) {
//    innerContours.append(contour);
//  }
  func addInnerContour(_ contour: Polygon) {
    innerContours.append(contour);
  }
  
  func getArea() -> Double {
    if(area != -1) {
      return area;
    }
    
    let polyPoints = outerContour;
    
    var j: Int;
    let n = polyPoints.size();
    area = 0;

    for i in 0..<n {
      j = (i + 1) % n;
      area += Double(polyPoints.getX(i) * polyPoints.getY(j));
      area -= Double(polyPoints.getX(j) * polyPoints.getY(i));
    }
    area /= 2.0;
    area = abs(area);
    return area;
  }
  
  // A true circle is roughly 12.5, with the numbers getting bigger as they are less circular.
  func getCircularity() -> Double {
    if(circularity != -1){
      return circularity;
    }
    
    let perimeter = getPerimeter();
    let size = getArea();
    
    circularity = (perimeter*perimeter) / size;
    return circularity;
  }
  
  func getPerimeter() -> Double {
    
    if(perimeter != -1){
      return perimeter;
    }
    
    let contour = outerContour;
  
    var peri: Double = 0;
    if(contour.size() == 1)
    {
      peri=1;
      return peri;
    }
    let cc = contourToChainCode(contour: contour);
    var sum_gerade: Int = 0;
    for i in 0..<cc.count {
      if(cc[i] % 2 == 0){
        sum_gerade += 1;
      }
    }
    peri = Double(sum_gerade) * 0.948 + Double((cc.count - sum_gerade)) * 1.340;
    return peri;
  }
  
  func contourToChainCode(contour: Polygon) -> [Int] {
    var chaincode: [Int] = [Int](repeating: 0, count: contour.size() - 1);
    for i in 1..<contour.size() {
      let dx: Int = contour.getX(i) - contour.getX(i-1);
      let dy: Int = contour.getY(i) - contour.getY(i-1);
      
      if(dx == 1 && dy == 0){
        chaincode[i-1] = 0;
      }
      else if(dx == 1 && dy == 1){
        chaincode[i-1] = 7;
      }
      else if(dx == 0 && dy == 1){
        chaincode[i-1] = 6;
      }
      else if(dx == -1 && dy == 1){
        chaincode[i-1] = 5;
      }
      else if(dx == -1 && dy == 0){
        chaincode[i-1] = 4;
      }
      else if(dx == -1 && dy == -1){
        chaincode[i-1] = 3;
      }
      else if(dx == 0 && dy == -1){
        chaincode[i-1] = 2;
      }
      else if(dx == 1 && dy == -1){
        chaincode[i-1] = 1;
      }
    }
    
    return chaincode;
  }
  
  func getCenterOfGravity() -> BPoint {
    
    if(centerOfGravity != nil){
      return centerOfGravity!;
    }
    
    let x: [Int] = outerContour.getXPoints();
    let y: [Int] = outerContour.getYPoints();
    var sumx: Int = 0;
    var sumy: Int = 0;
    var A: Double = 0;
    
    for i in 0..<outerContour.size()-1 {
      let cross: Int = (x[i] * y[i+1] - x[i+1] * y[i]);
      sumx = sumx + (x[i] + x[i+1]) * cross;
      sumy = sumy + (y[i] + y[i+1]) * cross;
      let part = x[i] * y[i+1] - x[i+1] * y[i];
      A = A + Double(part);
    }
    
    A = 0.5 * A;
    let A6 = 6 * Int(A);
    
    // Trying to fix divide by 0 when coordinates are very close to each other (int rounds to 0)
    if (A6 == 0) {
      return BPoint(x[0], y[0]);
    }
    
    centerOfGravity = BPoint(Int(sumx / A6), Int(sumy / A6));
    
    if(getArea() == 1) {
      centerOfGravity = BPoint(x[0], y[0]);
    }
    
    return centerOfGravity!;
  }
  
  func getOuterContour() -> Polygon {
    return outerContour;
  }
}
