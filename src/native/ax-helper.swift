#!/usr/bin/env swift

import Cocoa
import ApplicationServices
import Foundation

struct UIElement: Codable {
    let role: String
    let title: String?
    let description: String?
    let x: Int
    let y: Int
    let width: Int
    let height: Int
    let children: [UIElement]?
}

func getElementInfo(_ element: AXUIElement, depth: Int = 0) -> UIElement? {
    guard depth < 3 else { return nil }  // Limit depth
    
    var role: AnyObject?
    var title: AnyObject?
    var description: AnyObject?
    var position: AnyObject?
    var size: AnyObject?
    
    AXUIElementCopyAttributeValue(element, kAXRoleAttribute as CFString, &role)
    AXUIElementCopyAttributeValue(element, kAXTitleAttribute as CFString, &title)
    AXUIElementCopyAttributeValue(element, kAXDescriptionAttribute as CFString, &description)
    AXUIElementCopyAttributeValue(element, kAXPositionAttribute as CFString, &position)
    AXUIElementCopyAttributeValue(element, kAXSizeAttribute as CFString, &size)
    
    var point = CGPoint.zero
    var sizeVal = CGSize.zero
    
    if let pos = position {
        AXValueGetValue(pos as! AXValue, .cgPoint, &point)
    }
    if let sz = size {
        AXValueGetValue(sz as! AXValue, .cgSize, &sizeVal)
    }
    
    var children: [UIElement]? = nil
    var childrenRef: AnyObject?
    AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &childrenRef)
    
    if let childArray = childrenRef as? [AXUIElement], depth < 2 {
        children = childArray.compactMap { getElementInfo($0, depth: depth + 1) }
    }
    
    return UIElement(
        role: (role as? String) ?? "unknown",
        title: title as? String,
        description: description as? String,
        x: Int(point.x),
        y: Int(point.y),
        width: Int(sizeVal.width),
        height: Int(sizeVal.height),
        children: children
    )
}

func getMenuBarItems() -> [UIElement] {
    var result: [UIElement] = []
    
    let systemWide = AXUIElementCreateSystemWide()
    
    // Get all running apps
    let runningApps = NSWorkspace.shared.runningApplications
    
    for app in runningApps {
        guard app.activationPolicy == .regular || app.activationPolicy == .accessory else { continue }
        
        let appElement = AXUIElementCreateApplication(app.processIdentifier)
        
        var menuBar: AnyObject?
        AXUIElementCopyAttributeValue(appElement, kAXMenuBarAttribute as CFString, &menuBar)
        
        if let menu = menuBar as! AXUIElement? {
            if let menuInfo = getElementInfo(menu, depth: 0) {
                result.append(menuInfo)
            }
        }
    }
    
    // Also get system menu bar extras (Control Center, etc.)
    if let menuBarOwnerPID = NSRunningApplication.runningApplications(withBundleIdentifier: "com.apple.controlcenter").first?.processIdentifier {
        let ccElement = AXUIElementCreateApplication(menuBarOwnerPID)
        if let info = getElementInfo(ccElement, depth: 0) {
            result.append(info)
        }
    }
    
    return result
}

func findElementByName(_ name: String) -> UIElement? {
    let systemWide = AXUIElementCreateSystemWide()
    var focusedApp: AnyObject?
    AXUIElementCopyAttributeValue(systemWide, kAXFocusedApplicationAttribute as CFString, &focusedApp)
    
    guard let app = focusedApp as! AXUIElement? else { return nil }
    
    func searchElement(_ element: AXUIElement, for searchName: String, depth: Int = 0) -> UIElement? {
        guard depth < 5 else { return nil }
        
        var title: AnyObject?
        var description: AnyObject?
        AXUIElementCopyAttributeValue(element, kAXTitleAttribute as CFString, &title)
        AXUIElementCopyAttributeValue(element, kAXDescriptionAttribute as CFString, &description)
        
        let titleStr = (title as? String)?.lowercased() ?? ""
        let descStr = (description as? String)?.lowercased() ?? ""
        let searchLower = searchName.lowercased()
        
        if titleStr.contains(searchLower) || descStr.contains(searchLower) {
            return getElementInfo(element)
        }
        
        var children: AnyObject?
        AXUIElementCopyAttributeValue(element, kAXChildrenAttribute as CFString, &children)
        
        if let childArray = children as? [AXUIElement] {
            for child in childArray {
                if let found = searchElement(child, for: searchName, depth: depth + 1) {
                    return found
                }
            }
        }
        
        return nil
    }
    
    return searchElement(app, for: name)
}

// Main
let args = CommandLine.arguments

if args.count < 2 {
    print("{\"error\": \"Usage: ax-helper <command> [args]\"}")
    exit(1)
}

let command = args[1]

switch command {
case "menu-bar":
    let items = getMenuBarItems()
    let encoder = JSONEncoder()
    encoder.outputFormatting = .prettyPrinted
    if let json = try? encoder.encode(items) {
        print(String(data: json, encoding: .utf8)!)
    }
    
case "find":
    if args.count < 3 {
        print("{\"error\": \"Usage: ax-helper find <element-name>\"}")
        exit(1)
    }
    let name = args[2]
    if let element = findElementByName(name) {
        let encoder = JSONEncoder()
        if let json = try? encoder.encode(element) {
            print(String(data: json, encoding: .utf8)!)
        }
    } else {
        print("{\"error\": \"Element not found\"}")
    }
    
case "focused":
    let systemWide = AXUIElementCreateSystemWide()
    var focusedElement: AnyObject?
    AXUIElementCopyAttributeValue(systemWide, kAXFocusedUIElementAttribute as CFString, &focusedElement)
    
    if let element = focusedElement as! AXUIElement? {
        if let info = getElementInfo(element) {
            let encoder = JSONEncoder()
            if let json = try? encoder.encode(info) {
                print(String(data: json, encoding: .utf8)!)
            }
        }
    } else {
        print("{\"error\": \"No focused element\"}")
    }
    
default:
    print("{\"error\": \"Unknown command: \(command)\"}")
}
