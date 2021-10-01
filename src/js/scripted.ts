
declare var customer: any
declare var transaction: string
declare var axios: any

// this function will send html code after user transaction is completed 
function getSuccessContent() {
    var { currency, amount, name } = customer
    var temp = `
    <img src="assets/tick.PNG" alt="" class="d-block mx-auto mt-5 mb-2">
    <div class="text-white h1 text-center">Payment Successful</div>
    <div class="text-center text-white h6 mb-5">You have paid ${amount} ${currency} to ${name}</div>
    `
    parent.postMessage("success", '*')
    hideShowEl(".accordion-header", null)
    var el = Array.from(document.querySelectorAll(".accordion-item"))
    for (let i = 1; i < el.length; i++) {
        el[i]["style"].border = "none"
    }
    setTimeout(() => {
        parent.postMessage("closenow", "*")
    }, 3000)
    return temp
}

// this function will send html code of buttons prenset in error screen for other payment methods
function getError(btn1: String, btn2: String) {
    let q = []
    var err_btn1 = ""
    var err_btn2 = ""
    if (btn1 == "USSD" && btn2 == "QR") {
        q = ["#card-error", "#before-payment-card", "headingTwo", "headingThree"]
    }
    else if (btn1 == "Card" && btn2 == "USSD") {
        q = ["#qr-error", "#before-payment-qr", "headingOne", "headingTwo"]
    }
    else if (btn1 == "QR" && btn2 == "Card") {
        q = ["#ussd-error", "#before-payment-ussd", "headingThree", "headingOne"]
    }
    if (customer["channels"].includes(btn1.toLowerCase())) {
        err_btn1 = `<button onclick="document.getElementById('${q[2]}').children[0].click()" class="btn col-md-6 offset-md-3 bg-light my-1 col-10 offset-1 fw-bold">
                        Try paying with ${btn1} 
                        </button>`
    }
    if (customer["channels"].includes(btn2.toLowerCase())) {
        err_btn2 = `<button onclick="document.getElementById('${q[3]}').children[0].click()" class="btn col-md-6 offset-md-3 bg-light my-1 col-10 offset-1 fw-bold">
                        Try paying with ${btn2} 
                        </button>`
    }
    var temp = `
    <img src="assets/warning.png" class="d-block mx-auto my-3" alt="">
    <div class="h4 text-white text-center">The transaction was not completed</div>
    ${err_btn1}
    ${err_btn2}
    <a href="#" onclick="hideShowEl('${q[0]}','${q[1]}')" class="col-4 d-block mx-auto text-center text-decoration-none">&#8635; Try again</a>
    `
    return temp
}

// this function will render html code for header of payment methods
function getCurrNameAmount() {
    var { currency, amount, name } = customer
    var temp = `
    <span>${currency}</span> <span>${amount}
         <div class="name-text">${name}</div>
    </span>
    `
    return temp
}

// this function will replace the selected node from top one and keep payment methods in the same order
// like card -> ussd -> qr
async function checker(e: HTMLDivElement) {
    var items = document.querySelectorAll(".accordion-item")
    var arr = Array.from(items)
    for (var i = 1; i < arr.length; i++) {
        if (arr[i].children[0].id == e.id) {
            e["style"].display = "none"
        }
        else {
            arr[i].children[0]["style"].display = "block"
        }
    }
    if (arr.length > 1) {
        var accordion = document.querySelector("#popup")
        accordion.insertBefore(e.parentNode, accordion.children[1])
        if (accordion.children[2]?.children[0].id == "headingThree" && accordion.children.length == 4) {
            accordion.insertBefore(accordion.children[3], accordion.children[2])
        }
        else if (accordion.children[3]?.children[0].id == "headingOne") {
            accordion.insertBefore(accordion.children[3], accordion.children[2])
        }

    }
    // in case user quickly clicks on same area


    if (e.innerHTML.includes("QR") && !document.querySelector("#before-payment-qr")["hidden"]) {
        hideShowEl(null, ".spinbuldak")
        try {
            var res = await axios.post(
                `${url}/generate`,
                {
                    transaction: Number(transaction)
                }, { headers: { "accept": "application/json" } })
        } catch (error) {
            apiFailure()
            return
        }

        hideShowEl(".spinbuldak", null)
        var qr = document.querySelector("#intializeQR")
        qr.innerHTML = ""
        qr.innerHTML = renderQRImg(res.data.data.url)
        
    }
}


// This function will be called from Pay button of the card payment method
// will call api for payment if api respond will auth link it will open card auth window
// otherwise show success message 
async function chargeCard(e) {
    if (e) {
        e.preventDefault()
        e.target.disabled = true
        hideShowEl("#before-payment-card", null)
        hideShowEl(null, ".spinbuldak")
        var vals = document.querySelectorAll("#validTill, #cvv, #cardno")
        try {
            var res = await axios.post(
                `${url}/charge`,
                {
                    "card": vals[0]["value"].replace(/\s/g, ""),
                    "expiry": vals[1]["value"],
                    "cvv": vals[2]["value"]
                })
        } catch (error) {
            apiFailure()
            return
        }

        hideShowEl(".spinbuldak", null)
        if (res.data.status == "success") {
            if ("link" in res.data) {
                hideShowEl("#before-payment-card, #card-error, #card-success-ms", "#card-auth")
                customer["cardAuthLink"] = res.data.link
            }
            else {
                hideShowEl(`#before-payment-card, #card-error, #card-auth`, null)
                Object.assign(document.querySelector(`#card-success-ms`), { hidden: false }, { innerHTML: getSuccessContent() })
                console.log(res.data)
            }
        }
        else {
            hideShowEl(`#before-payment-card, #card-success-ms, #card-auth`, null)
            Object.assign(document.querySelector(`#card-error`), { hidden: false }, { innerHTML: getError("USSD", "QR") })
        }
    }
}

// This function will post message to open 2nd iframe for card auth link 
function openIframe() { //when #card-auth-link will be clicked
    parent.postMessage(JSON.stringify({ iframe: { url: customer["cardAuthLink"] } }), "*")
}

// After user chooses the bank from ussd payment method
// this method will be called to get transaction code from api
async function chooseBank(n) {
    hideShowEl("#banks", ".spinbuldak")
    try {
        var res = await axios.post(
            `${url}/reference`,
            {
                transaction: Number(transaction),
                channel: Number(n)
            }
        )
    } catch (error) {
        apiFailure()
        return
    }

    hideShowEl(".spinbuldak", null)
    console.log(res.data.data)
    Object.assign(document.querySelector("#choosenBank"), { hidden: false }, { innerHTML: renderChosenBank(n, res.data.data.code) })
}

// revert back from 2nd screen of bank codes if user click cancel on ussd payment method
function banks() {
    document.getElementById("copied-code").innerHTML = "click here to copy";
    hideShowEl("#choosenBank", "#banks")
}

// This function will copy the transaction code to clipboard
async function copy(obj, code) {
    await navigator.clipboard.writeText(`${code}`)
    obj.innerHTML = "Copied!"
}

// This function will confirm the transation by calling reference query api
async function tranSuccess(str) {
    // show spinbuldak
    hideShowEl(null, ".spinbuldak")
    hideShowEl(`#before-payment-${str}`, null)
    // get data from axios
    try {
        var res = await axios.post(
            `${url}/reference_query`,
            {
                reference: transaction
            })
    } catch (error) {
        apiFailure()
        return
    }

    hideShowEl(".spinbuldak", null)
    console.log("transaction id:", transaction)
    console.log(res.data)
    if (res.data.status == "success" || res.data.status == "1" || res.data.status == true || res.data.status == "true") {
        hideShowEl(`#before-payment-${str}, #${str}-error`, null)
        Object.assign(document.querySelector(`#${str}-success-ms`), { hidden: false }, { innerHTML: getSuccessContent() })
    }
    else {
        hideShowEl(`#before-payment-${str}, #chosenBank`, null)
        Object.assign(document.querySelector(`#${str}-error`), { hidden: false }, { innerHTML: (str == "card") ? getError("USSD", "QR") : (str == "ussd") ? getError("QR", "Card") : getError("Card", "USSD") })
    }
}


// THis function will be called in whole Library 
// query1 will hide selectors inside it
// query2 will show selectors inside it
function hideShowEl(query1, query2) {
    var arr = Array.from(document.querySelectorAll(query1))
    for (var i of arr) {
        i.hidden = true
    }
    arr = Array.from(document.querySelectorAll(query2))
    for (var i of arr) {
        i.hidden = false
    }
}

// prevent app from crashing and just show error message if api fails
function apiFailure() {
    var accordion = document.querySelector("#popup")
    hideShowEl(".spinbuldak", null)
    var items = Array.from(accordion.querySelectorAll(".accordion-item"))
    for (var i = 1; i < items.length; i++) {
        items[i]["hidden"] = true
    }
    accordion.innerHTML += renderError()
}

