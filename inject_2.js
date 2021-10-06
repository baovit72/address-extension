location.href.includes("find.html") &&
  window.addEventListener("load", async function () {
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
      console.log("error", error);
      if (location.href != originUrl) {
        return;
      }
      if (matchTransaction && matchTransaction.address) {
        cards[id].querySelector(
          "address[class='propertyCard-address']"
        ).innerHTML =
        (area && energyRate && area.length && energyRate.length && ` [Area: ${area} | EPC: ${energyRate}] ` || '') + matchTransaction.address;
      } else {
        cards[id].querySelector(
          "address[class='propertyCard-address']"
        ).innerHTML = "❓ " + originalAddress;
      }
    });
    for (var i = 0; i < cards.length; i++) {
      try {
        const card = cards[i];
        const initAddress = card.querySelector(
          "address[class='propertyCard-address']"
        ).innerText;
      
        card.querySelector("address[class='propertyCard-address']").innerHTML =
          "... " + initAddress;
        const url = card.querySelector("a[class='propertyCard-link']").href;
        chrome.runtime.sendMessage(
          {
            url: url,
            payload: {
              id: i,
              originUrl: location.href,
              originalAddress: initAddress,
            },
          },
          function (response) {
            console.log("DONE");
          }
        );
      } catch {}
    }
  });
