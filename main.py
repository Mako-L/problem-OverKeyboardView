import os
import json
import base64
import asyncio
import websockets
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse
from fastapi.websockets import WebSocketDisconnect
from twilio.twiml.voice_response import VoiceResponse, Connect, Say, Stream
from twilio.rest import Client
from dotenv import load_dotenv
import logging
import requests
from functions import end_twilio_call, get_amenities_info, start_call_recording, get_call_transcription, end_twilio_call_with_transcription

# Configure logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()
# Configuration
OPENAI_API_KEY = os.getenv(
    'OPENAI_API_KEY')  # requires OpenAI Realtime API Access
PORT = int(os.getenv('PORT', 5050))

SYSTEM_MESSAGE = ("""
You speak only hungarian and thats all say to user in the beginning moghiores begheles.
""")
VOICE = 'alloy'
LOG_EVENT_TYPES = [
    'response.content.done', 'rate_limits.updated', 'response.done',
    'input_audio_buffer.committed', 'input_audio_buffer.speech_stopped',
    'input_audio_buffer.speech_started', 'response.create', 'session.created'
]
SHOW_TIMING_MATH = False
app = FastAPI()
if not OPENAI_API_KEY:
    raise ValueError(
        'Missing the OpenAI API key. Please set it in the .env file.')


@app.get("/", response_class=HTMLResponse)
async def index_page():
    return "<html><body><h1>Twilio Media Stream Server is running!</h1></body></html>"


@app.post("/make-call")
async def make_call(request: Request):
    """Initiate a call to a specified phone number."""
    try:
        data = await request.json()
        phone_number = data.get('phone_number')

        if not phone_number:
            return {"error": "Phone number is required"}, 400

        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        from_number = os.getenv('TWILIO_PHONE_NUMBER')

        if not from_number:
            return {
                "error": "TWILIO_PHONE_NUMBER environment variable is not set"
            }, 400

        if not from_number.startswith('+'):
            from_number = '+' + from_number

        client = Client(account_sid, auth_token)

        # Get the Replit deployment URL from environment variable
        base_url = os.getenv('REPLIT_URL', f"https://{request.url.hostname}")

        call = client.calls.create(url=f"https://{base_url}/incoming-call",
                                   to=phone_number,
                                   from_=from_number)

        return {"message": "Call initiated", "call_sid": call.sid}
    except Exception as e:
        return {"error": str(e)}, 500


@app.api_route("/incoming-call", methods=["GET", "POST"])
async def handle_incoming_call(request: Request):
    """Handle incoming call and return TwiML response to connect to Media Stream."""
    form_data = await request.form()
    global call_sid
    call_sid = form_data.get("CallSid")  # Extract the CallSid from the request
    logger.info(f"Incoming call from Twilio: {call_sid}")

    if not call_sid:
        logger.error("CallSid not found in the request!")
        return HTMLResponse(content="CallSid is missing!", status_code=400)
    
    # Start recording the call
    recording_sid = await start_call_recording(call_sid)
    logger.info(f"Started recording for call {call_sid}, recording SID: {recording_sid}")
    
    logger.info("Received incoming call request from: %s", request.client.host)
    response = VoiceResponse()
    host = request.url.hostname
    connect = Connect()
    connect.stream(url=f'wss://{host}/media-stream')
    response.append(connect)
    logger.info("Successfully created the TwiML response")
    return HTMLResponse(content=str(response), media_type="application/xml")


@app.api_route("/recording-status", methods=["POST"])
async def recording_status(request: Request):
    """Handle recording status callbacks from Twilio."""
    form_data = await request.form()
    recording_sid = form_data.get("RecordingSid")
    recording_status = form_data.get("RecordingStatus")
    call_sid = form_data.get("CallSid")
    
    logger.info(f"Recording status update for SID {recording_sid}, call {call_sid}: {recording_status}")
    
    return HTMLResponse(content="OK", status_code=200)


@app.websocket("/media-stream")
async def handle_media_stream(websocket: WebSocket):
    """Handle WebSocket connections between Twilio and OpenAI."""
    print("Client connected")
    await websocket.accept()

    async with websockets.connect(
            'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview',
            extra_headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "OpenAI-Beta": "realtime=v1"
            },
            ping_interval=600,
            ping_timeout=600) as openai_ws:
        await send_session_update(openai_ws)

        # Connection specific state
        stream_sid = None
        latest_media_timestamp = 0
        last_assistant_item = None
        mark_queue = []
        response_start_timestamp_twilio = None

        async def receive_from_twilio():
            """Receive audio data from Twilio and send it to the OpenAI Realtime API."""
            nonlocal stream_sid, latest_media_timestamp
            try:
                async for message in websocket.iter_text():
                    data = json.loads(message)
                    if data['event'] == 'media' and openai_ws.open:
                        latest_media_timestamp = int(
                            data['media']['timestamp'])
                        audio_append = {
                            "type": "input_audio_buffer.append",
                            "audio": data['media']['payload']
                        }
                        await openai_ws.send(json.dumps(audio_append))
                    elif data['event'] == 'start':
                        stream_sid = data['start']['streamSid']
                        print(f"Incoming stream has started {stream_sid}")
                        response_start_timestamp_twilio = None
                        latest_media_timestamp = 0
                        last_assistant_item = None
                    elif data['event'] == 'mark':
                        if mark_queue:
                            mark_queue.pop(0)
                    elif data['event'] == 'stop':
                        logger.info(
                            "Twilio call ended. Getting conversation summary..."
                        )
                        if call_sid:
                            # Get the latest conversation context
                            latest_response = send_to_twilio.latest_response if hasattr(
                                send_to_twilio, 'latest_response') else None
                            conversation_id = latest_response.get(
                                'response',
                                {}).get('conversation_id'
                                        ) if latest_response else None

                            if not conversation_id:
                                logger.warning(
                                    "No conversation ID found in latest response"
                                )
                                return

                            # Create a new summary task
                            async def get_conversation_summary():
                                summary_message = {
                                    "type": "conversation.item.create",
                                    "conversation_id": conversation_id,
                                    "item": {
                                        "type":
                                        "message",
                                        "role":
                                        "system",
                                        "content": [{
                                            "type":
                                            "text",
                                            "text":
                                            "Generate a concise summary (max 160 characters) of the conversation we just had, focusing on any health topics, symptoms, or advice discussed."
                                        }]
                                    }
                                }

                                try:
                                    await openai_ws.send(
                                        json.dumps(summary_message))
                                    await openai_ws.send(
                                        json.dumps({"type":
                                                    "response.create"}))
                                    summary = ""

                                    while True:
                                        response = await openai_ws.recv()
                                        data = json.loads(response)

                                        if data.get(
                                                'type'
                                        ) == 'response.content.delta':
                                            if data.get(
                                                    'delta',
                                                {}).get('type') == 'text':
                                                summary += data['delta'].get(
                                                    'text', '')

                                        elif data.get(
                                                'type') == 'response.done':
                                            break

                                    return summary if summary else "Thank you for your call with our AI health assistant."
                                except Exception as e:
                                    logger.error(
                                        f"Error getting summary: {str(e)}")
                                    return "Thank you for your call with our AI health assistant."

                            # Collect user and AI transcripts separately
                            user_transcripts = []
                            ai_transcripts = []
                            all_responses = getattr(send_to_twilio,
                                                    'all_responses', [])

                            # Initialize transcript arrays
                            user_transcripts = []
                            ai_transcripts = []

                            # Get user messages from input audio buffer commits
                            for response in all_responses:
                                if response.get(
                                        'type'
                                ) == 'input_audio_buffer.committed':
                                    for item in response.get('items', [{}]):
                                        for content in item.get(
                                                'content', [{}]):
                                            if content.get('type') == 'text':
                                                text = content.get('text',
                                                                   '').strip()
                                                if text:
                                                    user_transcripts.append(
                                                        text)
                                            elif 'transcript' in content:
                                                transcript = content[
                                                    'transcript'].strip()
                                                if transcript:
                                                    user_transcripts.append(
                                                        transcript)

                            # Get AI responses
                            for response in all_responses:
                                if response.get('type') == 'response.done':
                                    for item in response.get('response',
                                                             {}).get(
                                                                 'output', []):
                                        if item.get('role') == 'assistant':
                                            for content in item.get(
                                                    'content', []):
                                                if content.get(
                                                        'type') == 'audio':
                                                    ai_text = content.get(
                                                        'transcript',
                                                        '').strip()
                                                    if ai_text:
                                                        ai_transcripts.append(
                                                            ai_text)

                            # Create full conversation summary
                            conversation_parts = []
                            for i in range(
                                    max(len(user_transcripts),
                                        len(ai_transcripts))):
                                if i < len(ai_transcripts):
                                    # Trim AI responses if too long
                                    ai_text = ai_transcripts[
                                        i][:100] + "..." if len(
                                            ai_transcripts[i]
                                        ) > 100 else ai_transcripts[i]
                                    conversation_parts.append(f"AI: {ai_text}")
                                if i < len(user_transcripts):
                                    # Trim user messages if too long
                                    user_text = user_transcripts[
                                        i][:100] + "..." if len(
                                            user_transcripts[i]
                                        ) > 100 else user_transcripts[i]
                                    conversation_parts.append(
                                        f"User: {user_text}")

                            # Join with newlines for better readability in SMS
                            conversation_summary = "\n".join(
                                conversation_parts)

                            # If no conversation recorded, provide default message
                            if not conversation_summary:
                                conversation_summary = "No conversation recorded"

                            # Ensure we don't exceed SMS length limit (160 chars per message)
                            if len(conversation_summary
                                   ) > 1600:  # Allow for up to 10 SMS messages
                                conversation_summary = conversation_summary[:
                                                                            1597] + "..."

                            # Ensure summary isn't too long for SMS
                            if len(conversation_summary) > 160:
                                conversation_summary = conversation_summary[:
                                                                            157] + "..."

                            logger.info(
                                f"Generated conversation summary: {conversation_summary}"
                            )
                            success = await end_twilio_call_with_transcription(
                                call_sid, conversation_summary, include_transcription=True)
                            if success:
                                logger.info("Summary SMS sent successfully")
                            else:
                                logger.error("Failed to send summary SMS")

                        if openai_ws.open:
                            logger.info("Closing OpenAI WebSocket.")
                            await openai_ws.close()
                            await log_websocket_status(openai_ws)
                        return
            except WebSocketDisconnect:
                logger.warning("Client disconnected.")
                if openai_ws.open:
                    logger.info("Closing OpenAI WebSocket connection.")
                    await openai_ws.close()
                    await log_websocket_status(openai_ws)

        async def log_websocket_status(ws):
            """Utility function to log the state of the WebSocket connection."""
            if ws.open:
                logger.info("OpenAI WebSocket is still open.")
            else:
                logger.info("OpenAI WebSocket is now closed.")

        async def send_to_twilio():
            """Receive events from the OpenAI Realtime API, send audio back to Twilio."""
            nonlocal stream_sid, last_assistant_item, response_start_timestamp_twilio
            send_to_twilio.latest_response = None  # Static variable to track latest response
            send_to_twilio.all_responses = [
            ]  # Static variable to track all responses
            try:
                async for openai_message in openai_ws:
                    response = json.loads(openai_message)
                    if response['type'] in LOG_EVENT_TYPES:
                        print(f"Received event: {response['type']}", response)

                    if response.get(
                            'type'
                    ) == 'response.audio.delta' and 'delta' in response:
                        audio_payload = base64.b64encode(
                            base64.b64decode(
                                response['delta'])).decode('utf-8')
                        audio_delta = {
                            "event": "media",
                            "streamSid": stream_sid,
                            "media": {
                                "payload": audio_payload
                            }
                        }
                        await websocket.send_json(audio_delta)
                        if response_start_timestamp_twilio is None:
                            response_start_timestamp_twilio = latest_media_timestamp
                            if SHOW_TIMING_MATH:
                                print(
                                    f"Setting start timestamp for new response: {response_start_timestamp_twilio}ms"
                                )

                        # Update last_assistant_item safely
                        if response.get('item_id'):
                            last_assistant_item = response['item_id']

                        await send_mark(websocket, stream_sid)

                    if response.get(
                            'type') == 'response.function_call_arguments.done':
                        logger.info("call funciton")
                        function_name = response['name']
                        call_id = response['call_id']
                        arguments = json.loads(response['arguments'])
                        if function_name == 'EndCall':
                            logger.info("function getting called")
                            summary = arguments.get(
                                'summary',
                                'Thank you for your call with our AI assistant.'
                            )
                            await end_twilio_call_with_transcription(call_sid, summary, include_transcription=True)
                            logger.info("function called.")

                        elif (function_name == 'get_amenities_info'):
                            print(arguments['locationQuery'],
                                  arguments['searchStringsArray'])
                            # Start the async function but don't wait for it to complete
                            task = asyncio.create_task(
                                get_amenities_info(
                                    arguments['locationQuery'],
                                    arguments['searchStringsArray']))
                            logger.info(
                                "'get_amenities_info' is running in the background."
                            )

                            # Set the interval and timeout values
                            interval = 25  # Time to wait between checks (in seconds)
                            message_count = 0  # Counter to track interim messages sent

                            #its waiting longer than 25 seconds let me check why
                            while not task.done():
                                logger.info(
                                    "Checking if 'get_amenities_info' has completed..."
                                )

                                # Wait for the interval before the next check
                                await asyncio.sleep(interval)

                                if not task.done():
                                    # Send interim message if the task is still not completed
                                    logger.info(
                                        "Task is still running. Sending interim message."
                                    )
                                    interim_message = {
                                        "type": "conversation.item.create",
                                        "item": {
                                            "type": "message",
                                            "role": "user",
                                            "content": [{
                                                "type": "input_text",
                                                "text": "tell the caller 'Sorry for the delay, please give us 10 more seconds to fetch the information'. Do not try to call the function again... I just want you to make sure the caller knows you already have the information."
                                            }]
                                        }
                                    }
                                    await openai_ws.send(
                                        json.dumps(interim_message))
                                    await openai_ws.send(
                                        json.dumps({"type":
                                                    "response.create"}))
                                    logger.info(
                                        f"Interim message {message_count + 1} sent."
                                    )
                                    message_count += 1

                            # Once the task completes, retrieve the result
                            result = await task
                            logger.info(
                                "'get_amenities_info' completed successfully with result: %s",
                                result)

                            #note let me clear out anything else the ai was saying then have it say function respomse

                            # Proceed with the next step
                            function_response = {
                                "type": "conversation.item.create",
                                "item": {
                                    "type": "function_call_output",
                                    "call_id": call_id,
                                    "output": result
                                }
                            }
                            await openai_ws.send(json.dumps(function_response))
                            await openai_ws.send(
                                json.dumps({"type": "response.create"}))
                            logger.info("Final response sent successfully.")
                            '''
                               function_call_conversation_item = {
                            "type": "conversation.item.create",
                            "item": {
                                "type": "message",
                                "role": "user",
                                "content": [
                                    {
                                        "type": "input_text",
                                        "text": "you just called blah blah blah function call while waiting for the function I need you to continue the conversation "
                                    }
                                ]
                            }
                        }
                        await openai_ws.send(json.dumps(function_call_conversation_item)
                        await openai_ws.send(json.dumps({"type": "response.create"}))
                          '''

                    # Trigger an interruption. Your use case might work better using `input_audio_buffer.speech_stopped`, or combining the two.
                    if response.get(
                            'type') == 'input_audio_buffer.speech_started':
                        print("Speech started detected.")
                        if last_assistant_item:
                            print(
                                f"Interrupting response with id: {last_assistant_item}"
                            )
                            await handle_speech_started_event()
                    if response.get('type') == 'response.done':
                        send_to_twilio.latest_response = response
                        send_to_twilio.all_responses.append(response)
                        logger.info("function called.")
            except Exception as e:
                print(f"Error in send_to_twilio: {e}")

        async def handle_speech_started_event():
            """Handle interruption when the caller's speech starts."""
            nonlocal response_start_timestamp_twilio, last_assistant_item
            print("Handling speech started event.")
            if mark_queue and response_start_timestamp_twilio is not None:
                elapsed_time = latest_media_timestamp - response_start_timestamp_twilio
                if SHOW_TIMING_MATH:
                    print(
                        f"Calculating elapsed time for truncation: {latest_media_timestamp} - {response_start_timestamp_twilio} = {elapsed_time}ms"
                    )

                if last_assistant_item:
                    if SHOW_TIMING_MATH:
                        print(
                            f"Truncating item with ID: {last_assistant_item}, Truncated at: {elapsed_time}ms"
                        )

                    truncate_event = {
                        "type": "conversation.item.truncate",
                        "item_id": last_assistant_item,
                        "content_index": 0,
                        "audio_end_ms": elapsed_time
                    }
                    await openai_ws.send(json.dumps(truncate_event))

                await websocket.send_json({
                    "event": "clear",
                    "streamSid": stream_sid
                })

                mark_queue.clear()
                last_assistant_item = None
                response_start_timestamp_twilio = None

        async def send_mark(connection, stream_sid):
            if stream_sid:
                mark_event = {
                    "event": "mark",
                    "streamSid": stream_sid,
                    "mark": {
                        "name": "responsePart"
                    }
                }
                await connection.send_json(mark_event)
                mark_queue.append('responsePart')

        await asyncio.gather(receive_from_twilio(), send_to_twilio())


async def send_initial_conversation_item(openai_ws):
    """Send initial conversation item to make AI speak first."""
    initial_conversation_item = {
        "type": "conversation.item.create",
        "item": {
            "type":
            "message",
            "role":
            "assistant",
            "content": [{
                "type":
                "text",
                "text":
                "Hello there! I am an AI voice assistant that will help you with any questions you may have. Please ask me anything you want to know."
            }]
        }
    }
    await openai_ws.send(json.dumps(initial_conversation_item))
    await openai_ws.send(json.dumps({"type": "response.create"}))


async def send_session_update(openai_ws):
    """Send session update to OpenAI WebSocket."""

    session_update = {
        "type": "session.update",
        "session": {
            "turn_detection": {
                "type": "server_vad"
            },
            "input_audio_format":
            "g711_ulaw",
            "output_audio_format":
            "g711_ulaw",
            "voice":
            VOICE,
            "instructions":
            SYSTEM_MESSAGE,
            "modalities": ["text", "audio"],
            "temperature":
            0.8,
            "tools": [
                {
                    "type": "function",
                    "name": "EndCall",
                    "description":
                    "End the call and send a summary of the conversation to the user via SMS",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "summary": {
                                "type":
                                "string",
                                "description":
                                "A brief summary of what was discussed in the call"
                            }
                        },
                        "required": ["summary"]
                    }
                },
                {
                    "type": "function",
                    "name": "get_amenities_info",
                    "description":
                    "this function is used to get information on the amemties near the area the user is inteerested in renting",
                    "parameters": {
                        "type":
                        "object",
                        "properties": {
                            "locationQuery": {
                                "type":
                                "string",
                                "description":
                                "this will be the location the user is interested in renting. All the location the locations are in the us so value will always be city,state so for example if the address is in Houston, Texas, then the locationQuery will be 'Houston, Texas.'",
                                "pattern":
                                "^[A-Za-z]+(?: [A-Za-z]+)?,[A-Za-z]+(?: [A-Za-z]+)?$",
                            },
                            "searchStringsArray": {
                                "type": "string",
                                "description":
                                "this will be anemities they are intersted in knowing  more about maybe they are intersted in know pools are near this area then the searchStringsArray will be 'pools. Maybe they want know about the best gyms in the area then searchStringsArray will be 'gyms'. Each value here  should typically be a single word.",
                                "pattern": "^[a-zA-Z]+$"
                            },
                        },
                        "required": ["locationQuery,searchStringsArray"],
                        "additionalProperties":
                        False,
                        "examples": [{
                            "locationQuery": "Austin, Texas",
                            "searchStringsArray": ["pools", "gyms"]
                        }, {
                            "locationQuery": "Memphis,Tennessee",
                            "searchStringsArray": ["restaurants"]
                        }]
                    }
                },
            ],
            "tool_choice":
            "auto"
        }
    }
    print('Sending session update:', json.dumps(session_update))
    await openai_ws.send(json.dumps(session_update))

    await send_initial_conversation_item(openai_ws)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
