const sessions = {};

const findOrCreateSession = (alexaid) => {
    let sessionId;
    // Let's see if we already have a session for the user alexaid
    Object.keys(sessions).forEach(k => {
        if (sessions[k].alexaid === alexaid) {
            // Yep, got it!
            sessionId = k;
        }
    });
    if (!sessionId) {
        // No session found for user alexaid, let's create a new one
        sessionId = new Date().toISOString();
        sessions[sessionId] = 
            {   
                balance: 200
            };
    }
    return sessionId;
};

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    console.log("recieved event");
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */

    // if (event.session.application.applicationId !== "") {
    //     context.fail("Invalid Application ID");
    //  }

        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    // add any session init logic here
    sessions[session.sessionId]
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {

    var intent = intentRequest.intent;
    var intentName = intentRequest.intent.name;

    // dispatch custom intents to handlers here
    if (intentName == "CheckIntent"){
        handleCheck(intent, session, callback);
    }
    else if(intentName == "DepositIntent"){
        handleDeposit(intent, session, callback);
    }
    else if(intentName == "WithdrawIntent"){
        handleWithdraw(intent, session, callback);
    }
    else if(intentName == "AMAZON.HelpIntent"){
        handleGetHelpRequest(intent, session, callback);
    }
    else if(intentName == "AMAZON.StopIntent"){
        handleFinishSessionRequest(intent, session, callback);
    }
    else{
        throw "Invalid intent";
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {

}

// ------- Skill specific logic -------

function getWelcomeResponse(callback) {
    var speechOutput = "Welcome to the bank. What can I do for you?";
    var reprompt = "You can check your current balance, deposit, and withdraw money.";
    var header = "Test Bank";
    var shouldEndSession = false;
    var sessionAttributes = {
        "speechOutput": "Welcome to the bank. What can I do for you?",
        "reprompt": "You can check your current balance, deposit, and withdraw money.",
    }
    callback(sessionAttributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession));
}

function handleCheck(intent, session, callback){
    var sessionId = findOrCreateSession(session.sessionId);
    var speechOutput = "Sure. You have " + sessions[sessionId].balance + " dollars in your account.";
    var reprompt = "Anything else I can do for you?";
    var header = "Test Bank Balance";
    var shouldEndSession = false;
    callback(session.attributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession));
}

function handleDeposit(intent, session, callback){
    var sessionId = findOrCreateSession(session.sessionId);
    var amount = parseInt(intent.slots.amount.value);
    if(amount > 0){
        sessions[sessionId].balance = sessions[sessionId].balance + amount;
        var speechOutput = "Sure. We have deposited " + amount + " dollars into your account. You now have a balance of " + sessions[sessionId].balance + " dollars.";
    } else{
        var speechOutput = "You must deposit at least 1 dollar.";
    }
    var reprompt = "What else can I do for you?";
    var header = "Test Bank Deposit";
    var shouldEndSession = false;
    callback(session.attributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession));2
}

function handleWithdraw(intent, session, callback){
    var sessionId = findOrCreateSession(session.sessionId);
    var amount = parseInt(intent.slots.amount.value);
    if(sessions[sessionId].balance - amount >= 0){
        sessions[sessionId].balance = sessions[sessionId].balance - amount;
        var speechOutput = "Sure. We have withdrawn " + amount + " dollars from your account. You now have a balance of " + sessions[sessionId].balance + " dollars.";
    } else{
        var speechOutput = "You don't have enough money in your account for that action.";
    }
    var reprompt = "What else can I do for you?";
    var header = "Test Bank Withdraw";
    var shouldEndSession = false;
    callback(session.attributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession));
}

function handleGetHelpRequest(intent, session, callback) {
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }
    var speechOutput = "Sure. You can check your current balance, deposit, and withdraw money.";
    var reprompt = "Anything else I can do for you?";
    var header = "Test Bank Help";
    var shouldEndSession = false;
    callback(session.attributes, buildSpeechletResponse(header, speechOutput, reprompt, shouldEndSession));
}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye! Thank you for visiting the bank", "", true));
}

// ------- Helper functions to build responses for Alexa -------
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}