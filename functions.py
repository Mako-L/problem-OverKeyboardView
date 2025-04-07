from twilio.rest import Client
import os
import logging
import requests
import httpx
import asyncio

logger = logging.getLogger(__name__)

async def end_twilio_call(call_sid, summary):
    """
    End a Twilio call using the CallSid and send a summary SMS.

    :param call_sid: The SID of the call to end
    :param summary: The summary of the conversation to send via SMS
    :return: True if the call was ended successfully, False otherwise
    """
    try:
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        from_number = os.getenv('TWILIO_PHONE_NUMBER')
        client = Client(account_sid, auth_token)
        
        logger.info("Fetching call details...")
        # Get call details
        call = client.calls(call_sid).fetch()
        to_number = call.to
        
        logger.info("Ending call...")
        # End the call
        call = client.calls(call_sid).update(status='completed')
        logger.info(f"Call with SID {call_sid} ended successfully.")
        
        logger.info("Sending summary SMS...")
        # Send summary SMS
        message = client.messages.create(
            body=summary,
            from_=from_number,
            to=to_number
        )
        logger.info(f"Summary SMS sent successfully to {to_number}: {summary}")
        
        return True
    except Exception as e:
        logger.error(f"Error in end_twilio_call: {str(e)}")
        logger.error(f"Error details - account_sid: {account_sid}, from_number: {from_number}, to_number: {to_number if 'to_number' in locals() else 'Not set'}")
        return False

async def get_amenities_info(location_query, search_strings_array):
    """
    Fetch amenities information using the Apify API.

    Parameters:
        location_query (str): The location to query (e.g., "New York, USA").
        search_strings_array (list): A list of search strings (e.g., ["restaurant"]).

    Returns:
        dict: The API response as a dictionary.
    """
    # API URL
    api_url = "https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items"

    # Token for authentication
    token = "apify_api_vpUlvH7UH9XXWgdn2S00qJJaM4nXyj1haY6P"

    # Request body
    body = {
        "includeWebResults": False,
        "language": "en",
        "locationQuery": location_query,
        "maxCrawledPlacesPerSearch": 3,
        "maxImages": 0,
        "maxReviews": 0,
        "onlyDataFromSearchPage": False,
        "scrapeDirectories": False,
        "scrapeImageAuthors": False,
        "scrapeReviewsPersonalData": True,
        "scrapeTableReservationProvider": False,
        "searchStringsArray": search_strings_array,
        "skipClosedPlaces": False
    }

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "httpx/1.0"
    }

    async with httpx.AsyncClient(timeout=120) as client:
        print(body)
        response = await client.post(f"{api_url}?token={token}", json=body, headers=headers)

        # Check for successful response
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()

async def start_call_recording(call_sid):
    """
    Start recording a call using the Twilio API.
    
    Args:
        call_sid (str): The SID of the call to record
        
    Returns:
        str: The recording SID if successful, None otherwise
    """
    try:
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        client = Client(account_sid, auth_token)
        
        # Simplified approach with no extra parameters to avoid errors
        recording = client.calls(call_sid).recordings.create()
        
        logger.info(f"Started recording call {call_sid}, recording SID: {recording.sid}")
        return recording.sid
    except Exception as e:
        logger.error(f"Error starting call recording: {str(e)}")
        return None

async def get_call_transcription(call_sid):
    """
    Get the transcription of a call recording.
    
    Args:
        call_sid (str): The SID of the call to get the transcription for
        
    Returns:
        str: The transcription text if successful, None otherwise
    """
    try:
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        client = Client(account_sid, auth_token)
        
        # Get recordings for the call
        logger.info(f"Fetching recordings for call {call_sid}")
        recordings = client.calls(call_sid).recordings.list()
        
        if not recordings:
            logger.warning(f"No recordings found for call {call_sid}")
            return None
        
        logger.info(f"Found {len(recordings)} recordings for call {call_sid}")
        
        # Get the most recent recording
        recording = recordings[0]
        logger.info(f"Using recording {recording.sid} with status {recording.status}")
        
        # Check if recording is complete
        retries = 0
        max_retries = 30  # Increase max retries (30 * 2s = 60s max wait time)
        retry_delay = 2  # seconds between retries
        
        while recording.status != 'completed' and retries < max_retries:
            logger.info(f"Waiting for recording {recording.sid} to complete, status: {recording.status}")
            await asyncio.sleep(retry_delay)
            recording = client.recordings(recording.sid).fetch()
            retries += 1
        
        if recording.status != 'completed':
            logger.warning(f"Recording {recording.sid} not completed after {retries} retries")
            return "Recording is still being processed. Transcription will be available later."
        
        # Transcription can't be created directly via API for recordings created with the API
        # We need to inform the user that automatic transcription isn't available
        recording_url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Recordings/{recording.sid}.mp3"
        
        # You could use a third-party transcription service here if needed
        return f"Recording is available but automatic transcription is not supported for API-initiated recordings. You can access the recording audio at: {recording.sid}"
            
    except Exception as e:
        logger.error(f"Error getting call transcription: {str(e)}")
        return f"Error during transcription process: {str(e)}"

def get_recording_public_url(account_sid, auth_token, recording_sid):
    """
    Generate a shareable URL for a recording.
    
    Args:
        account_sid (str): The Twilio account SID
        auth_token (str): The Twilio auth token
        recording_sid (str): The recording SID
        
    Returns:
        str: A URL for accessing the recording
    """
    try:
        # Direct download URL (requires auth)
        download_url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Recordings/{recording_sid}.mp3"
        
        # Return both formats
        return f"Recording SID: {recording_sid}\nAccess via Twilio Console or API"
    except Exception as e:
        logger.error(f"Error generating recording URL: {str(e)}")
        return None

async def end_twilio_call_with_transcription(call_sid, summary, include_transcription=True):
    """
    End a Twilio call using the CallSid and send a summary SMS with recording information.

    :param call_sid: The SID of the call to end
    :param summary: The summary of the conversation to send via SMS
    :param include_transcription: Whether to include transcription in a follow-up SMS
    :return: True if the call was ended successfully, False otherwise
    """
    try:
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        from_number = os.getenv('TWILIO_PHONE_NUMBER')
        client = Client(account_sid, auth_token)
        
        logger.info("Fetching call details...")
        # Get call details
        call = client.calls(call_sid).fetch()
        to_number = call.to
        
        # Get recordings for the call
        recordings = []
        recording_info = ""
        try:
            recordings = client.calls(call_sid).recordings.list()
            if recordings:
                recording = recordings[0]
                recording_info = f"\n\nYour call has been recorded."
                recording_info += f"\nRecording ID: {recording.sid}"
                if hasattr(recording, 'duration') and recording.duration:
                    recording_info += f"\nDuration: {recording.duration} seconds"
                
                # Add note about follow-up message with transcription
                recording_info += "\n\nWe'll send you the call transcription in a follow-up message shortly."
        except Exception as e:
            logger.error(f"Error getting recording info: {str(e)}")
        
        logger.info("Ending call...")
        # End the call
        call = client.calls(call_sid).update(status='completed')
        logger.info(f"Call with SID {call_sid} ended successfully.")
        
        # Prepare message body
        message_body = summary
        
        # Add recording info if available
        if recording_info:
            message_body += recording_info
        
        logger.info("Sending immediate summary SMS...")
        # Send summary SMS
        message = client.messages.create(
            body=message_body,
            from_=from_number,
            to=to_number
        )
        logger.info(f"Summary SMS sent successfully to {to_number}")
        
        # Start a background task to send transcription later without blocking the call ending
        if include_transcription and recordings:
            asyncio.create_task(send_transcription_sms(call_sid, to_number, from_number))
            logger.info(f"Scheduled follow-up transcription SMS task")
        
        return True
    except Exception as e:
        logger.error(f"Error in end_twilio_call: {str(e)}")
        logger.error(f"Error details - account_sid: {account_sid}, from_number: {from_number}, to_number: {to_number if 'to_number' in locals() else 'Not set'}")
        return False

async def send_transcription_sms(call_sid, to_number, from_number):
    """
    Send a follow-up SMS with the transcription from Whisper API.
    
    Args:
        call_sid (str): The call SID
        to_number (str): The recipient's phone number 
        from_number (str): The sender's phone number
    """
    try:
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        client = Client(account_sid, auth_token)
        
        # Give the recording more time to complete
        await asyncio.sleep(60)
        
        # Get recordings for the call
        recordings = client.calls(call_sid).recordings.list()
        
        if not recordings:
            logger.warning(f"No recordings found for call {call_sid}")
            message = "We couldn't find any recordings for your recent call."
        else:
            recording = recordings[0]
            recording_sid = recording.sid
            
            # Wait for recording to complete if needed
            retries = 0
            while recording.status != 'completed' and retries < 10:
                logger.info(f"Waiting for recording {recording.sid} to complete, status: {recording.status}")
                await asyncio.sleep(5)
                recording = client.recordings(recording.sid).fetch()
                retries += 1
            
            if recording.status != 'completed':
                message = f"Your call recording (ID: {recording_sid}) is still being processed. Please try again later."
            else:
                # Transcribe the recording using Whisper
                transcription = await transcribe_with_whisper(recording_sid)
                
                # Create an informative message with the recording details and transcription
                message = "Your call recording transcript:\n\n"
                message += transcription
                
                # Add recording details
                message += f"\n\nRecording ID: {recording_sid}"
                if hasattr(recording, 'duration') and recording.duration:
                    message += f"\nDuration: {recording.duration} seconds"
        
        # Send SMS with recording information and transcription
        sms = client.messages.create(
            body=message,
            from_=from_number,
            to=to_number
        )
        
        logger.info(f"Transcription SMS sent successfully to {to_number}")
        
    except Exception as e:
        logger.error(f"Error sending transcription SMS: {str(e)}")

async def transcribe_with_whisper(recording_sid):
    """
    Download a Twilio recording and transcribe it using OpenAI's Whisper API.
    
    Args:
        recording_sid (str): The SID of the Twilio recording
        
    Returns:
        str: The transcription text if successful, None otherwise
    """
    try:
        account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        openai_api_key = os.getenv('OPENAI_API_KEY')
        
        if not openai_api_key:
            logger.error("OPENAI_API_KEY environment variable not set")
            return "OpenAI API key not configured. Unable to transcribe."
        
        # Download the recording
        recording_url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Recordings/{recording_sid}.mp3"
        auth = (account_sid, auth_token)
        
        logger.info(f"Downloading recording from {recording_url}")
        response = requests.get(recording_url, auth=auth)
        
        if response.status_code != 200:
            logger.error(f"Failed to download recording: {response.status_code} - {response.text}")
            return f"Failed to download recording: {response.status_code}"
        
        # Save the recording temporarily
        temp_file_path = f"/tmp/{recording_sid}.mp3"
        with open(temp_file_path, 'wb') as f:
            f.write(response.content)
        
        logger.info(f"Saved recording to {temp_file_path}")
        
        # Prepare the request to OpenAI
        headers = {
            "Authorization": f"Bearer {openai_api_key}"
        }
        
        logger.info("Sending recording to OpenAI for transcription")
        
        # Use multipart form data to send the file
        with open(temp_file_path, 'rb') as f:
            files = {
                'file': (f"{recording_sid}.mp3", f),
                'model': (None, "whisper-1"),
                'response_format': (None, 'text')
            }
            
            transcription_response = requests.post(
                "https://api.openai.com/v1/audio/transcriptions",
                headers=headers,
                files=files
            )
        
        # Clean up the temporary file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            logger.info(f"Removed temporary file {temp_file_path}")
        
        if transcription_response.status_code == 200:
            transcription_text = transcription_response.text
            logger.info(f"Transcription successful: {transcription_text[:100]}...")
            return transcription_text
        else:
            logger.error(f"Transcription failed: {transcription_response.status_code} - {transcription_response.text}")
            return f"Transcription failed with status code {transcription_response.status_code}"
            
    except Exception as e:
        logger.error(f"Error in transcribe_with_whisper: {str(e)}")
        return f"Error during transcription: {str(e)}"
