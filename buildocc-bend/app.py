#.\.venv\Scripts\python.exe app.py
import json
import datetime
import asyncio

import psycopg
import uvicorn
import fastapi
from fastapi import FastAPI, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from sse_starlette.sse import EventSourceResponse


HTTP_PORT = 5000
STREAM_DELAY = 1
DB_URI = 'postgresql://postgres@localhost:5432/buildocc'

app = FastAPI()


app.mount("/static", StaticFiles(directory="static"), name="static")


def get_day_code():
    current_day_name = datetime.datetime.now().strftime("%A")
    if current_day_name == 'Monday':
        return 'M'
    elif current_day_name == 'Tuesday':
        return 'T'
    elif current_day_name == 'Wednesday':
        return 'W'
    elif current_day_name == 'Thursday':
        return 'R'
    elif current_day_name == 'Friday':
        return 'F'
    else:
        return 'S'

  
def get_heater_target_state(building: str, room: str) -> str:
    day_code = get_day_code()

    with psycopg.connect(DB_URI) as conn, conn.cursor() as curs:
        query = f'''
        SELECT
            building, room, begin_time, end_time, days
        FROM
            class_schedules
        WHERE TRUE
            AND building = '{building}'
            AND room = '{room}'
            AND days LIKE '%{day_code}%'
            AND CURRENT_TIME::TIME + '10 MINUTES' BETWEEN begin_time::TIME AND end_time::TIME
        ;
        '''
        curs.execute(query)
        rows = curs.fetchall()

        if len(rows) > 0:
            return 'ON'
        else:
            return 'OFF'
        # return str(rows)


def get_new_messages(building: str, room: str):
    target_state = get_heater_target_state(building=building, room=room)
    data = json.dumps({
        'building': building,
        'room': room,
        'target_state': target_state,
    })
    message = f'data: {data}\n\n'
    return [data]


async def event_generator(request: fastapi.Request, building: str, room: str):
    while True:
        if await request.is_disconnected():
            break
        for message in get_new_messages(building, room):
            yield message
        await asyncio.sleep(STREAM_DELAY)


@app.get("/events")
async def message_stream(request: fastapi.Request):
    room = request.query_params.get('room')
    building = request.query_params.get('building')
    return EventSourceResponse(event_generator(request, building, room), ping=900,)


@app.get("/")
async def index(room: str = Query(..., description="Room number"), building: str = Query(..., description="Building name")):
    css = """.image-container {
    position: relative;
    display: inline-block; /* Ensures the image is treated as an inline-block for positioning */
}

#state-container {
    position: absolute;
    top: 30%; /* Adjust as needed */
    left: 25%; /* Adjust as needed */
    transform: translate(-50%, -50%); /* Centers the text */
    color: white; /* You can change the color of the text to contrast with the image */
    font-size: 70px; /* You can adjust the size */
    text-align: center; /* Optional: centers the text horizontally */
}

img {
    display: block; /* Removes bottom space (gap) in case of inline-block */
    width: 50%; /* Ensures the image fills the container if needed */
    height: auto; /* Maintains aspect ratio */
}
"""
    html_content = f"""
            <html>
            <head>
                <title>Home Page</title>
                <style>
                {css}
                </style>
            </head>
            <body>
                <h1>Welcome to the Heater State SSE Server!</h1>
                <p>Current settings:</p>
                
                <ul>
                    <li>Building: {building}</li>
                    <li>Room: {room}</li>
                </ul>

                <p>Events: <a href="/events?room={room}&building={building}">events</a> endpoint.</p>

                <div class="image-container">
                    <p id="state-container"></p>
                    <img src="static/heater.jpg" alt="Image description" />
                </div>
                
                <details>
                    <summary>Debug - Inspect event stream</summary> 
                    <div id="events-container"></div>
                </details>

                <script type="text/javascript">
                    const eventSource = new EventSource('/events?room={room}&building={building}');

                    eventSource.onmessage = function(event) {{
                        const msg_json = JSON.parse(event.data);

                        const randomNumbersDiv = document.getElementById("events-container");
                        const newNumber = document.createElement("p");

                        newNumber.textContent = "Event: " + event.data;
                        randomNumbersDiv.insertBefore(newNumber, randomNumbersDiv.firstChild);

                        const stateDiv = document.getElementById("state-container");
                        stateDiv.style.color = msg_json.target_state == 'ON' ? 'green' : 'red';
                        stateDiv.textContent = msg_json.target_state;
                    }};
                </script>
            </body>
            </html>
            """
    return HTMLResponse(content=html_content)


if __name__ == '__main__':
    uvicorn.run('app:app', host='127.0.0.1', port=HTTP_PORT, reload=True)
