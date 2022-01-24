location.href.includes("find.html") &&
    window.addEventListener("load", async function() {
        const currentLocation = window.location.href;
        setInterval(() => {
            if (currentLocation !== window.location.href) {
                window.location.reload();
            }
        }, 1000);
        while (!document.getElementsByClassName("propertyCard-details").length) {
            await sleep(2000);
        }
        const cards = document.getElementsByClassName("propertyCard-details");
        chrome.runtime.onMessage.addListener((message) => {

            const {
                matchTransaction,
                id,
                originUrl,
                originalAddress,
                error,
                area,
                energyRate,
            } = message;
            //console.log("error", error);
            if (location.href != originUrl) {
                return;
            }
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
            const addressElement = cards[id].querySelector(
                "address.propertyCard-address"
            );
            addressElement.classList.add("d-none")
            addressElement.parentNode.replaceChild(d, addressElement);
        });
        for (var i = 0; i < cards.length; i++) {
            try {
                const card = cards[i];

                const initAddress = card.querySelector(
                    "address.propertyCard-address"
                ).innerText;
                const initAddressHtml = card.querySelector(
                    "address.propertyCard-address"
                ).innerHTML;

                card.querySelector("address.propertyCard-address").innerHTML =
                    `<span style='color:red;'>... </span>` + initAddressHtml;

                const url = card.querySelector("a.propertyCard-link").href;
                const data = {
                    url: url,
                    payload: {
                        id: i,
                        originUrl: location.href,
                        originalAddress: initAddress,
                    },
                }
                const r = await sendMessage(data);
                // console.log(r);
            } catch (e) {
                //console.log(e)
            }
        }
    });

async function sendMessage(data) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(data,
            function(response) {
                // console.log("ddjkdj")
                resolve(response);
            }
        )
    });
}