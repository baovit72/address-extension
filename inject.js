console.log("content_script");
location.href.includes(".uk/properties/") &&
    window.addEventListener("load", async function() {
        console.log("onload");
        chrome.runtime.onMessage.addListener((message) => {
            const { matchTransaction, error, area, energyRate } = message;
            console.log(error);

            var d = document.createElement("strong");
            d.innerHTML = "";

            if (matchTransaction && matchTransaction.address) {
                d.innerHTML =
                    ((area &&
                            energyRate &&
                            area.length &&
                            energyRate.length &&
                            ` [Area: ${area} | EPC: ${energyRate}] `) ||
                        "") + matchTransaction.address;
            } else {
                d.innerHTML = "❓ " + originalAddress;
            }
            addressElement.parentNode.replaceChild(d, addressElement);
        });
        const addressElement = document.querySelector(
            'h1[itemProp="streetAddress"]'
        );
        /*UPDATE LOADING*/
        const originalAddress = addressElement.innerText;
        addressElement.innerHTML = "... " + originalAddress;
        /*MAIN*/
        chrome.runtime.sendMessage({ url: location.href }, function(response) {
            console.log("DONE");
        });
        /*UPDATE RESULT*/
    });

const sleep = (ms) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), ms);
    });
};