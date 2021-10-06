console.log("content_script");
location.href.includes(".uk/properties/") &&
  window.addEventListener("load", async function () {
    console.log("onload");
    chrome.runtime.onMessage.addListener((message) => {
      const { matchTransaction, error, area, energyRate } = message;
      console.log(error);
      if (matchTransaction && matchTransaction.address) {
        addressElement.innerHTML =
        (area && energyRate && area.length && energyRate.length && ` [Area: ${area} | EPC: ${energyRate}] ` || '') + matchTransaction.address;
      } else {
        addressElement.innerHTML = "❓ " + originalAddress;
      }
    });
    const addressElement = document.querySelector(
      'h1[itemProp="streetAddress"]'
    );
    /*UPDATE LOADING*/
    const originalAddress = addressElement.innerText; 
    addressElement.innerHTML = "... " + originalAddress;
    /*MAIN*/
    chrome.runtime.sendMessage({ url: location.href }, function (response) {
      console.log("DONE");
    });
    /*UPDATE RESULT*/
  });

const sleep = (ms) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), ms);
  });
};
