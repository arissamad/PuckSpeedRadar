//
//  blob_labeler.swift
//  PuckSpeedRadar
//
//  Created by Aris Samad-Yahaya on 3/27/21.
//

import Foundation
import SwiftImage

class BlobLabeler {
  
  var width: Int = 0;
  var height: Int = 0;
  var arrayLength: Int = 0;
  
  var objectColor: Bool = true;
  var backgroundColor: Bool = false;
  var noLabelValue: Int = 0;
  
  var labelCount: Int = 100;
  
  var binaryData: Image<Bool>;
  var labelImage: [Int] = [];
  
  var allBlobs: [Blob];
  var blobLookup: [Int: Blob];
  
  init() {
    allBlobs = [];
    blobLookup = [:];
    binaryData = Image<Bool>(width: 5, height: 5, pixel: false)
  }
  
  /**
   * Each byte in binaryData is either 0 or 1.
   */
  func processImage(incomingBinaryData: Image<Bool>, incomingWidth: Int, incomingHeight: Int) {
    self.binaryData = incomingBinaryData;
    self.width = incomingWidth;
    self.height = incomingHeight;
    
    arrayLength = width * height;
    //labelImage = new byte[arrayLength];
    labelImage = [Int](repeating: 0, count: arrayLength);
    
    // Prevent edge errors by filling 1-pixel background border all around
    
    // First, make the first and last row completely background. This way I don't have to add offset.
    for x in 0..<width {
      binaryData[x, 0] = false;
      binaryData[x, height-1] = false;
    }
    
    // Sides
    for y in 0..<height {
      binaryData[0, y] = false;
      binaryData[width-1, y] = false;
    }
    
    for y in 0..<height-1 {
      for x in 0..<width {
        
        let value: Bool = binaryData[x, y];
        
        //do {
        if(value == true) {
          if (isNewExternalContour(x, y) && hasNoLabel(x, y)) {
            labelImage[index(x,y)] = labelCount;
            let outerContour: Polygon = traceContour(x, y, labelCount, 1);
            
            let blob: Blob = Blob(outerContour: outerContour, label: labelCount);
            allBlobs.append(blob);
            blobLookup[labelCount] = blob;
            
            //++labelCount;
            labelCount+=1;
          }
          
          //do {
          // isNewInternalContour(x,y);
          //            } catch {
          //              print("Problem with isNewInternalContour.");
          //              isNewInternalContour(x,y);
          //            }
          
          if (isNewInternalContour(x, y)) {
            var label: Int = labelImage[index(x,y)];
            if (hasNoLabel(x, y)) {
              label = labelImage[index(x-1, y)];
              labelImage[index(x,y)] = label;
            }
            
            //do{
            let innerContour: Polygon = traceContour(x, y, label, 2);
            
            let blob: Blob = blobLookup[label]!;
            blob.addInnerContour(innerContour);
            
            //              } catch {
            //                print("Got exception: ");
            //                traceContour(x, y, label, 2);
            //              }
          } else if (hasNoLabel(x, y)) {
            
            let precedingLabel: Int = labelImage[index(x-1, y)];
            labelImage[index(x,y)] = precedingLabel;
          }
        }
        //        } catch {
        //          print("Exception at ");
        //        }
      }
    }
  }
  
  func index(_ x: Int, _ y: Int) -> Int {
    var index: Int = (y * width) + x;
    if(index > arrayLength-1) {
      index = arrayLength-1;
    }
    return index;
  }
  
  func hasNoLabel(_ x: Int, _ y: Int) -> Bool {
    let label = labelImage[index(x,y)];
    return label == noLabelValue;
  }
  
  func isNewExternalContour(_ x: Int, _ y: Int) -> Bool {
    return isBackground(x, y - 1);
  }
  
  func isNewInternalContour(_ x: Int, _ y: Int) -> Bool {
    return isBackground(x, y + 1) && !isMarked(x, y + 1);
  }
  
  func isMarked(_ x: Int, _ y: Int) -> Bool {
    return labelImage[index(x, y)] == -1;
  }
  
  func isBackground(_ x: Int, _ y: Int) -> Bool {
    return binaryData[x, y] == backgroundColor;
  }
  
  func traceContour(_ x: Int, _ y: Int, _ label: Int, _ start: Int) -> Polygon{
    
    let contour = Polygon();
    let startPoint = BPoint(x, y);
    contour.addPoint(x, y);
    
    var nextPoint: BPoint = nextPointOnContour(startPoint, start);
    
    if (nextPoint.x == -1) {
      // Point is isolated;
      return contour;
    }
    let T = BPoint(nextPoint.x, nextPoint.y);
    var equalsStartpoint = false;
    repeat {
      contour.addPoint(nextPoint.x, nextPoint.y);
      labelImage[index(nextPoint.x, nextPoint.y)] = label;
      equalsStartpoint = nextPoint.equals(startPoint);
      nextPoint = nextPointOnContour(nextPoint, -1);
      
      if(nextPoint.getY() > height) {
        print("Next point has exceeded height: \(nextPoint.getY())");
        return contour;
      }
      if(nextPoint.getX() > width) {
        print("Next point has exceeded width: \(nextPoint.getX())");
        return contour;
      }
    } while (!equalsStartpoint || !nextPoint.equals(T));
    
    return contour;
  }
  
  var iterationorder: [Int] = [ 5, 4, 3, 6, 2, 7, 0, 1 ];
  var prevContourPoint: BPoint?;
  
  // start = -1 -> ?
  // start = 1 -> External Contour
  // start = 2 -> Internal Contour
  func nextPointOnContour(_ startPoint: BPoint, _ incomingStart: Int) -> BPoint {
    var start = incomingStart; // Needed so it's a var and not a let
    /*
     ************
     *5 * 6 * 7 *
     *4 * p * 0 *
     *3 * 2 * 1 *
     ************
     */
    var indexToPoint = [BPoint](repeating: BPoint(0, 0), count: 8);
    
    var neighbors: [Bool] = [Bool](repeating: false, count: 8); // neighbors of p
    let x = startPoint.x;
    let y = startPoint.y;
    
    let I = 2;
    let k = I - 1;
    
    var u: Int = 0;
    for i in 0..<3 {
      for j in 0..<3 {
        let window_x: Int = (x - k + i);
        let window_y: Int = (y - k + j);
        if (window_x != x || window_y != y) {
          neighbors[iterationorder[u]] = binaryData[window_x, window_y];
          indexToPoint[iterationorder[u]] = BPoint(window_x, window_y);
          u += 1;
        }
      }
    }
    
    let NOSTARTPOINT: Int = -1;
    let STARTEXTERNALCONTOUR: Int = 1;
    let STARTINTERNALCONTOUR: Int = 2;
    
    if(start == NOSTARTPOINT) {
      let prevContourPointIndex: Int = indexToPoint.firstIndex(where: { $0.getX() == prevContourPoint!.getX() && $0.getY() == prevContourPoint!.getY() })!;
      start = (prevContourPointIndex + 2) % 8;
    } else if(start == STARTEXTERNALCONTOUR) {
      start = 7;
    } else if(start == STARTINTERNALCONTOUR) {
      start = 3;
    }
    
    var counter: Int = start;
    var pos: Int = -2;
    
    var returnPoint: BPoint?;
    while (pos != start) {
      pos = counter % 8;
      if (neighbors[pos] == objectColor) {
        prevContourPoint = startPoint;
        returnPoint = indexToPoint[pos];
        return returnPoint!;
      }
      let p: BPoint = indexToPoint[pos];
      if (neighbors[pos] == backgroundColor) {
        //do {
        labelImage[index(p.x, p.y)] = -1;
        //        } catch {
        //          print("GOT AN EXCEPTION");
        //        }
      }
      
      counter += 1;
      pos = counter % 8;
    }
    
    let isIsolated: BPoint = BPoint(-1, -1);
    return isIsolated;
  }
  
  func filterBlobs() {
    for i in (0..<allBlobs.count).reversed() {
      let blob = allBlobs[i];
      if(blob.getArea() < 100) {
        allBlobs.remove(at: i);
      }
    }
  }
  
  func getBlobs() -> [Blob] {
    return allBlobs;
  }
  
  func findMostLikelyBlob() -> Blob? {
    //do {
    if(allBlobs.count == 0) {
      return nil;
    }
    
    //SortedMap<Double, Blob> sortedMap = new TreeMap();
    var sortedDict:[Double: Blob] = [:];
    
    for blob in allBlobs {
      var score: Double = 0; // The smaller score wins.
      let circularity: Double = blob.getCircularity();
      
      if(circularity > 200) {
        continue; // Just too not circular.
      }
      
      // The bigger the circularity, the less circular, and the less likely it's our blob.
      // 10 means really circular.
      //double circularityScore = circularity / 500;
      //if(circularityScore > 1) circularity = 1;
      
      //score += circularityScore;
      score = 1/blob.getArea();
      
      sortedDict[score] = blob;
    }
    
    if(sortedDict.count == 0) {
      return nil;
    }
    
    let sortedResults = sortedDict.sorted(by: { $0.key < $1.key })
    
    let winnerBlob: Blob = sortedResults[0].value;
    
    //let cg: BPoint = winnerBlob.getCenterOfGravity();
    
    mark(winnerBlob.getCenterOfGravity());
    
    return winnerBlob;
    //    } catch {
    //      print("Error in findMostLikelyBlob");
    //      return nil;
    //    }
  }
  
  func printDebuggingInfo() {
    print("Number of blobs found: \(allBlobs.count)");
    
    var i=0;
    for blob in allBlobs {
      print("  Blob \(i): CG: \(blob.getCenterOfGravity().getX()), \(blob.getCenterOfGravity().getY()) Area: \(blob.getArea()) Perimeter: \(blob.getPerimeter()) Circularity: \(blob.getCircularity())");
      
      i += 1;
    }
  }
  
  func mark(_ point: BPoint) {
    var max: Int = width * height;
    max = max - 1;
    
    var currColor: Bool = backgroundColor;
    
    for i in -15..<15 {
      
      if(i%2 == 0) { currColor = backgroundColor }
      else { currColor = objectColor; }
      
      var x: Int = point.getX() + i;
      if(x < 0) { x = 0; }
      if(x > max) { x = max; }
      
      binaryData[x, point.getY()] = currColor;
      
      var y: Int = point.getY() + i;
      if(y < 0) { y = 0; }
      if(y > max) { y = max; }
      binaryData[point.getX(), y] = currColor;
      
    }
  }
}
