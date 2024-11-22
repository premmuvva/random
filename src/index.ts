console.log("Lets start!!")

interface Event {
  url: string,
  visitorId: string,
  timestamp: number
}

interface InputObject {
  events: Event[]
}

interface ResponseEvent {
  duration: number, 
  startTime: number,
  pages: string[];
}


const getInput = async () => {
  return fetch("https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=bc7d8712b664eadc7f9698f9b4a7")
    .then((resp) => resp.json());
}

const postOutput = (response: object) => {
  fetch("https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=bc7d8712b664eadc7f9698f9b4a7", {
    headers: {
      'Content-Type': 'application/json'
    },
    method: "POST",
    body: JSON.stringify(response)
  }).then((resp) => resp.json())
    .then((json_res) => console.log(json_res));
}

const processInput = (inputObj: InputObject) => {
  const output = {}
  const visitorIdEventMap: Map<string, Event[]> = new Map();
  for (let i = 0; i<inputObj.events.length; i++) {
    const event = inputObj.events[i];
    if (visitorIdEventMap.has(event.visitorId) && visitorIdEventMap.get(event.visitorId)) {
      visitorIdEventMap.get(event.visitorId)?.push(event);
    } else {
      visitorIdEventMap.set(event.visitorId, [event]);
    }
  }

  var ans: {[key: string]: object} = {}
  for (let [visitorId, eventList] of visitorIdEventMap) {
    eventList.sort((a, b) => a.timestamp - b.timestamp);

    const response: ResponseEvent[] = [];
    let curEvents: string[] = [eventList[0].url];
    let start = eventList[0].timestamp;
    for(let i = 1; i<eventList.length; i++) {
      if (eventList[i].timestamp - eventList[i - 1].timestamp > 10 * 60 * 1000) {
        response.push({
          duration: eventList[i - 1].timestamp - start,
          pages: [...curEvents],
          startTime: start,
        });
        curEvents = [];
        start = eventList[i].timestamp;
      }
      curEvents.push(eventList[i].url);
    }
    if (curEvents.length > 0) {
      response.push({
        "duration": eventList[eventList.length-1].timestamp - start,
        "pages": [...curEvents],
        "startTime": start
      });
    }
    // console.log(response);
    ans[visitorId] = response;
  }


  // console.log(JSON.stringify(ans));
  return {"sessionsByUser": ans};
}

const init = async() => {
  const input = await getInput();
  // console.log(input);
  const output = processInput(input);
  console.log(JSON.stringify(output));
  postOutput(output);
}

init();