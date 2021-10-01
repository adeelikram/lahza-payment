
class LahzaPopup {
    private static creds: any = {}

    static setup(creds) {
        LahzaPopup.creds = creds
        LahzaPopup.creds.path = __LahzaPath()
        return this
    }

    static openIframe() {
        this.intializeContent()
        let iframer: HTMLIFrameElement = document.querySelector(".awsaassa-iframe")
        iframer.src += ""
        iframer.addEventListener("load", function () {
            document.querySelector(".Lahzaloader")["hidden"] = true
            iframer.contentWindow.postMessage(JSON.stringify(LahzaPopup.creds), "*")
        });
    }

    static onClose() {
        LahzaPopup.creds.onClose()
    }


    private static intializeContent() {
        var style = `.shade{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;z-index:1;background-color:#00000070}.card-link-frame{width:100%;height:100%}.bottom{position:absolute;bottom:10px;left:0;right:0;margin-right:auto;margin-left:auto;border-radius:5px}.closer{color:#fff;width:25px;height:25px;cursor:pointer;background-color:#fff;color:#fff;border-radius:50%;text-align:center;float:right;margin-right:-35px}.awsaassa-iframe{width:100%;height:100%;border-radius:5px}.popup-wrapper{position:absolute;top:40px;left:0;bottom:0;right:0;margin-left:auto;margin-right:auto;margin-bottom:auto;min-width:350px;width:40%;height:85%}.Lahzaloader{position:absolute;z-index:1;align-self:center;left:0;right:0;margin-left:auto;margin-right:auto;border:16px solid #f3f3f3;border-top:16px solid #3498db;border-radius:50%;width:70px;height:70px;animation:spin 2s linear infinite}#lahzaSecondFrame{width:90%!important;height:90%!important;top:20px!important}@keyframes spin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`
        document.head.appendChild(Object.assign(document.createElement("style"), { innerHTML: style }, { id: "LahzaBasicStyle" }))
        var html = ` <div class="shade"><div class="Lahzaloader"></div> <img width="200" height="30" class="bottom" src="${LahzaPopup.creds.path}/assets/bottom.png"><div class="popup-wrapper" id="lahzaFirstFrame"> <img src="${LahzaPopup.creds.path}/assets/close.svg" class="closer" onclick="__closeit()"> <iframe class="awsaassa-iframe" src="${LahzaPopup.creds.path}/content.html" frameborder="0" scrolling="no"></iframe></div><div class="popup-wrapper" id="lahzaSecondFrame" hidden> <img src="${LahzaPopup.creds.path}/assets/close.svg" class="closer" onclick="__LahzaPostAuth()"> <iframe class="awsaassa-iframe card-link-frame" frameborder="0"></iframe></div></div>`
        document.body.appendChild(Object.assign(document.createElement("div"), { innerHTML: html }))

        window.onmessage = function (e) {
            if (e.data == "success") {
                LahzaPopup.creds.callback({ success: true, message: "Transaction Successful" })
            }
            if (e.data == 'closenow') {
                __closeit()
            }
            if (e.data.includes("iframe")) {
                var url = JSON.parse(e.data).iframe.url
                document.querySelector("#lahzaFirstFrame")["hidden"] = true
                document.querySelector(".Lahzaloader")["hidden"] = false
                document.querySelector("#lahzaSecondFrame")["hidden"] = false
                var iframe:HTMLIFrameElement = document.querySelector(".card-link-frame")
                iframe.src = url
                iframe.onload = function () {
                    document.querySelector(".Lahzaloader")["hidden"] = true
                }
            }
        }
    }
}
// This function get all script tags from the page and get the path of our library 
function __LahzaPath() {
    var script = document.getElementsByTagName('script');
    for (var i of script) {
        if (i.src.includes("lahza.js")) {
            return i.src.replace("/lahza.js", "")
        }
    }
    return ""
}
// when 2nd frame for card auth link will be closed this function will be called
function __LahzaPostAuth() {
    document.querySelector("#lahzaSecondFrame")["hidden"] = true
    document.querySelector(".Lahzaloader")["hidden"] = true
    document.querySelector("#lahzaFirstFrame")["hidden"] = false
    var iframe: HTMLIFrameElement = document.querySelector("#lahzaFirstFrame > .awsaassa-iframe")
    iframe.contentWindow.postMessage("checkAuth", "*")
}

function __closeit() {
    document.querySelector(".shade").remove()
    document.querySelector("#LahzaBasicStyle").remove()
    LahzaPopup.onClose()
}

