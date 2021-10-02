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
    console.log(
      "fetching",
      `https://find-energy-certificate.digital.communities.gov.uk/find-a-certificate/search-by-postcode?postcode=${postcode}`
    );
    return new Promise((resolve, reject) => {
      fetch(
        `https://find-energy-certificate.digital.communities.gov.uk/find-a-certificate/search-by-postcode?postcode=${postcode}`
      )
        .then((res) => res.text())
        .then((data) => resolve(data));
    });
  };
  const getAreaRaw = (path) => {
    return new Promise((resolve, reject) => {
      fetch(
        `https://find-energy-certificate.digital.communities.gov.uk/${path}`
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

    const houseTransaction = dataHistory.soldPropertyTransactionHistories
      .map((transaction) => transaction.soldPrice + "_" + transaction.year)
      .join("-");
    const rawLocationHtml = await getLocationIDRaw(post_code);

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
    let energyRate = "";
    let area = "";
    if (matchTransaction && matchTransaction.address) {
      let eList = [];
      try {
        let rawEnergyHtml = await getEnergyRaw(post_code.replace("-", ""));
        rawEnergyHtml = rawEnergyHtml
          .replaceAll("\n", "")
          .replace(/\s{2,}/g, " ");
        console.log(rawEnergyHtml);
        const dataRe = /<tr class="govuk-table__row">(.+?)<\/tr>/g;
        let parsedEnergy = null;
        parsedEnergy = dataRe.exec(rawEnergyHtml);
        eList.push(parsedEnergy[1]);
        while (parsedEnergy) {
          parsedEnergy = dataRe.exec(rawEnergyHtml);
          parsedEnergy && eList.push(parsedEnergy[1]);
        }
        eList = eList.slice(1);
        eList = eList.map((item) => {
          const match =
            /href="(.+?)">(.+?)<\/a>.+?<td class="govuk-table__cell">(.+?)<\/td>/.exec(
              item
            );
          return {
            href: match[1],
            address: /\d+/.exec(match[2])[0],
            test: match[2],
            rate: match[3],
          };
        });
        const houseObject = eList.find(
          (item) => item.address === /\d+/.exec(matchTransaction.address)[0]
        );
        energyRate = houseObject.rate;
        const areaHtml  = await getAreaRaw(houseObject.href);
        area  = /(\d+) square metres/.exec(areaHtml)[1] + 'm2';
        
        console.log(energyRate);
        console.log(area);
      } catch (e) {}
      console.log("Energy List For Postcode ", post_code, eList);
    }
    chrome.tabs.sendMessage(tabId, {
      area,
      energyRate,
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
