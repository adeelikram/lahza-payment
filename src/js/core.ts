declare var axios: any

// these are global variables of the Library
var url = "http://localhost:3005"
// customer includes user credentials, callback, payment channels  
var customer: any = {}
var channel_banks = {  }
// this is transation id of the payment we will retrieve from request payment api
var transaction = ""

window.onmessage = function (e) {
    // when 2nd iframe of card auth link will be closed he will send message from __LahzaPostAuth inside lahza.ts 
    if (e.data.includes("checkAuth")) {
        hideShowEl("#card-auth", null)
        tranSuccess("card")
    }
    // This block will just initialize user credentials
    else {
        var data = JSON.parse(e.data)
        customer = data
        requestPayment()
    }

}


// This function will call user request payment api, initalize the payment channels and accordion 
async function requestPayment() {
    var { key, amount, currency, email } = customer
    var accordion = document.querySelector("#popup")
    accordion.innerHTML = ""
    try {
        var res = await axios.get(`${url}/request_payment?key=${key}&email=${email}&firstname=Salah&lastname=Yahya&payment_page=780525&currency=${currency}&amount=${amount}&mode=popup&device=4ef5f3dd326d7db4b761b0cc28268e7b`);
    } catch (error) {
        hideShowEl(null, "#lahzaError");
        document.querySelector("#lahzaError").innerHTML = renderError();
        (<HTMLDivElement>document.querySelector(".spinbuldak")).hidden = true;
        return ""
    }

    (<HTMLDivElement>document.querySelector(".spinbuldak")).hidden = true;
    var { data } = res.data
    if (data.status) {
        transaction = data.id
        customer["name"] = data.merchant_name
        hideShowEl(null, "#popup")
        var { channels } = data
        accordion.innerHTML = renderHeader()
        accordion["hidden"] = false;
        if (data.merchant_logo.includes("placehold")) data.merchant_logo.replace("https", "http")
        document.getElementById("profile")["src"] = data.merchant_logo
        customer["channels"] = channels
        if (customer["channels"].includes("bank")) customer["channels"][channels.indexOf("bank")] = "qr"
        if (channels.includes("card")) {
            accordion.innerHTML += renderCard()
        }
        if (channels.includes("ussd")) {
            accordion.innerHTML += renderUSSD()
        }
        if (channels.includes("qr")) {
            accordion.innerHTML += renderQR()
            if (channels.length == 1) {
                checker(<HTMLDivElement>document.getElementById("headingThree"))
            }
        }
        var el = document.querySelectorAll(".accordion-item")[1]
        el.children[0]["style"].display = "none"
        el.children[1].className = "accordion-collapse collapse show"
        if (Object.keys(data.channel_options.ussd).length > 0) {
            channel_banks = data.channel_options.ussd
            renderBankBtn()
        }
        setEmail()
    }
    else {
        hideShowEl("#lahzaError", "#popup")
    }
}
// This function set email, name and amount to the header of accordion
function setEmail() {
    var arr = Array.from(document.querySelectorAll(".curr-amount-name"))
    for (var i of arr) {
        i.innerHTML = getCurrNameAmount()
    }
}

// This function will render header code of the accordion
function renderHeader() {
    return `
   <div class="accordion-item header">
            <h2 class="accordion-header bg-white d-inline-flex" id="headingZero">
                <img id="profile" class="rounded-circle w-100px h-100px my-2 mx-md-5 mx-3" alt="Profile">
                <h5 class="fw-bolder float-end my-2  mx-3">customer payment
                <div class="curr-amount-name text-center px-4 bg-white h6 my-0 mt-0"></div>
                </h5> 
            </h2>
    </div>
    
   `
}

// This fucntion will render card payment channel
function renderCard() {
    return `
    <div class="accordion-item">
            <h2 onclick="checker(this)" class="accordion-header " id="headingOne">
                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne"
                    aria-expanded="true" aria-controls="collapseOne">
                    <img width="35" height="22" src="assets/card.svg">
                    <span class="mx-2">Pay with Card</span>
                </button>
            </h2>
            <div id="collapseOne" class="accordion-collapse collapse" aria-labelledby="headingOne"
                data-bs-parent="#popup">
                <div class="accordion-body">
                    
                    <div class="token">
                        <div id="before-payment-card">
                            <form onsubmit="chargeCard(event)">
                                <table class="table py-4 table-bordered rounded bg-white">
                                    <tr>
                                        <td colspan="2">
    
                                            <div class="h6 mx-2">CARD NUMBER</div>
                                            <input id="cardno" required maxlength="16" type="text" pattern="^(?:4[0-9]{12}(?:[0-9]{3})?|[25][1-7][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$"
                                                placeholder="0000000000000000" title="Enter a valid credit card number"
                                                class="form-control d-block border-0 card-number col-md-6 col-4">
                                            <img src="assets/card.svg" class="float-end mt-40px" width="30" height="30">
    
                                        </td>
                                    </tr>
                                    <tr>
                                        <td class="w-auto">
                                            <div class="h6 mx-2">Valid till</div>
                                            <input required id="validTill" type="text" maxlength="5" placeholder="MM/YY" pattern="[1-9]{2}\/[1-9]{2}" title="Plese enter date in format  MM/YY"
                                                class="form-control border-0 card-number col-3">
                                        </td>
                                        <td class="w-auto">
                                            <div class="h6 mx-2">CVV</div>
                                            <div class="w3-tooltip float-end mt-30px">What is this?
                                                <span class="w3-tooltiptext">
                                                    Turn your card over you will see 3 digit number.
                                                </span>
                                            </div>
    
                                            <input required id="cvv" type="text" maxlength="3" placeholder="123" pattern="[0-9]{3}" title="Enter valid CVV number"
                                                class="form-control border-0 card-number w-50">
                                        </td>
                                    </tr>
                                </table>
    
                                <button type="submit"
                                    class="btn col-8 col-md-6 btn-primary  py-3 mt-4 d-block mx-auto">Pay USD 423</button>
                            </form>
                           </div>
                        
                        <!--Success message div-->
                        <div id="card-success-ms" hidden class="w-100 h-auto"></div>
                        <!--Error Message-->
                        <div id="card-error" class="w-100"></div>
                        <!--authenticate-->
                        <div id="card-auth" class="w-100" hidden>
                            <img src="assets/blue-card.png" alt="" class="d-block mx-auto mt-5">
                            <div class="h5 text-center mt-4 mb-3">Please click the button below to authenticate with your
                                bank</div>
                            <a id="card-auth-link" onclick="openIframe()" class="btn btn-success d-block py-2 px-5 mx-4">Authenticate</a>
                            <a href="#" onclick="hideShowEl('#card-auth','#before-payment-card')"
                                class="text-decoration-none text-secondary text-center d-block mx-auto mt-2 mb-2">
                                cancel
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
}

// This function will render ussd payment channel
function renderUSSD() {
    return `
    <div class="accordion-item">
            <h2 onclick="checker(this)" class="accordion-header " id="headingTwo">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                    data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                    <img width="35" height="22" src="assets/ussd.svg">
                    <span class="mx-2">Pay with USSD</span>
                </button>
            </h2>
            <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo"
                data-bs-parent="#popup">
                <div class="accordion-body">
                   <div class="token"> 
                      <div id="before-payment-ussd">
                          <div id="banks">
                          </div>
                          <div id="choosenBank" hidden>
                          </div>
                      </div>
                      <div id="ussd-success-ms" hidden class="w-100 h-auto"></div>
                      <div id="ussd-error" class="w-100"></div>
                   </div>  
                </div>
            </div>
        </div>
    `
}

// This function will render QR payment channel
function renderQR() {
    return `
    <div class="accordion-item">
            <h2 onclick="checker(this)" class="accordion-header " id="headingThree">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                    data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                    <img width="35" height="22" src="assets/qr.svg">
                    <span class="mx-2">Pay with NQR</span>
                </button>
            </h2>
            <div id="collapseThree" class="accordion-collapse collapse " aria-labelledby="headingThree"
                data-bs-parent="#popup">
                <div class="accordion-body">
                    <div class="token">
                        <div id="before-payment-qr">
                            <div class="w-100 text-center my-2 custom-font line-height fw-bold">
                                Scan the OR code below in your Ecobank, FirstBank, Fidelity, Access. Diamond or Zenith
                                Bank mobile app to complete the payment.
                            </div>
                            <div id="intializeQR">
                            </div>
                        </div>
                        
                        <div id="qr-success-ms" hidden class="w-100 h-auto"></div>
                        
                        <div id="qr-error" class="w-100"></div>
                    </div>  
                </div>
            </div>
        </div>
    `
}

// This function will render Text info for choosing bank from ussd payment channel    
function renderBankDesc() {
    return `
    <div class="w-100 text-center my-2">Choose your bank to start the payment</div>
    `
}
// This function will render button includes bank names and their base code
function renderBankBtn() {
    var banks = document.getElementById('banks');
    if (!banks) return;
    banks.innerHTML = renderBankDesc();
    for (var i in channel_banks) {
        var temp = `
   <button onclick="chooseBank(${i})"
        class="btn col-md-6 offset-md-3 bg-light my-1 col-10 offset-1 text-align-left">${channel_banks[i]} <span class="float-end my-1 badge bg-secondary">*${i}#</span></button>
   `
        banks.appendChild(Object.assign(document.createElement('div'), { innerHTML: temp }))
    }
}
// This function will render next window where we have to show complete bank code of ussd channel
function renderChosenBank(n, code): string {
    return `
    <div class="w-100 text-center fw-bolder my-3">Dial the code below to complete this
                                transaction with ${channel_banks[n].split(" ")[0]}'s ${n}</div>
    <div class="my-3"></div>
    <div class="w-100 text-center fw-bolder h4 my-lg-4 my-xl-4">${code}</div>
    <button onclick="copy(this,'${code}')" id="copied-code" class="col-10 offset-1 btn">click here to
        copy</button>
    <button onclick="tranSuccess('ussd')" class="btn col-md-6 offset-md-3 bg-light my-1 col-10 offset-1">
        I've completed the transaction
    </button>
    <button onclick="banks()" class="col-4 offset-4 btn">cancel</button>
    `
}

function renderQRImg(url: string) {

    return `
    <img id="qrImg" class="d-block mx-auto" width="140" height="140" alt="" src="${url}">
    <button onclick="tranSuccess('qr')" class="btn col-md-6 offset-md-3 bg-light my-2 col-10 offset-1">
        I've completed the transaction
    </button>
    `
}






function renderError() {
    return `
    <img src="./assets/warning.png" alt="" class="d-block mx-auto mt-5">
    <div class="h4 text-center mt-5 mb-5">We could not start this transaction</div>    
    <a href="#" class="btn rounded d-block mx-auto" onclick="window.location.reload()">Reload</a>
    `
}