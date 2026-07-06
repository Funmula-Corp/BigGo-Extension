//
//  ViewController.swift
//  Shared (App)
//
//  Created by Eric on 2021/11/22.
//

import WebKit
import Cocoa
import SafariServices
typealias PlatformViewController = NSViewController

let extensionBundleIdentifier = "com.funmula.biggo.extension.macos.appex"

class ViewController: PlatformViewController, WKNavigationDelegate, WKScriptMessageHandler {
    
    private var isDark: Bool { NSApp.effectiveAppearance.name == NSAppearance.Name.darkAqua }
    private var isLight: Bool { NSApp.effectiveAppearance.name == NSAppearance.Name.aqua }


    @IBOutlet var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self
        self.webView.configuration.userContentController.add(self, name: "controller")
        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }
    
    override func viewDidAppear() {
        super.viewDidAppear()
        
        self.view.window?.backgroundColor = .white
        self.view.window?.titlebarAppearsTransparent = true
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        webView.evaluateJavaScript("show('mac')")

        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            guard let state = state, error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }

            DispatchQueue.main.async {
                webView.evaluateJavaScript("show('mac', \(state.isEnabled)")
            }
        }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if((message.body as! String).hasPrefix("https")) {
            guard let url = URL(string: (message.body as! String)) else { return }
            NSWorkspace.shared.open(url)
            return;
        }

        if(message.body as! String == "close") {
            self.view.window?.close()
            return;
        }
        
        if (message.body as! String != "open-preferences") {
            return;
        }

        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            guard error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }

            DispatchQueue.main.async {
                NSApplication.shared.terminate(nil)
            }
        }
    }
}
