chrome.runtime.onMessage.addListener(async (message, sender) => {
  const getLocationIDRaw = (postcode) => {
    console.log("fetching");
    return new Promise((resolve, reject) => {
      fetch(`https://www.rightmove.co.uk/house-prices/${postcode}`)
        .then((res) => res.text())
        .then((data) => resolve(data));
    });
  };
  const getEnergyRaw = (postcode) => {
    console.log("fetching",`https://find-energy-certificate.digital.communities.gov.uk/find-a-certificate/search-by-postcode?postcode=${postcode}`);
    return new Promise((resolve, reject) => {
      fetch(
        `https://find-energy-certificate.digital.communities.gov.uk/find-a-certificate/search-by-postcode?postcode=${postcode}`
      )
        .then((res) => res.text())
        .then((data) => resolve(data));
    });
  };
  const getHistoryOfHouse = ({ deliveryPointId }) => {
    console.log("fetching");
    return new Promise((resolve, reject) => {
      fetch(
        `https://www.rightmove.co.uk/properties/api/soldProperty/transactionHistory/${deliveryPointId}`
      )
        .then((res) => res.json())
        .then((data) => resolve(data));
    });
  };
  const getHistoryOfLocation = (locId) => {
    console.log("fetching");
    return new Promise((resolve, reject) => {
      fetch(
        `https://www.rightmove.co.uk/house-prices/result?locationType=POSTCODE&locationId=${locId}&page=1`
      )
        .then((res) => res.json())
        .then((data) => resolve(data));
    });
  };
  const getHouseDetailRaw = (url) => {
    console.log("fetching");
    return new Promise((resolve, reject) => {
      fetch(`${url}`)
        .then((res) => res.text())
        .then((data) => resolve(data));
    });
  };
  const { url, payload } = message;
  const tabId = sender.tab.id;

  try {
    const address = JSON.parse(
      "{" +
        /\"address\".+?}/.exec(
          (await getHouseDetailRaw(url))
            .replaceAll(" ", "")
            .replaceAll("\n", "")
        ) +
        "}"
    ).address;
    const dataHistory = await getHistoryOfHouse(address);
    const post_code = address.outcode + "-" + address.incode;

    const rawEnergyHtml = await getEnergyRaw(post_code.replace("-",""));
    const dataRe = /<tr class="govuk-table__row">.+?(\d+ \D+?),.+?<\/tr>/g;
    const parsedEnergy = dataRe.exec(rawEnergyHtml.replaceAll("\n", "").replace(/\s{2,}/g," "));
    console.log(rawEnergyHtml.replaceAll("\n", "").replace(/\s{2,}/g," "),parsedEnergy);
    const houseTransaction = dataHistory.soldPropertyTransactionHistories
      .map((transaction) => transaction.soldPrice + "_" + transaction.year)
      .join("-");
    const rawLocationHtml = await getLocationIDRaw(post_code);
   
    console.log("parsedEnergy",parsedEnergy);
    const locId = /POSTCODE\^(\d+)/.exec(rawLocationHtml)[1];
    const firstPageData = await getHistoryOfLocation(locId);
    const pageNum = firstPageData.pagination.last;
    const rawTransactions = firstPageData.results.properties;
    for (var i = 2; i <= pageNum; i++) {
      rawTransactions.push((await getHistoryOfLocation(i)).results.properties);
    }
    const transactions = rawTransactions.map((item) => ({
      address: item.address,
      transaction:
        (item.transactions &&
          item.transactions
            .map(
              (transaction) =>
                transaction.displayPrice +
                "_" +
                transaction.dateSold.split(" ")[2]
            )
            .join("-")) ||
        "",
    }));
    const matchTransaction = transactions.find(
      (transaction) => houseTransaction.trim() === transaction.transaction
    );
    chrome.tabs.sendMessage(tabId, {
      matchTransaction: matchTransaction,
      ...payload,
    });
  } catch (e) {
    console.log(e);
    chrome.tabs.sendMessage(tabId, {
      matchTransaction: null,
      ...payload,
      error: e,
    });
  }
});
