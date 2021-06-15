function showResult(result, startTime) {
    const resultDiv = document.querySelector(".js-result");
    resultDiv.innerHTML = "";

    // 테이블, 테이블 헤더 생성
    const table = document.createElement("table");
    const tableHead = document.createElement("thead");

    const tableHeadRow = document.createElement("tr");

    const wordHeadData = document.createElement("td");
    const similarityHeadData = document.createElement("td");


    wordHeadData.style.fontSize = "20px";
    wordHeadData.style.fontWeight = "bold";
    wordHeadData.style.border = "1px solid black";
    similarityHeadData.style.fontSize = "20px";
    similarityHeadData.style.fontWeight = "bold";
    similarityHeadData.style.border = "1px solid black";

    wordHeadData.innerText = "단어";
    similarityHeadData.innerText = "유사도";

    tableHeadRow.appendChild(wordHeadData);
    tableHeadRow.appendChild(similarityHeadData);

    tableHead.appendChild(tableHeadRow);

    table.appendChild(tableHead);

    // 테이블 바디 생성
    const tableBody = document.createElement("tbody");
    for(let i=0; i<result.length; i+=2) {
        const tableBodyRow = document.createElement("tr");

        const wordBodyData = document.createElement("td"); 
        const similarityBodyData = document.createElement("td"); 
        
        const word = result[i];
        const similarity = result[i+1];

        wordBodyData.innerText = word;
        similarityBodyData.innerText = similarity

        tableBodyRow.appendChild(wordBodyData);
        tableBodyRow.appendChild(similarityBodyData);
        
        tableBody.appendChild(tableBodyRow);
    }

    table.appendChild(tableBody);
    resultDiv.appendChild(table);

    const endTime = Date.now();
    console.log(`걸린 시간 = ${(endTime - startTime) / 1000}초`);
}

async function onSearchButtonClicked(event) {
    event.preventDefault();

    const searchTermInput = document.querySelector(".js-searchTerm");
    const searchTerm = searchTermInput.value;

    const url = `/search?word=${searchTerm}`;
    const method = "get";
    const startTime = Date.now();
    let response;
    try {
        response = await axios({
            url,
            method,
        });
    } catch(error) {
        console.log(error);
    }
    console.log(response);
    let result = response.data.item.result;

    result = result.split(" ");

    showResult(result, startTime);
}

function init() {
    // button event
    const searchButton = document.querySelector(".js-searchButton");
    searchButton.addEventListener("click", onSearchButtonClicked);
}

init();