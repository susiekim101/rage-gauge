const { onRequest } = require("firebase-functions/v2/https");
const axios = require("axios");

exports.speak = onRequest(async (req, res) => {
  // 1. Grab the text from the URL (e.g., ?text=Hello)
  const textToSay = req.query.text;
  if (!textToSay) return res.status(400).send("No text provided");

  try {
    // 2. Make the request to ElevenLabs
    const response = await axios({
      method: "POST",
      url: `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
      },
      data: {
        text: textToSay,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      },
      responseType: "stream", // CRITICAL: This tells axios to stream the data, not wait for the whole file
    });

    // 3. Set the headers so the app knows audio is coming
    res.setHeader("Content-Type", "audio/mpeg");

    // 4. "Pipe" the audio directly to the user as it generates!
    response.data.pipe(res);
  } catch (error) {
    console.error("ElevenLabs Error:", error.message);
    res.status(500).send("Failed to generate audio");
  }
});

// /**
//  * Import function triggers from their respective submodules:
//  *
//  * const {onCall} = require("firebase-functions/v2/https");
//  * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
//  *
//  * See a full list of supported triggers at https://firebase.google.com/docs/functions
//  */

// const {setGlobalOptions} = require("firebase-functions");
// const {onRequest} = require("firebase-functions/https");
// const logger = require("firebase-functions/logger");

// // For cost control, you can set the maximum number of containers that can be
// // running at the same time. This helps mitigate the impact of unexpected
// // traffic spikes by instead downgrading performance. This limit is a
// // per-function limit. You can override the limit for each function using the
// // `maxInstances` option in the function's options, e.g.
// // `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// // NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// // functions should each use functions.runWith({ maxInstances: 10 }) instead.
// // In the v1 API, each function can only serve one request per container, so
// // this will be the maximum concurrent request count.
// setGlobalOptions({ maxInstances: 10 });

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started

// // exports.helloWorld = onRequest((request, response) => {
// //   logger.info("Hello logs!", {structuredData: true});
// //   response.send("Hello from Firebase!");
// // });
