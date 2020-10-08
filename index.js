
const rollDie = (qNumber, sidesOfDie) => {
    const rollResult = Math.floor(qNumber / (255 / sidesOfDie));
    return rollResult ? rollResult : 1;
}

const callQRNG = async (numberOfRolls, sidesOfDie) => {
    const length = numberOfRolls > 1000 ? 1000 : numberOfRolls;
    return await axios.get(`https://qrng.anu.edu.au/API/jsonI.php?length=${length}&type=uint8`).then((response) => {
        return response.data.data.map((number) => rollDie(number, sidesOfDie));
    }).catch(() => Math.floor(Math.random * (sidesOfDie)));
}

const parseRollString = async (string) => {
    if (/(\d*)(D\d*)((?:[+*-](?:\d+|\([A-Z]*\)))*)(?:\+(D\d*))?/i.test(string)) { 
       const queryArray = string.split('+').flatMap((item) => item.includes('-') ? item.split('-').flatMap((value, index) => index == 1 ? `-${value}` : value ) : item)
       let finalResult = [];
        for (let i = 0; i < queryArray.length; i++) {
            if (queryArray[i].includes('d') || queryArray[i].includes('D')) {
                const numberArray = queryArray[i].replace('d',' ').replace('D',' ').split(' ').flatMap((data) => parseInt(data, 10))
                const result = await callQRNG(numberArray[0], numberArray[1]);
                finalResult = [...finalResult, ...result];
            } else {
                finalResult.push(queryArray[i])
            }
        }
        return {
            queryString: queryArray,
            finalResult,
            total: finalResult.reduce((prev, curr) => {
                if (typeof curr === 'string') {
                    return prev + parseInt(curr, 10)
                }
                return prev + curr
            }, 0),
            }
    } else {
       throw Error('Not Supported')
    }
}

const onSubmit = async (event) => {
    event.preventDefault()

    const input = document.getElementsByClassName('dice-field')[0].value;
    const resultObject = await parseRollString(input)

    updateFields(resultObject)

}

const makeFinalResultElements = (queryArray, finalResult) => {
    const diceElements = [];

    const diceTracker = {
        'd2': 0,
        'd3': 0,
        'd4': 0,
        'd6': 0,
        'd8': 0,
        'd10': 0,
        'd12': 0,
        'd20': 0,
        'd100': 0
    }
    let totalNumbersTaken = 0
    queryArray.forEach((query, index) => {
    
        if (query.includes('d')) {
            const splitQuery = query.split('d');
            const diceArray = finalResult; 

            diceArray.forEach((item, index1) => {
                if ( typeof item === 'number' && parseInt(splitQuery[0], 10) > diceTracker[`d${splitQuery[1]}`] && totalNumbersTaken === index1) {
                    diceElements.push(`<div class="d${splitQuery[1]} dice">${item}</div>`);
                    diceTracker[`d${splitQuery[1]}`] += 1;

                    totalNumbersTaken++
                }
            })
        } else {
            diceElements.push(`<div class="modifier">${query.includes('-') ? query : `+ ${query}` }</div>`);
            totalNumbersTaken++
        }
    });

    return diceElements.join('');
}

const updateFields = (resultObject) => {
    const { finalResult, queryString, total } = resultObject
    const filteredQuery = queryString.filter((string) => string.includes('d')).join('+')
    const resultContainer = document.getElementsByClassName('result')[0]
    const queryContainer = document.getElementsByClassName('query')[0]
    const totalContainer = document.getElementsByClassName('total')[0]

    queryContainer.innerHTML = filteredQuery
    resultContainer.innerHTML = makeFinalResultElements(queryString, finalResult)
    totalContainer.innerHTML = `Total: ${total}`
}